import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  MoreThan,
  In,
  Not,
  IsNull,
  SelectQueryBuilder,
} from 'typeorm';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { User } from './user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { Settings } from '../../config/setting.config';
import { SettingKey } from '../setting/enums/setting-key.enum';
import { UserGuard } from '../user-guard/user-guard.entity';
import { ENV } from '../../config/constants';
import { UserBoostService } from '../user-boost/user-boost.service';
import { UserBoostType } from '../user-boost/enums/user-boost-type.enum';
import { UserAccessoryService } from '../user-accessory/user-accessory.service';
import { UserBoost } from '../user-boost/user-boost.entity';
import { EventHistoryService } from '../event-history/event-history.service';
import { EventHistoryType } from '../event-history/enums/event-history-type.enum';
import { StolenItem } from '../clan-war/entities/stolen-item.entity';
import { StolenItemType } from '../clan-war/enums/stolen-item-type.enum';
import { EventHistoryItemResponseDto } from './dtos/responses/event-history-item-response.dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { UserBasicStatsResponseDto } from './dtos/responses/user-with-basic-stats-response.dto';
import { CurrentUserResponseDto } from './dtos/responses/user-me-response.dto';
import { UserRatingResponseDto } from './dtos/responses/user-rating-response.dto';
import { UserTrainingResponseDto } from './dtos/responses/training-response.dto';
import { UserGuardResponseDto } from '../user-guard/dtos/responses/user-guard-response.dto';
import { UserContractResponseDto } from './dtos/responses/contract-response.dto';
import {
  InventoryResponseDto,
  AccessoriesCategoryResponseDto,
} from './dtos/responses/inventory-response.dto';
import { UserBoostResponseDto } from '../user-boost/dtos/responses/user-boost-response.dto';
import { UserAccessoryResponseDto } from '../user-accessory/dtos/responses/user-accessory-response.dto';
import { UserAttackPlayerResponseDto } from './dtos/responses/attack-player-response.dto';
import { UserTaskService } from '../task/services/user-task.service';
import { TaskType } from '../task/enums/task-type.enum';
import { UserTaskStatus } from '../task/enums/user-task-status.enum';
import { UserTasksResponseDto } from './dtos/responses/user-tasks-response.dto';
import { UserTaskResponseDto } from '../task/dtos/responses/user-task-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserGuard)
    private readonly userGuardRepository: Repository<UserGuard>,
    @InjectRepository(StolenItem)
    private readonly stolenItemRepository: Repository<StolenItem>,
    private readonly userBoostService: UserBoostService,
    private readonly userAccessoryService: UserAccessoryService,
    private readonly eventHistoryService: EventHistoryService,
    private readonly userTaskService: UserTaskService,
  ) {}

  private calculateUserPower(guards: UserGuard[]): number {
    if (!guards || guards.length === 0) return 0;
    return guards.reduce((sum, guard) => sum + Number(guard.strength), 0);
  }

  private getGuardsCount(guards: UserGuard[]): number {
    return guards ? guards.length : 0;
  }

  async updateUserGuardsStats(userId: number): Promise<void> {
    const result = await this.userGuardRepository
      .createQueryBuilder('guard')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(guard.strength), 0)', 'strength')
      .where('guard.user_id = :userId', { userId })
      .getRawOne();

    const guardsCount = parseInt(result.count, 10) || 0;
    const strength = parseInt(result.strength, 10) || 0;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'clan_id'],
    });

    await this.userRepository.update(userId, {
      guards_count: guardsCount,
      strength: strength,
    });

    if (user?.clan_id) {
      await this.userRepository.manager.query(
        `UPDATE clan SET 
          strength = (SELECT COALESCE(SUM(strength), 0) FROM "user" WHERE clan_id = $1),
          guards_count = (SELECT COALESCE(SUM(guards_count), 0) FROM "user" WHERE clan_id = $1)
        WHERE id = $1`,
        [user.clan_id],
      );
    }
  }

  async updateUserReferralsCount(referrerId: number): Promise<void> {
    const referralsCount = await this.userRepository.count({
      where: { referrerId: referrerId },
    });

    await this.userRepository.update(referrerId, {
      referrals_count: referralsCount,
    });
  }

  private isInitialReferrer(
    userVkId: number,
    initialReferrerVkId: number | undefined,
  ): boolean {
    return !!(
      initialReferrerVkId &&
      initialReferrerVkId > 0 &&
      Number(userVkId) === Number(initialReferrerVkId)
    );
  }

  private async getShieldEndTimeFromBoost(
    userId: number,
  ): Promise<Date | null> {
    const activeBoosts = await this.userBoostService.findActiveByUserId(userId);
    const shieldBoost = activeBoosts.find(
      (b) => b.type === UserBoostType.SHIELD,
    );
    return shieldBoost?.end_time || null;
  }

  private transformUserForResponse(
    user: User,
  ): User & { referral_link?: string } {
    const transformed: any = { ...user };
    if (user.referral_link_id) {
      transformed.referral_link = `${ENV.VK_APP_URL}#ref_${user.referral_link_id}`;
      delete transformed.referral_link_id;
    }
    return transformed;
  }

  private async downloadAndSaveUserAvatar(
    photoUrl: string,
    userId: number,
  ): Promise<string | null> {
    try {
      if (!photoUrl || !photoUrl.startsWith('http')) {
        return null;
      }

      const response = await fetch(photoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const uploadDir = path.join(process.cwd(), 'data', 'user-avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExtension = path.extname(new URL(photoUrl).pathname) || '.jpg';
      const fileName = `user-${userId}-${Date.now()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);

      return path.join('data', 'user-avatars', fileName).replace(/\\/g, '/');
    } catch (error) {
      console.error(`Error downloading user avatar: ${error.message}`);
      return null;
    }
  }

  private formatBirthday(bdate?: string, visibility?: number): string | null {
    if (!bdate || visibility === undefined) return null;

    switch (visibility) {
      case 0:
        return null;
      case 1:
        return bdate;
      case 2:
        return bdate;
      default:
        return null;
    }
  }

  private async ensureUserAvatarExists(
    user: User,
    photoUrl?: string,
  ): Promise<void> {
    if (user.image_path && !user.image_path.startsWith('http')) {
      const fullPath = path.join(process.cwd(), user.image_path);
      if (fs.existsSync(fullPath)) {
        return;
      }
    }

    const urlToDownload =
      photoUrl ||
      (user.image_path?.startsWith('http') ? user.image_path : null);

    if (!urlToDownload) {
      return;
    }

    const imagePath = await this.downloadAndSaveUserAvatar(
      urlToDownload,
      user.id,
    );
    if (imagePath) {
      user.image_path = imagePath;
      await this.userRepository.save(user);
    }
  }

  private async transformToCurrentUserResponseDto(
    user: User,
    equippedAccessories: any[],
    trainingCost: number,
    contractIncome: number,
    referrerMoneyReward: number,
    shieldBoostsMap?: Map<number, Date | null>,
  ): Promise<CurrentUserResponseDto> {
    const transformed = this.transformUserForResponse(user);
    const guardsCount = user.guards_count ?? 0;
    const strength = user.strength ?? 0;
    const showAdv = this.getShowAdv(user);
    const advDisableCost = Settings[
      SettingKey.ADV_DISABLE_COST_VOICES_COUNT
    ] as number;
    const referralsCount = user.referrals_count ?? 0;
    const shieldEndTime = shieldBoostsMap
      ? shieldBoostsMap.get(user.id) || null
      : await this.getShieldEndTimeFromBoost(user.id);

    const activeBoosts = await this.userBoostService.findActiveByUserId(
      user.id,
    );
    const cooldownHalvingBoost = activeBoosts.find(
      (b) => b.type === UserBoostType.COOLDOWN_HALVING,
    );

    let trainingCooldown = Settings[SettingKey.TRAINING_COOLDOWN];
    let contractCooldown = Settings[SettingKey.CONTRACT_COOLDOWN];
    let attackCooldown = Settings[SettingKey.ATTACK_COOLDOWN];
    if (
      cooldownHalvingBoost &&
      cooldownHalvingBoost.end_time &&
      cooldownHalvingBoost.end_time > new Date()
    ) {
      trainingCooldown = trainingCooldown / 2;
      contractCooldown = contractCooldown / 2;
      attackCooldown = attackCooldown / 2;
    }

    const trainingEndTime = user.last_training_time
      ? new Date(user.last_training_time.getTime() + trainingCooldown)
      : undefined;
    const contractEndTime = user.last_contract_time
      ? new Date(user.last_contract_time.getTime() + contractCooldown)
      : undefined;
    const attackEndTime = user.last_attack_time
      ? new Date(user.last_attack_time.getTime() + attackCooldown)
      : undefined;

    return {
      id: transformed.id,
      vk_id: transformed.vk_id,
      first_name: transformed.first_name,
      last_name: transformed.last_name,
      image_path: transformed.image_path || null,
      money: transformed.money,
      shield_end_time: shieldEndTime || undefined,
      clan_id: transformed.clan_id,
      strength,
      guards_count: guardsCount,
      equipped_accessories: equippedAccessories || [],
      referral_link: transformed.referral_link,
      training_cost: trainingCost,
      contract_income: contractIncome,
      referrer_money_reward: referrerMoneyReward,
      show_adv: showAdv,
      adv_disable_cost_voices_count: advDisableCost,
      referrals_count: referralsCount,
      training_end_time:
        trainingEndTime && trainingEndTime > new Date()
          ? trainingEndTime
          : undefined,
      contract_end_time:
        contractEndTime && contractEndTime > new Date()
          ? contractEndTime
          : undefined,
      attack_end_time:
        attackEndTime && attackEndTime > new Date() ? attackEndTime : undefined,
    };
  }

  private async transformToUserBasicStatsResponseDto(
    user: User,
    shieldBoostsMap?: Map<number, Date | null>,
  ): Promise<UserBasicStatsResponseDto> {
    const transformed = this.transformUserForResponse(user);
    const guardsCount = user.guards_count ?? 0;
    const strength = user.strength ?? 0;
    const guardAsUserStrength = user.user_as_guard
      ? Number(user.user_as_guard.strength)
      : null;
    const referralsCount = user.referrals_count ?? 0;
    const shieldEndTime = shieldBoostsMap
      ? shieldBoostsMap.get(user.id) || null
      : await this.getShieldEndTimeFromBoost(user.id);

    return {
      id: transformed.id,
      vk_id: transformed.vk_id,
      first_name: transformed.first_name,
      last_name: transformed.last_name,
      sex: transformed.sex,
      image_path: transformed.image_path || null,
      birthday_date: transformed.birthday_date,
      money: transformed.money,
      shield_end_time: shieldEndTime || undefined,
      last_training_time: transformed.last_training_time,
      last_contract_time: transformed.last_contract_time,
      last_attack_time: transformed.last_attack_time,
      clan_leave_time: transformed.clan_leave_time,
      status: transformed.status,
      registered_at: transformed.registered_at,
      last_login_at: transformed.last_login_at,
      clan_id: transformed.clan_id,
      strength,
      guards_count: guardsCount,
      first_guard_strength: guardAsUserStrength,
      referral_link: transformed.referral_link,
      referrals_count: referralsCount,
    };
  }

  private transformToUserRatingResponseDto(
    user: User,
    equippedAccessories?: any[],
    shieldBoostsMap?: Map<number, Date | null>,
  ): UserRatingResponseDto {
    const guardsCount = user.guards_count ?? 0;
    const strength = user.strength ?? 0;

    return {
      id: user.id,
      vk_id: user.vk_id,
      first_name: user.first_name,
      last_name: user.last_name,
      image_path: user.image_path || null,
      strength,
      guards_count: guardsCount,
      equipped_accessories: equippedAccessories || null,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<UserBasicStatsResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      relations: ['guards', 'referrals'],
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    const userIds = users.map((user) => user.id);
    const shieldBoostsMap =
      await this.userBoostService.findActiveShieldBoostsByUserIds(userIds);

    const dataWithStrength = users.map((user) => {
      const guardsCount = user.guards_count ?? 0;
      const strength = user.strength ?? 0;
      const referralsCount = user.referrals_count ?? 0;
      const firstGuardStrength = user.user_as_guard?.strength
        ? Number(user.user_as_guard.strength)
        : null;

      const transformed = this.transformUserForResponse(user);
      const shieldEndTime = shieldBoostsMap
        ? shieldBoostsMap.get(user.id) || null
        : null;

      return {
        id: transformed.id,
        vk_id: transformed.vk_id,
        first_name: transformed.first_name,
        last_name: transformed.last_name,
        sex: transformed.sex,
        image_path: transformed.image_path || null,
        birthday_date: transformed.birthday_date,
        money: transformed.money,
        shield_end_time: shieldEndTime || undefined,
        last_training_time: transformed.last_training_time,
        last_contract_time: transformed.last_contract_time,
        last_attack_time: transformed.last_attack_time,
        clan_leave_time: transformed.clan_leave_time,
        status: transformed.status,
        registered_at: transformed.registered_at,
        last_login_at: transformed.last_login_at,
        clan_id: transformed.clan_id,
        strength,
        guards_count: guardsCount,
        first_guard_strength: firstGuardStrength,
        referral_link: transformed.referral_link,
        referrals_count: referralsCount,
      } as UserBasicStatsResponseDto;
    });

    return {
      data: dataWithStrength,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<UserBasicStatsResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['guards', 'referrals'],
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    const guardsCount = user.guards_count ?? 0;
    const strength = user.strength ?? 0;
    const referralsCount = user.referrals_count ?? 0;
    const firstGuardStrength = user.user_as_guard?.strength
      ? Number(user.user_as_guard.strength)
      : null;

    const transformed = this.transformUserForResponse(user);
    const shieldEndTime = await this.getShieldEndTimeFromBoost(user.id);

    return {
      id: transformed.id,
      vk_id: transformed.vk_id,
      first_name: transformed.first_name,
      last_name: transformed.last_name,
      sex: transformed.sex,
      image_path: transformed.image_path || null,
      birthday_date: transformed.birthday_date,
      money: transformed.money,
      shield_end_time: shieldEndTime || undefined,
      last_training_time: transformed.last_training_time,
      last_contract_time: transformed.last_contract_time,
      last_attack_time: transformed.last_attack_time,
      clan_leave_time: transformed.clan_leave_time,
      status: transformed.status,
      registered_at: transformed.registered_at,
      last_login_at: transformed.last_login_at,
      clan_id: transformed.clan_id,
      strength,
      guards_count: guardsCount,
      first_guard_strength: firstGuardStrength,
      referral_link: transformed.referral_link,
      referrals_count: referralsCount,
    } as UserBasicStatsResponseDto;
  }

  async findMe(userId: number): Promise<CurrentUserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guards', 'referrals'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const equippedAccessories =
      await this.userAccessoryService.findEquippedByUserId(user.id);
    const currentPower = user.strength ?? 0;

    const training_cost = Math.round(10 * Math.pow(1 + currentPower, 1.2));
    const contract_income = Math.max(Math.round(training_cost * 0.55), 6);
    const referrerMoneyReward = Settings[
      SettingKey.REFERRER_MONEY_REWARD
    ] as number;

    return await this.transformToCurrentUserResponseDto(
      user,
      equippedAccessories,
      training_cost,
      contract_income,
      referrerMoneyReward,
    );
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserBasicStatsResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['guards'],
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);
    return this.transformToUserBasicStatsResponseDto(updatedUser);
  }

  async training(userId: number): Promise<UserTrainingResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guards'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const activeBoosts = await this.userBoostService.findActiveByUserId(userId);
    const cooldownHalvingBoost = activeBoosts.find(
      (b) => b.type === UserBoostType.COOLDOWN_HALVING,
    );

    let trainingCooldown = Settings[SettingKey.TRAINING_COOLDOWN];
    let contractCooldown = Settings[SettingKey.CONTRACT_COOLDOWN];
    if (
      cooldownHalvingBoost &&
      cooldownHalvingBoost.end_time &&
      cooldownHalvingBoost.end_time > new Date()
    ) {
      trainingCooldown = trainingCooldown / 2;
      contractCooldown = contractCooldown / 2;
    }

    if (user.last_training_time) {
      const cooldownEndTime = new Date(
        user.last_training_time.getTime() + trainingCooldown,
      );
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException({
          message: 'Тренировка еще не завершена',
          cooldown_end: cooldownEndTime,
        });
      }
    }

    if (user.last_contract_time) {
      const cooldownEndTime = new Date(
        user.last_contract_time.getTime() + contractCooldown,
      );
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException({
          message: 'Нельзя начать тренировку, пока идёт контракт',
          cooldown_end: cooldownEndTime,
        });
      }
    }

    if (!user.guards || user.guards.length === 0) {
      throw new BadRequestException('У пользователя нет стражей');
    }

    const current_power = user.strength ?? 0;
    const guards_count = user.guards_count ?? 0;

    const training_cost = Math.round(10 * Math.pow(1 + current_power, 1.2));

    const userMoney = Number(user.money);
    if (userMoney < training_cost) {
      throw new BadRequestException('Недостаточно средств для тренировки');
    }

    const base_power_increase = Math.max(
      3 + guards_count * 0.5,
      current_power * 0.1,
    );

    const random_bonus_chance = Math.min(
      3,
      guards_count * (current_power * 0.001),
    );
    const random_value = Math.random() * 100;
    let random_bonus = 0;

    if (random_value < random_bonus_chance) {
      random_bonus = Math.round(guards_count * 0.2);
    }

    const total_power_increase = Math.round(base_power_increase + random_bonus);
    const powerIncreasePerGuard = Math.round(
      total_power_increase / guards_count,
    );

    const maxStrengthFirstGuard = Settings[
      SettingKey.MAX_STRENGTH_FIRST_USER_GUARD
    ] as number;

    for (const guard of user.guards) {
      const newStrength = Number(guard.strength) + powerIncreasePerGuard;

      if (guard.is_first && newStrength > maxStrengthFirstGuard) {
        guard.strength = maxStrengthFirstGuard;
      } else {
        guard.strength = newStrength;
      }

      await this.userGuardRepository.save(guard);
    }

    await this.updateUserGuardsStats(userId);

    user.money = Number(user.money) - training_cost;
    user.last_training_time = new Date();

    await this.userRepository.save(user);

    await this.userTaskService.updateTaskProgress(
      userId,
      TaskType.COMPLETE_TRAINING,
    );

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guards'],
    });

    if (!updatedUser || !updatedUser.guards) {
      throw new NotFoundException(
        'Пользователь или стражи не найдены после тренировки',
      );
    }

    const new_power = updatedUser.strength ?? 0;

    const trainingCooldownEnd = new Date(
      new Date().getTime() + trainingCooldown,
    );

    const equippedAccessories =
      await this.userAccessoryService.findEquippedByUserId(userId);
    const contract_income = Math.max(Math.round(training_cost * 0.55), 6);
    const referrerMoneyReward = Settings[
      SettingKey.REFERRER_MONEY_REWARD
    ] as number;
    const userMe = await this.transformToCurrentUserResponseDto(
      updatedUser,
      equippedAccessories,
      training_cost,
      contract_income,
      referrerMoneyReward,
    );

    return {
      user: userMe,
      training_cost,
      power_increase: total_power_increase,
      new_power,
      training_cooldown_end: trainingCooldownEnd,
    };
  }

  async contract(userId: number): Promise<UserContractResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guards'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const activeBoosts = await this.userBoostService.findActiveByUserId(userId);
    const cooldownHalvingBoost = activeBoosts.find(
      (b) => b.type === UserBoostType.COOLDOWN_HALVING,
    );
    const rewardDoublingBoost = activeBoosts.find(
      (b) => b.type === UserBoostType.REWARD_DOUBLING,
    );

    let contractCooldown = Settings[SettingKey.CONTRACT_COOLDOWN];
    let trainingCooldown = Settings[SettingKey.TRAINING_COOLDOWN];
    if (
      cooldownHalvingBoost &&
      cooldownHalvingBoost.end_time &&
      cooldownHalvingBoost.end_time > new Date()
    ) {
      contractCooldown = contractCooldown / 2;
      trainingCooldown = trainingCooldown / 2;
    }

    if (user.last_contract_time) {
      const cooldownEndTime = new Date(
        user.last_contract_time.getTime() + contractCooldown,
      );
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException({
          message: 'Контракт еще не завершен',
          cooldown_end: cooldownEndTime,
        });
      }
    }

    if (user.last_training_time) {
      const cooldownEndTime = new Date(
        user.last_training_time.getTime() + trainingCooldown,
      );
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException({
          message: 'Нельзя начать контракт, пока идёт тренировка',
          cooldown_end: cooldownEndTime,
        });
      }
    }

    const current_power = user.strength ?? 0;

    const training_cost = Math.round(10 * Math.pow(1 + current_power, 1.2));

    let contract_income = Math.max(Math.round(training_cost * 0.55), 6);

    if (
      rewardDoublingBoost &&
      rewardDoublingBoost.end_time &&
      rewardDoublingBoost.end_time > new Date()
    ) {
      contract_income = contract_income * 2;
    }

    user.money = Number(user.money) + contract_income;
    user.last_contract_time = new Date();

    await this.userRepository.save(user);

    await this.userTaskService.updateTaskProgress(
      userId,
      TaskType.COMPLETE_CONTRACT,
    );

    const contractCooldownEnd = new Date(
      new Date().getTime() + contractCooldown,
    );

    const equippedAccessories =
      await this.userAccessoryService.findEquippedByUserId(userId);
    const referrerMoneyReward = Settings[
      SettingKey.REFERRER_MONEY_REWARD
    ] as number;
    const userMe = await this.transformToCurrentUserResponseDto(
      user,
      equippedAccessories,
      training_cost,
      contract_income,
      referrerMoneyReward,
    );

    return {
      user: userMe,
      contract_income,
      contract_cooldown_end: contractCooldownEnd,
    };
  }

  async findByVkId(vkId: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { vk_id: vkId },
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create({
      ...userData,
      last_login_at: new Date(),
    });
    return await this.userRepository.save(user);
  }

  async getRating(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<UserRatingResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;

    const allUsers = await this.userRepository.find({
      relations: ['guards'],
      where: {
        image_path: Not(IsNull()),
      },
    });

    const usersWithImagePath = allUsers.filter(
      (user) => user.image_path && user.image_path.trim() !== '',
    );

    const usersWithStrength = usersWithImagePath.map((user) => ({
      user,
      strength: user.strength ?? 0,
    }));

    usersWithStrength.sort((a, b) => {
      const scoreA = a.strength * 1000 + Number(a.user.money || 0);
      const scoreB = b.strength * 1000 + Number(b.user.money || 0);
      return scoreB - scoreA;
    });

    const total = usersWithStrength.length;
    const skip = (page - 1) * limit;
    const paginatedUsers = usersWithStrength.slice(skip, skip + limit);

    const userIds = paginatedUsers.map((item) => item.user.id);
    const [shieldBoostsMap, accessoriesMap] = await Promise.all([
      this.userBoostService.findActiveShieldBoostsByUserIds(userIds),
      this.userAccessoryService.findEquippedByUserIds(userIds),
    ]);

    const data = await Promise.all(
      paginatedUsers.map((item) =>
        this.transformToUserRatingResponseDto(
          item.user,
          accessoriesMap.get(item.user.id) || [],
          shieldBoostsMap,
        ),
      ),
    );

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getUserBoosts(userId: number): Promise<UserBoost[]> {
    return this.userBoostService.findByUserId(userId);
  }

  async getUserAccessories(userId: number) {
    return this.userAccessoryService.findByUserId(userId);
  }

  async getUserGuards(
    userId: number,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<UserGuardResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const [allGuards, total] = await this.userGuardRepository.findAndCount({
      where: { user_id: userId },
      relations: ['guard_as_user'],
      order: { strength: 'DESC' },
      skip,
      take: limit,
    });

    const guardUserIds = allGuards
      .filter((guard) => guard.guard_as_user_id)
      .map((guard) => guard.guard_as_user_id!);

    const guardUsers =
      guardUserIds.length > 0
        ? await this.userRepository.find({
            where: { id: In(guardUserIds) },
          })
        : [];

    const guardUsersMap = new Map(guardUsers.map((u) => [u.id, u]));
    const equippedAccessoriesMap =
      guardUserIds.length > 0
        ? await this.userAccessoryService.findEquippedByUserIds(guardUserIds)
        : new Map<number, any[]>();

    const guards = allGuards.map((guard) => {
      const transformed: any = { ...guard };
      delete transformed.user_id;
      delete transformed.user;

      if (guard.guard_as_user_id) {
        const guardUser = guardUsersMap.get(guard.guard_as_user_id);

        if (guardUser) {
          const equippedAccessories =
            equippedAccessoriesMap.get(guardUser.id) || [];
          transformed.guard_as_user = {
            id: guardUser.id,
            vk_id: guardUser.vk_id,
            first_name: guardUser.first_name,
            last_name: guardUser.last_name,
            image_path: guardUser.image_path,
            equipped_accessories: equippedAccessories,
          };
        }
      }

      return transformed as UserGuardResponseDto;
    });

    return {
      data: guards,
      total,
      page,
      limit,
    };
  }

  async getInventory(
    userId: number,
    queryParams?: any,
  ): Promise<InventoryResponseDto> {
    const [boosts, allAccessories] = await Promise.all([
      this.getUserBoosts(userId),
      this.getUserAccessories(userId),
    ]);

    const boostsWithoutUser: UserBoostResponseDto[] = boosts.map((boost) => ({
      id: boost.id,
      type: boost.type,
      end_time: boost.end_time,
      created_at: boost.created_at,
    }));

    const categoriesData: Record<string, UserAccessoryResponseDto[]> = {};

    for (const accessory of allAccessories) {
      const category = accessory.type || 'other';

      if (!categoriesData[category]) {
        categoriesData[category] = [];
      }

      categoriesData[category].push(accessory);
    }

    const defaultPage = queryParams?.page ? Number(queryParams.page) : 1;
    const defaultLimit = queryParams?.limit ? Number(queryParams.limit) : 10;

    const accessories: Record<string, AccessoriesCategoryResponseDto> = {};

    for (const [categoryName, items] of Object.entries(categoriesData)) {
      const categoryPageParam = queryParams?.[`${categoryName}_page`];
      const categoryLimitParam = queryParams?.[`${categoryName}_limit`];

      const page = categoryPageParam ? Number(categoryPageParam) : defaultPage;
      const limit = categoryLimitParam
        ? Number(categoryLimitParam)
        : defaultLimit;

      const total = items.length;
      const skip = (page - 1) * limit;
      const paginatedItems = items.slice(skip, skip + limit);

      accessories[categoryName] = {
        data: paginatedItems,
        total,
        page,
        limit,
      };
    }

    return {
      boosts: boostsWithoutUser,
      accessories,
    };
  }

  async getUserTasks(userId: number): Promise<UserTasksResponseDto> {
    await this.userTaskService.initializeTasksForUser(userId);

    const userTasks = await this.userTaskService.getUserTasks(userId);

    const tasks: UserTaskResponseDto[] = userTasks
      .filter((userTask) => userTask.status !== UserTaskStatus.COMPLETED)
      .map((userTask) => ({
        id: userTask.id,
        progress: userTask.progress,
        status: userTask.status,
        task: {
          id: userTask.task.id,
          description: userTask.task.description,
          type: userTask.task.type,
          value: userTask.task.value,
          money_reward: Number(userTask.task.money_reward),
          created_at: userTask.task.created_at,
          updated_at: userTask.task.updated_at,
        },
        created_at: userTask.created_at,
        updated_at: userTask.updated_at,
      }));

    return { tasks };
  }

  async checkCommunitySubscribe(
    userId: number,
    taskId: number,
  ): Promise<{ subscribed: boolean }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const userTasks = await this.userTaskService.getUserTasks(userId);
    const userTask = userTasks.find((ut) => ut.task.id === taskId);

    if (!userTask || !userTask.task) {
      throw new NotFoundException('Задача не найдена');
    }

    const taskTypeStr = String(userTask.task.type);
    if (
      userTask.task.type !== TaskType.COMMUNITY_SUBSCRIBE &&
      taskTypeStr !== 'community_subscribe'
    ) {
      throw new BadRequestException(
        'Задача не является задачей подписки на сообщество',
      );
    }

    if (!userTask.task.value) {
      throw new BadRequestException(
        'Значение задачи (community_id) не установлено',
      );
    }

    const communityId = userTask.task.value;
    let groupId = '';

    try {
      let groupIdentifier = String(communityId).replace(/^-/, '');

      if (
        groupIdentifier.startsWith('http://') ||
        groupIdentifier.startsWith('https://')
      ) {
        const urlMatch = groupIdentifier.match(/vk\.com\/([^\/\?]+)/);
        if (urlMatch && urlMatch[1]) {
          groupIdentifier = urlMatch[1];
        } else {
          console.error(`Invalid VK URL format: ${groupIdentifier}`);
          return { subscribed: false };
        }
      }

      if (isNaN(Number(groupIdentifier)) || groupIdentifier.includes('.')) {
        const getByIdUrl = `https://api.vk.com/method/groups.getById`;
        const getByIdParams = new URLSearchParams({
          group_id: groupIdentifier,
          access_token: ENV.VK_SERVICE_TOKEN || ENV.VK_APP_SECRET,
          v: '5.131',
        });

        const getByIdResponse = await fetch(`${getByIdUrl}?${getByIdParams}`);
        const getByIdData = await getByIdResponse.json();

        if (getByIdData.error) {
          console.error(
            `VK API error in groups.getById:`,
            getByIdData.error,
            `groupIdentifier: ${groupIdentifier}`,
          );
          return { subscribed: false };
        }

        if (getByIdData.response && getByIdData.response[0]?.id) {
          groupId = String(Math.abs(getByIdData.response[0].id));
        } else {
          console.error(
            `No group ID found in response:`,
            getByIdData,
            `groupIdentifier: ${groupIdentifier}`,
          );
          return { subscribed: false };
        }
      } else {
        groupId = groupIdentifier;
      }

      const vkApiUrl = `https://api.vk.com/method/groups.isMember`;
      const vkApiParams = new URLSearchParams({
        group_id: groupId,
        user_id: user.vk_id.toString(),
        extended: '0',
        access_token: ENV.VK_SERVICE_TOKEN || ENV.VK_APP_SECRET,
        v: '5.131',
      });

      const response = await fetch(`${vkApiUrl}?${vkApiParams}`);
      const data = await response.json();

      if (data.error) {
        console.error(
          `VK API error in checkCommunitySubscribe:`,
          data.error,
          `groupId: ${groupId}, userId: ${user.vk_id}`,
        );
        return { subscribed: false };
      }

      let isSubscribed = false;

      if (typeof data.response === 'number') {
        isSubscribed = data.response === 1;
      } else if (data.response === 1) {
        isSubscribed = true;
      } else if (Array.isArray(data.response) && data.response.length > 0) {
        const firstItem = data.response[0];
        if (typeof firstItem === 'number') {
          isSubscribed = firstItem === 1;
        } else if (firstItem?.member === 1) {
          isSubscribed = true;
        }
      } else if (data.response?.member === 1) {
        isSubscribed = true;
      }

      if (isSubscribed) {
        await this.userTaskService.updateTaskProgressByTaskId(userId, taskId);
      }

      return { subscribed: isSubscribed };
    } catch (error) {
      console.error(
        `Error in checkCommunitySubscribe:`,
        error.message,
        `groupId: ${groupId}, userId: ${user.vk_id}`,
      );
      return { subscribed: false };
    }
  }

  async equipAccessory(
    userId: number,
    accessoryId: number,
  ): Promise<UserAccessoryResponseDto> {
    return this.userAccessoryService.equip(userId, accessoryId);
  }

  async unequipAccessory(
    userId: number,
    accessoryId: number,
  ): Promise<UserAccessoryResponseDto> {
    return this.userAccessoryService.unequip(userId, accessoryId);
  }

  async getAttackableUsers(
    userId: number,
    filter?: 'top' | 'suitable' | 'friends',
    paginationDto?: PaginationDto,
    vkAccessToken?: string,
  ): Promise<PaginatedResponseDto<UserRatingResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'vk_id', 'clan_id', 'strength', 'guards_count'],
    });

    if (!currentUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    const currentUserClanId = currentUser.clan_id || null;

    let users: User[];
    let total: number;

    const initialReferrerVkId = Settings[
      SettingKey.INITIAL_REFERRER_VK_ID
    ] as number;

    if (!filter || filter === 'top') {
      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .where('user.id != :userId', { userId })
        .andWhere('user.guards_count > 1');

      if (currentUserClanId) {
        queryBuilder.andWhere(
          '(user.clan_id IS NULL OR user.clan_id != :clanId)',
          { clanId: currentUserClanId },
        );
      }

      total = await queryBuilder.getCount();

      users = await queryBuilder
        .orderBy('user.strength * 1000 + user.guards_count', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      const userIds = users.map((user) => user.id);
      const shieldBoostsMap =
        await this.userBoostService.findActiveShieldBoostsByUserIds(userIds);
      const equippedAccessoriesMap =
        await this.userAccessoryService.findEquippedByUserIds(userIds);

      const dataWithStrength = users.map((user) => {
        const equippedAccessories = equippedAccessoriesMap.get(user.id) || [];
        return this.transformToUserRatingResponseDto(
          user,
          equippedAccessories,
          shieldBoostsMap,
        );
      });

      return {
        data: dataWithStrength,
        total,
        page,
        limit,
      };
    } else if (filter === 'suitable') {
      const currentStrength = currentUser.strength ?? 0;
      const strengthRange = Math.max(currentStrength * 0.3, 50);

      const initialReferrerVkId = Settings[
        SettingKey.INITIAL_REFERRER_VK_ID
      ] as number;

      const currentUserIsInitialReferrer = this.isInitialReferrer(
        currentUser.vk_id,
        initialReferrerVkId,
      );

      const baseQueryBuilder = this.userRepository
        .createQueryBuilder('user')
        .where('user.id != :userId', { userId })
        .andWhere('user.guards_count > 1')
        .andWhere('user.strength >= :minStrength', {
          minStrength: currentStrength - strengthRange,
        })
        .andWhere('user.strength <= :maxStrength', {
          maxStrength: currentStrength + strengthRange,
        })
        .andWhere('user.referrals_count = 0');

      if (currentUserClanId) {
        baseQueryBuilder.andWhere(
          '(user.clan_id IS NULL OR user.clan_id != :clanId)',
          { clanId: currentUserClanId },
        );
      }

      let initialReferrer: User | null = null;
      if (
        initialReferrerVkId &&
        initialReferrerVkId > 0 &&
        !currentUserIsInitialReferrer
      ) {
        initialReferrer = await this.userRepository.findOne({
          where: { vk_id: Number(initialReferrerVkId) },
        });

        if (initialReferrer) {
          if (
            initialReferrer.id === userId ||
            initialReferrer.guards_count <= 1 ||
            initialReferrer.strength < currentStrength - strengthRange ||
            initialReferrer.strength > currentStrength + strengthRange ||
            (currentUserClanId &&
              initialReferrer.clan_id === currentUserClanId) ||
            initialReferrer.referrals_count > 0
          ) {
            initialReferrer = null;
          }
        }
      }

      const totalCountQuery = baseQueryBuilder.clone();
      if (initialReferrer) {
        totalCountQuery.andWhere('user.id != :initialReferrerId', {
          initialReferrerId: initialReferrer.id,
        });
      }
      total = await totalCountQuery.getCount();
      if (initialReferrer) {
        total += 1;
      }

      const sortedQueryBuilder = baseQueryBuilder.clone();
      if (initialReferrer) {
        sortedQueryBuilder.andWhere('user.id != :initialReferrerId', {
          initialReferrerId: initialReferrer.id,
        });
      }

      sortedQueryBuilder
        .addSelect(`ABS(user.strength - :currentStrength)`, 'distance')
        .addSelect(`user.strength * 1000 + user.guards_count`, 'score')
        .setParameter('currentStrength', currentStrength)
        .orderBy('distance', 'ASC')
        .addOrderBy('score', 'DESC')
        .skip(skip)
        .take(limit);

      users = await sortedQueryBuilder.getMany();

      if (initialReferrer && page === 1) {
        users = [initialReferrer, ...users];
        if (users.length > limit) {
          users = users.slice(0, limit);
        }
      }

      const userIds = users.map((user) => user.id);
      const shieldBoostsMap =
        await this.userBoostService.findActiveShieldBoostsByUserIds(userIds);
      const equippedAccessoriesMap =
        await this.userAccessoryService.findEquippedByUserIds(userIds);

      const dataWithStrength = users.map((user) => {
        const equippedAccessories = equippedAccessoriesMap.get(user.id) || [];
        return this.transformToUserRatingResponseDto(
          user,
          equippedAccessories,
          shieldBoostsMap,
        );
      });

      return {
        data: dataWithStrength,
        total,
        page,
        limit,
      };
    } else if (filter === 'friends') {
      const currentUser = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'vk_id'],
      });

      if (!currentUser) {
        throw new NotFoundException('Пользователь не найден');
      }

      let friendVkIds: number[] = [];

      if (vkAccessToken) {
        try {
          const vkApiUrl = 'https://api.vk.com/method/friends.get';
          const vkApiParams = new URLSearchParams({
            user_id: currentUser.vk_id.toString(),
            access_token: vkAccessToken,
            v: '5.131',
          });

          const response = await fetch(`${vkApiUrl}?${vkApiParams}`);
          const data = await response.json();

          if (data.error) {
            console.error('VK API error in friends.get:', data.error);
          } else if (data.response && data.response.items) {
            friendVkIds = data.response.items;
          }
        } catch (error) {
          console.error('Error fetching friends from VK API:', error);
        }
      }

      if (friendVkIds.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          limit,
        };
      }

      return this.getAttackableFriendsByVkIds(
        userId,
        friendVkIds,
        paginationDto,
      );
    }

    throw new BadRequestException('Неверный параметр фильтра');
  }

  async getAttackableFriendsByVkIds(
    userId: number,
    friendVkIds: number[],
    paginationDto?: PaginationDto,
    vkAccessToken?: string,
  ): Promise<PaginatedResponseDto<UserRatingResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'clan_id'],
    });

    if (!currentUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    const currentUserClanId = currentUser.clan_id;

    if (friendVkIds.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
      };
    }

    const users = await this.userRepository.find({
      where: {
        vk_id: In(friendVkIds),
      },
      relations: ['clan', 'guards'],
    });

    const filteredUsers = users
      .filter((user) => user.id !== userId)
      .filter(
        (user) => !currentUserClanId || user.clan?.id !== currentUserClanId,
      )
      .filter((user) => (user.guards_count ?? 0) > 1);

    const userIds = filteredUsers.map((user) => user.id);
    const shieldBoostsMap =
      await this.userBoostService.findActiveShieldBoostsByUserIds(userIds);
    const equippedAccessoriesMap =
      await this.userAccessoryService.findEquippedByUserIds(userIds);

    const dataWithStrength = filteredUsers.map((user) => {
      const equippedAccessories = equippedAccessoriesMap.get(user.id) || [];
      return this.transformToUserRatingResponseDto(
        user,
        equippedAccessories,
        shieldBoostsMap,
      );
    });

    dataWithStrength.sort((a, b) => {
      const scoreA = a.strength * 1000 + a.guards_count;
      const scoreB = b.strength * 1000 + b.guards_count;
      return scoreB - scoreA;
    });

    const total = dataWithStrength.length;
    const paginatedData = dataWithStrength.slice(skip, skip + limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
    };
  }

  async attackPlayer(
    userId: number,
    targetUserId: number,
  ): Promise<UserAttackPlayerResponseDto> {
    const attacker = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'vk_id', 'clan_id', 'strength', 'guards_count'],
    });

    const defender = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['clan', 'guards'],
    });

    if (!attacker || !defender) {
      throw new NotFoundException('Атакующий или защищающийся не найден');
    }

    if (attacker.id === defender.id) {
      throw new BadRequestException('Нельзя атаковать себя');
    }

    if (
      attacker.clan &&
      defender.clan &&
      attacker.clan.id === defender.clan.id
    ) {
      throw new BadRequestException('Нельзя атаковать участника своего клана');
    }

    await this.userBoostService.checkAndCompleteExpiredShieldBoosts(
      targetUserId,
    );

    const userIds = [targetUserId, userId];
    const shieldBoostsMap =
      await this.userBoostService.findActiveShieldBoostsByUserIds(userIds);
    const defenderShieldEndTime = shieldBoostsMap.get(targetUserId);

    if (defenderShieldEndTime) {
      throw new BadRequestException(
        'Нельзя атаковать пользователя с активным щитом',
      );
    }

    const attackerShieldEndTime = shieldBoostsMap.get(userId);

    if (attackerShieldEndTime) {
      const attackerActiveBoosts =
        await this.userBoostService.findActiveByUserId(userId);
      const attackerShieldBoost = attackerActiveBoosts.find(
        (b) => b.type === UserBoostType.SHIELD,
      );
      if (attackerShieldBoost) {
        await this.userBoostService.complete(attackerShieldBoost.id);
      }
    }

    const attackerActiveBoosts =
      await this.userBoostService.findActiveByUserId(userId);
    const cooldownHalvingBoost = attackerActiveBoosts.find(
      (b) => b.type === UserBoostType.COOLDOWN_HALVING,
    );

    let attackCooldown = Settings[SettingKey.ATTACK_COOLDOWN];
    if (
      cooldownHalvingBoost &&
      cooldownHalvingBoost.end_time &&
      cooldownHalvingBoost.end_time > new Date()
    ) {
      attackCooldown = attackCooldown / 2;
    }

    if (attacker.last_attack_time) {
      const cooldownEndTime = new Date(
        attacker.last_attack_time.getTime() + attackCooldown,
      );
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException({
          message: 'Кулдаун атаки все еще активен',
          cooldown_end: cooldownEndTime,
        });
      }
    }

    const attacker_power = attacker.strength ?? 0;
    const attacker_guards = attacker.guards_count ?? 0;
    const defender_power = defender.strength ?? 0;
    const capturableDefenderGuards = defender.guards
      ? defender.guards.filter((guard) => !guard.is_first)
      : [];
    const defender_guards = capturableDefenderGuards.length;

    if (
      attacker_guards === 0 ||
      !defender.guards ||
      defender.guards.length === 0
    ) {
      throw new BadRequestException(
        'У атакующего или защищающегося нет стражей',
      );
    }

    if (defender_guards === 0) {
      throw new BadRequestException(
        'У защищающегося нет захватываемых стражей',
      );
    }

    const initialReferrerVkId = Settings[
      SettingKey.INITIAL_REFERRER_VK_ID
    ] as number;

    const isAttackingInitialReferrer =
      initialReferrerVkId &&
      initialReferrerVkId > 0 &&
      Number(defender.vk_id) === Number(initialReferrerVkId);

    const win_chance = Math.min(
      75,
      Math.max(
        25,
        ((attacker_power * attacker_guards) /
          (defender_power * defender_guards)) *
          100,
      ),
    );
    const is_win =
      isAttackingInitialReferrer || Math.random() * 100 < win_chance;
    const stolen_items: StolenItem[] = [];

    let initialReferrerGuardStolen = false;

    if (
      isAttackingInitialReferrer &&
      defender.guards &&
      defender.guards.length > 0
    ) {
      const capturableGuards = defender.guards.filter(
        (guard) => !guard.is_first,
      );

      if (capturableGuards.length > 0) {
        const guardToSteal = capturableGuards[0];
        const stolenGuardId = guardToSteal.id;

        guardToSteal.user = attacker;
        await this.userGuardRepository.save(guardToSteal);
        await this.updateUserGuardsStats(attacker.id);
        await this.updateUserGuardsStats(defender.id);

        const guardItem = this.stolenItemRepository.create({
          type: StolenItemType.GUARD,
          value: stolenGuardId.toString(),
          thief: attacker,
          victim: defender,
          clan_war_id: null,
        });
        await this.stolenItemRepository.save(guardItem);
        stolen_items.push(guardItem);
        initialReferrerGuardStolen = true;
      }
    }

    if (isAttackingInitialReferrer) {
      await this.userRepository.update(attacker.id, {
        last_attack_time: new Date(),
      });

      if (stolen_items.length > 0) {
        await this.eventHistoryService.create(
          attacker.id,
          EventHistoryType.ATTACK,
          stolen_items,
          defender.id,
        );

        await this.eventHistoryService.create(
          defender.id,
          EventHistoryType.DEFENSE,
          stolen_items,
          attacker.id,
        );
      }

      return {
        win_chance: 100,
        is_win: true,
        stolen_money: 0,
        captured_guards: initialReferrerGuardStolen ? 1 : 0,
        attack_cooldown_end: new Date(new Date().getTime() + attackCooldown),
      };
    }

    if (is_win) {
      let stolen_money = 0;
      let captured_guards = 0;

      if (!isAttackingInitialReferrer) {
        stolen_money = Math.round(defender.money * 0.15 * (win_chance / 100));

        if (stolen_money > 0) {
          defender.money = Number(defender.money) - stolen_money;
          attacker.money = Number(attacker.money) + stolen_money;
          await this.userRepository.save([defender, attacker]);

          const moneyItem = this.stolenItemRepository.create({
            type: StolenItemType.MONEY,
            value: stolen_money.toString(),
            thief: attacker,
            victim: defender,
            clan_war_id: null,
          });
          await this.stolenItemRepository.save(moneyItem);
          stolen_items.push(moneyItem);
        }

        captured_guards = Math.round(
          defender_guards * 0.08 * (win_chance / 100),
        );

        if (
          captured_guards > 0 &&
          defender.guards &&
          defender.guards.length > 0
        ) {
          const capturableGuards = defender.guards.filter(
            (guard) => !guard.is_first,
          );
          const guardsToCapture = capturableGuards.slice(0, captured_guards);

          for (const guard of guardsToCapture) {
            const guardId = guard.id;
            guard.user = attacker;
            await this.userGuardRepository.save(guard);
          }

          await this.updateUserGuardsStats(attacker.id);
          await this.updateUserGuardsStats(defender.id);

          for (const guard of guardsToCapture) {
            const guardId = guard.id;
            const guardItem = this.stolenItemRepository.create({
              type: StolenItemType.GUARD,
              value: guardId.toString(),
              thief: attacker,
              victim: defender,
              clan_war_id: null,
            });
            await this.stolenItemRepository.save(guardItem);
            stolen_items.push(guardItem);
          }
        }
      }

      attacker.last_attack_time = new Date();
      await this.userRepository.save(attacker);

      if (stolen_items.length > 0) {
        await this.eventHistoryService.create(
          attacker.id,
          EventHistoryType.ATTACK,
          stolen_items,
          defender.id,
        );

        await this.eventHistoryService.create(
          defender.id,
          EventHistoryType.DEFENSE,
          stolen_items,
          attacker.id,
        );
      }

      const attackCooldownEnd = new Date(new Date().getTime() + attackCooldown);

      return {
        win_chance: isAttackingInitialReferrer ? 100 : win_chance,
        is_win: true,
        stolen_money: stolen_money || 0,
        captured_guards:
          captured_guards || (initialReferrerGuardStolen ? 1 : 0),
        attack_cooldown_end: attackCooldownEnd,
      };
    }

    attacker.last_attack_time = new Date();
    await this.userRepository.save(attacker);

    await this.eventHistoryService.create(
      attacker.id,
      EventHistoryType.ATTACK,
      stolen_items,
      defender.id,
    );

    await this.eventHistoryService.create(
      defender.id,
      EventHistoryType.DEFENSE,
      stolen_items,
      attacker.id,
    );

    const attackCooldownEnd = new Date(new Date().getTime() + attackCooldown);

    return {
      win_chance,
      is_win: false,
      stolen_money: 0,
      captured_guards: 0,
      attack_cooldown_end: attackCooldownEnd,
    };
  }

  async getEventHistory(
    userId: number,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<EventHistoryItemResponseDto>> {
    const result = await this.eventHistoryService.findByUserId(
      userId,
      paginationDto,
    );

    const opponentIds = result.data
      .map((event) => event.opponent?.id)
      .filter((id): id is number => id !== undefined && id !== null);
    const shieldBoostsMap =
      opponentIds.length > 0
        ? await this.userBoostService.findActiveShieldBoostsByUserIds(
            opponentIds,
          )
        : new Map<number, Date | null>();

    const opponentAccessoriesMap =
      opponentIds.length > 0
        ? await this.userAccessoryService.findEquippedByUserIds(opponentIds)
        : new Map<number, any[]>();

    const guardIds = result.data
      .flatMap((event) => {
        if (!event.stolen_items) return [];
        const relevantItems =
          event.type === EventHistoryType.ATTACK
            ? event.stolen_items.filter(
                (item) => item.thief && item.thief.id === userId,
              )
            : event.stolen_items.filter(
                (item) => item.victim && item.victim.id === userId,
              );
        return relevantItems
          .filter((item) => item.type === StolenItemType.GUARD)
          .map((item) => parseInt(item.value, 10))
          .filter((id): id is number => !isNaN(id) && id > 0);
      })
      .filter((id, index, self) => self.indexOf(id) === index);

    const guardsMap = new Map<number, UserGuard>();
    if (guardIds.length > 0) {
      const guards = await this.userGuardRepository.find({
        where: { id: In(guardIds) },
      });
      guards.forEach((guard) => guardsMap.set(guard.id, guard));
    }

    const transformedData = await Promise.all(
      result.data.map(async (event) => {
        const { stolen_items, ...eventWithoutStolenItems } = event;

        let stolenMoney = 0;
        let stolenGuardsCount = 0;
        let stolenStrength = 0;

        if (stolen_items && stolen_items.length > 0) {
          const relevantItems =
            event.type === EventHistoryType.ATTACK
              ? stolen_items.filter(
                  (item) => item.thief && item.thief.id === userId,
                )
              : stolen_items.filter(
                  (item) => item.victim && item.victim.id === userId,
                );

          for (const item of relevantItems) {
            if (item.type === StolenItemType.MONEY) {
              stolenMoney += parseInt(item.value, 10) || 0;
            } else if (item.type === StolenItemType.GUARD) {
              stolenGuardsCount++;
              const guardId = parseInt(item.value, 10);
              if (guardId) {
                const guard = guardsMap.get(guardId);
                if (guard) {
                  stolenStrength += Number(guard.strength) || 0;
                }
              }
            }
          }
        }

        let opponentDto: UserBasicStatsResponseDto | null = null;

        if (event.opponent?.id) {
          const equippedAccessories =
            opponentAccessoriesMap.get(event.opponent.id) || [];
          const opponentBasicStats =
            await this.transformToUserBasicStatsResponseDto(
              event.opponent,
              shieldBoostsMap,
            );
          opponentDto = {
            ...opponentBasicStats,
            equipped_accessories: equippedAccessories,
          };
        }

        const { user_id, opponent_id, user, opponent, ...eventWithoutIds } =
          eventWithoutStolenItems;

        return {
          id: event.id,
          type: event.type,
          created_at: event.created_at,
          stolen_money: stolenMoney,
          stolen_strength: stolenStrength,
          stolen_guards_count: stolenGuardsCount,
          opponent: opponentDto,
        };
      }),
    );

    return {
      data: transformedData,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async disableAdv(
    userId: number,
  ): Promise<{ show_adv: boolean; adv_disable_end_time: Date | null }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const cost = Settings[SettingKey.ADV_DISABLE_COST_VOICES_COUNT] as number;
    if (!cost || cost <= 0) {
      throw new BadRequestException(
        'Стоимость отключения рекламы не настроена',
      );
    }

    const now = new Date();
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (user.adv_disable_end_time && user.adv_disable_end_time > now) {
      user.adv_disable_end_time = new Date(
        user.adv_disable_end_time.getTime() + 365 * 24 * 60 * 60 * 1000,
      );
    } else {
      user.adv_disable_end_time = oneYearFromNow;
    }

    await this.userRepository.save(user);

    return {
      show_adv: false,
      adv_disable_end_time: user.adv_disable_end_time,
    };
  }

  private getShowAdv(user: User): boolean {
    if (!user.adv_disable_end_time) {
      return true;
    }
    return user.adv_disable_end_time <= new Date();
  }
}
