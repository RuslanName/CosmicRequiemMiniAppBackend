import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, MoreThan, Repository } from 'typeorm';
import { Clan } from './entities/clan.entity';
import { CreateClanDto } from './dtos/create-clan.dto';
import { CreateClanByUserDto } from './dtos/create-clan-by-user.dto';
import { UpdateClanDto } from './dtos/update-clan.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { ClanWar } from '../clan-war/entities/clan-war.entity';
import { Settings } from '../../config/setting.config';
import { SettingKey } from '../setting/enums/setting-key.enum';
import { ClanWarStatus } from '../clan-war/enums/clan-war-status.enum';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { StolenItem } from '../clan-war/entities/stolen-item.entity';
import { StolenItemType } from '../clan-war/enums/stolen-item-type.enum';
import { ClanApplication } from './entities/clan-application.entity';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { ClanWithStatsResponseDto } from './dtos/responses/clan-with-stats-response.dto';
import { ClanWithReferralResponseDto } from './dtos/responses/clan-with-referral-response.dto';
import { ClanRatingResponseDto } from './dtos/responses/clan-rating-response.dto';
import { UserWithStatsResponseDto } from './dtos/responses/user-with-stats-response.dto';
import { AttackEnemyResponseDto } from './dtos/responses/attack-enemy-response.dto';
import { ClanReferralLinkResponseDto } from './dtos/responses/clan-referral-link-response.dto';
import { ClanWarResponseDto } from '../clan-war/dtos/responses/clan-war-response.dto';
import { ClanApplicationStatus } from './enums/clan-application.enum';
import * as fs from 'fs';
import * as path from 'path';
import { Express } from 'express';
import { UserBoostService } from '../user-boost/user-boost.service';
import { UserBoostType } from '../user-boost/enums/user-boost-type.enum';
import { ENV } from '../../config/constants';
import { randomUUID } from 'crypto';
import { EventHistoryService } from '../event-history/event-history.service';
import { EventHistoryType } from '../event-history/enums/event-history-type.enum';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enums/notification-type.enum';

@Injectable()
export class ClanService {
  constructor(
    @InjectRepository(Clan)
    private readonly clanRepository: Repository<Clan>,
    @InjectRepository(ClanWar)
    private readonly clanWarRepository: Repository<ClanWar>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserGuard)
    private readonly userGuardRepository: Repository<UserGuard>,
    @InjectRepository(StolenItem)
    private readonly stolenItemRepository: Repository<StolenItem>,
    @InjectRepository(ClanApplication)
    private readonly clanApplicationRepository: Repository<ClanApplication>,
    private readonly userBoostService: UserBoostService,
    private readonly eventHistoryService: EventHistoryService,
    private readonly notificationService: NotificationService,
  ) {}

  private calculateUserPower(guards: UserGuard[]): number {
    if (!guards || guards.length === 0) return 0;
    return guards.reduce((sum, guard) => sum + Number(guard.strength), 0);
  }

  private getGuardsCount(guards: UserGuard[]): number {
    return guards ? guards.length : 0;
  }

  private calculateClanMoney(members: User[]): number {
    if (!members || members.length === 0) return 0;
    return members.reduce((sum, member) => sum + Number(member.money || 0), 0);
  }

  private calculateClanStrength(members: User[]): number {
    if (!members || members.length === 0) return 0;
    return members.reduce((sum, member) => {
      const userStrength = this.calculateUserPower(member.guards || []);
      return sum + userStrength;
    }, 0);
  }

  private calculateClanGuardsCount(members: User[]): number {
    if (!members || members.length === 0) return 0;
    return members.reduce((sum, member) => {
      return sum + this.getGuardsCount(member.guards || []);
    }, 0);
  }

  private transformClanForResponse(
    clan: Clan,
    options?: { includeReferralLink?: boolean; includeMembers?: boolean },
  ): ClanWithStatsResponseDto | ClanWithReferralResponseDto {
    const transformed: any = { ...clan };

    if (options?.includeReferralLink && clan.referral_link_id) {
      transformed.referral_link = `${ENV.VK_APP_URL}/?start=clan_${clan.referral_link_id}`;
    }
    delete transformed.referral_link_id;

    if (clan.members) {
      transformed.money = this.calculateClanMoney(clan.members);
      transformed.strength = this.calculateClanStrength(clan.members);
      transformed.guards_count = this.calculateClanGuardsCount(clan.members);
      transformed.members_count = clan.members.length;

      delete transformed.members;
    }

    if (clan.wars) {
      transformed.wars_count = clan.wars.length;
      delete transformed.wars;
    } else {
      transformed.wars_count = 0;
    }

    if (options?.includeReferralLink) {
      return transformed as ClanWithReferralResponseDto;
    }

    return transformed as ClanWithStatsResponseDto;
  }

  private transformToClanWithStatsResponseDto(
    clan: Clan,
  ): ClanWithStatsResponseDto {
    return this.transformClanForResponse(clan, {
      includeReferralLink: false,
      includeMembers: false,
    }) as ClanWithStatsResponseDto;
  }

  private transformToClanWithReferralResponseDto(
    clan: Clan,
  ): ClanWithReferralResponseDto {
    const transformed = this.transformClanForResponse(clan, {
      includeReferralLink: true,
      includeMembers: false,
    }) as ClanWithReferralResponseDto;

    delete (transformed as any).leader_id;

    return transformed;
  }

  private transformToUserWithStatsResponseDto(
    user: User,
  ): UserWithStatsResponseDto {
    const guardsCount = this.getGuardsCount(user.guards || []);
    const strength = this.calculateUserPower(user.guards || []);

    return {
      id: user.id,
      vk_id: user.vk_id,
      first_name: user.first_name,
      last_name: user.last_name,
      sex: user.sex,
      image_path: user.image_path || null,
      birthday_date: user.birthday_date,
      money: user.money,
      shield_end_time: user.shield_end_time,
      last_training_time: user.last_training_time,
      last_contract_time: user.last_contract_time,
      last_attack_time: user.last_attack_time,
      clan_leave_time: user.clan_leave_time,
      status: user.status,
      registered_at: user.registered_at,
      last_login_at: user.last_login_at,
      clan_id: user.clan_id,
      strength,
      guards_count: guardsCount,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanWithStatsResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.clanRepository.findAndCount({
      relations: ['members', 'members.guards', 'leader', '_wars_1', '_wars_2'],
      skip,
      take: limit,
    });

    const transformedData = data.map((clan) =>
      this.transformClanForResponse(clan, {
        includeReferralLink: false,
        includeMembers: false,
      }),
    );

    return {
      data: transformedData,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<ClanWithStatsResponseDto> {
    const clan = await this.clanRepository.findOne({
      where: { id },
      relations: ['members', 'members.guards', 'leader', '_wars_1', '_wars_2'],
    });

    if (!clan) {
      throw new NotFoundException(`Клан с ID ${id} не найден`);
    }

    return this.transformToClanWithStatsResponseDto(clan);
  }

  async searchClans(
    query: string,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanWithStatsResponseDto>> {
    if (!query || query.trim() === '') {
      throw new BadRequestException('Параметр запроса обязателен');
    }

    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const [data, total] = await this.clanRepository.findAndCount({
      where: {
        name: Like(`%${query.trim()}%`),
      },
      relations: ['members', 'members.guards', 'leader', '_wars_1', '_wars_2'],
      skip,
      take: limit,
    });

    const transformedData = data.map((clan) =>
      this.transformToClanWithStatsResponseDto(clan),
    );

    return {
      data: transformedData,
      total,
      page,
      limit,
    };
  }

  private saveClanImage(file: Express.Multer.File): string {
    if (!file) {
      throw new BadRequestException('Файл изображения обязателен');
    }

    const uploadDir = path.join(process.cwd(), 'data', 'clan-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `clan-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return path.join('data', 'clan-images', fileName).replace(/\\/g, '/');
  }

  private deleteClanImage(imagePath: string): void {
    if (imagePath && imagePath.startsWith('data/clan-images/')) {
      const fullPath = path.join(process.cwd(), imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  }

  async create(
    createClanDto: CreateClanDto,
    image: Express.Multer.File,
  ): Promise<ClanWithReferralResponseDto> {
    const leader = await this.userRepository.findOne({
      where: { id: createClanDto.leader_id },
    });

    if (!leader) {
      throw new NotFoundException('Лидер не найден');
    }

    if (leader.clan_id) {
      throw new BadRequestException('Лидер уже состоит в клане');
    }

    const imagePath = this.saveClanImage(image);
    const clan = this.clanRepository.create({
      ...createClanDto,
      image_path: imagePath,
      referral_link_id: randomUUID(),
      vk_group_id: createClanDto.vk_group_id,
    });
    const savedClan = await this.clanRepository.save(clan);

    leader.clan_id = savedClan.id;
    await this.userRepository.save(leader);

    const clanWithRelations = await this.clanRepository.findOne({
      where: { id: savedClan.id },
      relations: ['members', 'members.guards', 'leader', '_wars_1', '_wars_2'],
    });

    return this.transformToClanWithReferralResponseDto(clanWithRelations!);
  }

  async createClanByUser(
    userId: number,
    createClanByUserDto: CreateClanByUserDto,
  ): Promise<ClanWithReferralResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.clan_id) {
      throw new BadRequestException('Пользователь уже состоит в клане');
    }

    const existingClan = await this.clanRepository.findOne({
      where: { leader_id: userId },
    });

    if (existingClan) {
      throw new BadRequestException('У пользователя уже есть клан');
    }

    const existingClanByGroup = await this.clanRepository.findOne({
      where: { vk_group_id: createClanByUserDto.vk_group_id },
    });

    if (existingClanByGroup) {
      throw new BadRequestException('Клан для этого сообщества уже существует');
    }

    if (!createClanByUserDto.name || !createClanByUserDto.name.trim()) {
      throw new BadRequestException('Название клана обязательно');
    }

    if (
      !createClanByUserDto.image_url ||
      !createClanByUserDto.image_url.trim()
    ) {
      throw new BadRequestException('URL изображения обязателен');
    }

    let imagePath = '';
    try {
      imagePath = await this.downloadAndSaveGroupImage(
        createClanByUserDto.image_url,
      );
    } catch (error) {
      throw new BadRequestException(
        `Не удалось скачать и сохранить изображение: ${error.message}`,
      );
    }

    if (!imagePath) {
      throw new BadRequestException('Не удалось сохранить изображение клана');
    }

    const clan = this.clanRepository.create({
      name: createClanByUserDto.name.trim(),
      leader_id: userId,
      image_path: imagePath,
      referral_link_id: randomUUID(),
      vk_group_id: createClanByUserDto.vk_group_id,
    });
    const savedClan = await this.clanRepository.save(clan);

    user.clan_id = savedClan.id;
    await this.userRepository.save(user);

    const clanWithRelations = await this.clanRepository.findOne({
      where: { id: savedClan.id },
      relations: ['members', 'members.guards', 'leader', '_wars_1', '_wars_2'],
    });

    return this.transformToClanWithReferralResponseDto(clanWithRelations!);
  }

  async update(
    id: number,
    updateClanDto: UpdateClanDto,
    image?: Express.Multer.File,
  ): Promise<ClanWithReferralResponseDto> {
    const clan = await this.clanRepository.findOne({
      where: { id },
      relations: ['members', 'leader'],
    });

    if (!clan) {
      throw new NotFoundException(`Клан с ID ${id} не найден`);
    }

    if (image) {
      if (clan.image_path) {
        this.deleteClanImage(clan.image_path);
      }
      const imagePath = this.saveClanImage(image);
      updateClanDto = {
        ...updateClanDto,
        image_path: imagePath,
      } as UpdateClanDto;
    }

    Object.assign(clan, updateClanDto);
    const savedClan = await this.clanRepository.save(clan);
    return this.transformToClanWithReferralResponseDto(savedClan);
  }

  async remove(id: number): Promise<void> {
    const clan = await this.clanRepository.findOne({
      where: { id },
      relations: ['members'],
    });

    if (!clan) {
      throw new NotFoundException(`Клан с ID ${id} не найден`);
    }

    if (clan.members && clan.members.length > 0) {
      for (const member of clan.members) {
        member.clan_id = null;
        await this.userRepository.save(member);
      }
    }

    const clanWars = await this.clanWarRepository.find({
      where: [{ clan_1_id: id }, { clan_2_id: id }],
    });

    for (const war of clanWars) {
      await this.clanWarRepository.remove(war);
    }

    const applications = await this.clanApplicationRepository.find({
      where: { clan_id: id },
    });

    for (const application of applications) {
      await this.clanApplicationRepository.remove(application);
    }

    if (clan.image_path) {
      this.deleteClanImage(clan.image_path);
    }

    await this.clanRepository.remove(clan);
  }

  async deleteClanByLeader(userId: number): Promise<void> {
    const clan = await this.clanRepository.findOne({
      where: { leader_id: userId },
      relations: ['members'],
    });

    if (!clan) {
      throw new NotFoundException(
        'Клан не найден или пользователь не является лидером',
      );
    }

    if (clan.members && clan.members.length > 0) {
      for (const member of clan.members) {
        member.clan_id = null;
        await this.userRepository.save(member);
      }
    }

    const clanWars = await this.clanWarRepository.find({
      where: [{ clan_1_id: clan.id }, { clan_2_id: clan.id }],
    });

    for (const war of clanWars) {
      await this.clanWarRepository.remove(war);
    }

    const applications = await this.clanApplicationRepository.find({
      where: { clan_id: clan.id },
    });

    for (const application of applications) {
      await this.clanApplicationRepository.remove(application);
    }

    if (clan.image_path) {
      this.deleteClanImage(clan.image_path);
    }

    await this.clanRepository.remove(clan);
  }

  async getLeaderClan(userId: number): Promise<Clan> {
    const clan = await this.clanRepository.findOne({
      where: { leader_id: userId },
      relations: ['leader'],
    });

    if (!clan) {
      throw new NotFoundException(
        'Клан не найден или пользователь не является лидером',
      );
    }

    return clan;
  }

  async getAvailableClansForWar(
    userId: number,
  ): Promise<ClanWithStatsResponseDto[]> {
    const myClan = await this.getLeaderClan(userId);

    const maxClanWarsCount = Settings[SettingKey.MAX_CLAN_WARS_COUNT];
    const clanWarCooldown = Settings[SettingKey.CLAN_WAR_COOLDOWN];

    const lastWar = await this.clanWarRepository.findOne({
      where: [{ clan_1_id: myClan.id }, { clan_2_id: myClan.id }],
      order: { end_time: 'DESC' },
    });

    if (lastWar) {
      const cooldownEndTime = new Date(
        lastWar.end_time.getTime() + clanWarCooldown,
      );
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException('Кулдаун войны кланов все еще активен');
      }
    }

    const allClans = await this.clanRepository.find({
      where: { id: MoreThan(0) },
      relations: ['leader', 'members', 'members.guards', '_wars_1', '_wars_2'],
    });

    const availableClans: Clan[] = [];

    for (const clan of allClans) {
      if (clan.id === myClan.id) {
        continue;
      }

      const activeWarsCount = await this.clanWarRepository.count({
        where: [
          {
            clan_1_id: clan.id,
            status: ClanWarStatus.IN_PROGRESS,
          },
          {
            clan_2_id: clan.id,
            status: ClanWarStatus.IN_PROGRESS,
          },
        ],
      });

      if (activeWarsCount < maxClanWarsCount) {
        availableClans.push(clan);
      }
    }

    return availableClans.map((clan) =>
      this.transformToClanWithStatsResponseDto(clan),
    );
  }

  async declareWar(
    userId: number,
    targetClanId: number,
  ): Promise<ClanWarResponseDto> {
    const myClan = await this.getLeaderClan(userId);

    if (myClan.id === targetClanId) {
      throw new BadRequestException('Нельзя объявить войну своему клану');
    }

    const targetClan = await this.clanRepository.findOne({
      where: { id: targetClanId },
    });

    if (!targetClan) {
      throw new NotFoundException('Целевой клан не найден');
    }

    const maxClanWarsCount = Settings[SettingKey.MAX_CLAN_WARS_COUNT];
    const clanWarCooldown = Settings[SettingKey.CLAN_WAR_COOLDOWN];
    const clanWarDuration = Settings[SettingKey.CLAN_WAR_DURATION];

    const lastWar = await this.clanWarRepository.findOne({
      where: [{ clan_1_id: myClan.id }, { clan_2_id: myClan.id }],
      order: { end_time: 'DESC' },
    });

    if (lastWar) {
      const cooldownEndTime = new Date(
        lastWar.end_time.getTime() + clanWarCooldown,
      );
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException('Кулдаун войны кланов все еще активен');
      }
    }

    const activeWarsCount = await this.clanWarRepository.count({
      where: [
        {
          clan_1_id: targetClanId,
          status: ClanWarStatus.IN_PROGRESS,
        },
        {
          clan_2_id: targetClanId,
          status: ClanWarStatus.IN_PROGRESS,
        },
      ],
    });

    if (activeWarsCount >= maxClanWarsCount) {
      throw new BadRequestException(
        'Целевой клан достиг максимального количества активных войн',
      );
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + clanWarDuration);

    const clanWar = this.clanWarRepository.create({
      clan_1: myClan,
      clan_2: targetClan,
      start_time: startTime,
      end_time: endTime,
      status: ClanWarStatus.IN_PROGRESS,
    });

    const savedWar = await this.clanWarRepository.save(clanWar);

    const clan1Members = await this.userRepository.find({
      where: { clan_id: myClan.id },
      select: ['id'],
    });

    const clan2Members = await this.userRepository.find({
      where: { clan_id: targetClan.id },
      select: ['id'],
    });

    const clan1MemberIds = clan1Members.map((m) => m.id);
    const clan2MemberIds = clan2Members.map((m) => m.id);

    await this.notificationService.createForUsers(
      clan1MemberIds,
      'Началась война кланов',
      `Ваш клан "${myClan.name}" объявил войну клану "${targetClan.name}"`,
      NotificationType.WAR,
    );

    await this.notificationService.createForUsers(
      clan2MemberIds,
      'Началась война кланов',
      `Клан "${myClan.name}" объявил войну вашему клану "${targetClan.name}"`,
      NotificationType.WAR,
    );

    const warWithRelations = await this.clanWarRepository.findOne({
      where: { id: savedWar.id },
      relations: [
        'clan_1',
        'clan_2',
        'clan_1.leader',
        'clan_2.leader',
        'stolen_items',
      ],
    });

    return this.transformClanWarToResponseDto(warWithRelations!);
  }

  async getEnemyClanMembers(
    userId: number,
  ): Promise<UserWithStatsResponseDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan'],
    });

    if (!user || !user.clan) {
      throw new BadRequestException('Пользователь не состоит в клане');
    }

    const activeWars = await this.clanWarRepository.find({
      where: [
        { clan_1_id: user.clan.id, status: ClanWarStatus.IN_PROGRESS },
        { clan_2_id: user.clan.id, status: ClanWarStatus.IN_PROGRESS },
      ],
      relations: ['clan_1', 'clan_2'],
    });

    if (activeWars.length === 0) {
      return [];
    }

    const enemyClanIds = activeWars.map((war) =>
      war.clan_1.id === user.clan!.id ? war.clan_2.id : war.clan_1.id,
    );

    const members = await this.userRepository.find({
      where: { clan_id: In(enemyClanIds) },
      relations: ['guards'],
    });

    return members.map((member) =>
      this.transformToUserWithStatsResponseDto(member),
    );
  }

  async attackEnemy(
    userId: number,
    targetUserId: number,
    enemyClanId?: number,
  ): Promise<AttackEnemyResponseDto> {
    const attacker = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan', 'guards'],
    });

    const defender = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['clan', 'guards'],
    });

    if (!attacker || !defender) {
      throw new NotFoundException('Атакующий или защищающийся не найден');
    }

    await this.userBoostService.checkAndCompleteExpiredShieldBoosts(
      targetUserId,
      defender.shield_end_time || null,
    );

    const defenderActiveBoosts =
      await this.userBoostService.findActiveByUserId(targetUserId);
    const defenderShieldBoost = defenderActiveBoosts.find(
      (b) => b.type === UserBoostType.SHIELD,
    );

    if (defender.shield_end_time && defender.shield_end_time > new Date()) {
      throw new BadRequestException(
        'Нельзя атаковать пользователя с активным щитом',
      );
    }
    if (
      defenderShieldBoost &&
      (!defender.shield_end_time || defender.shield_end_time <= new Date())
    ) {
      await this.userBoostService.complete(defenderShieldBoost.id);
    }

    const attackerActiveBoosts =
      await this.userBoostService.findActiveByUserId(userId);
    const attackerShieldBoost = attackerActiveBoosts.find(
      (b) => b.type === UserBoostType.SHIELD,
    );

    if (attackerShieldBoost) {
      await this.userBoostService.complete(attackerShieldBoost.id);
    }

    attacker.shield_end_time = undefined;

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

    if (!attacker.clan || !defender.clan) {
      throw new BadRequestException(
        'Атакующий или защищающийся не состоит в клане',
      );
    }

    if (attacker.clan.id === defender.clan.id) {
      throw new BadRequestException('Нельзя атаковать участника своего клана');
    }

    if (enemyClanId && defender.clan.id !== enemyClanId) {
      throw new BadRequestException(
        'Целевой пользователь не принадлежит указанному вражескому клану',
      );
    }

    const activeWar = await this.clanWarRepository.findOne({
      where: [
        {
          clan_1_id: attacker.clan.id,
          clan_2_id: defender.clan.id,
          status: ClanWarStatus.IN_PROGRESS,
        },
        {
          clan_1_id: defender.clan.id,
          clan_2_id: attacker.clan.id,
          status: ClanWarStatus.IN_PROGRESS,
        },
      ],
    });

    if (!activeWar) {
      throw new BadRequestException('Нет активной войны между кланами');
    }

    if (enemyClanId) {
      const isEnemyClanInWar =
        (activeWar.clan_1_id === attacker.clan.id &&
          activeWar.clan_2_id === enemyClanId) ||
        (activeWar.clan_2_id === attacker.clan.id &&
          activeWar.clan_1_id === enemyClanId);
      if (!isEnemyClanInWar) {
        throw new BadRequestException(
          'Нет активной войны с указанным вражеским кланом',
        );
      }
    }

    const attacker_power = this.calculateUserPower(attacker.guards || []);
    const attacker_guards = this.getGuardsCount(attacker.guards || []);
    const defender_power = this.calculateUserPower(defender.guards || []);
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

    const win_chance = Math.min(
      75,
      Math.max(
        25,
        ((attacker_power * attacker_guards) /
          (defender_power * defender_guards)) *
          100,
      ),
    );
    const is_win = Math.random() * 100 < win_chance;

    const stolen_items: StolenItem[] = [];

    if (is_win) {
      const stolen_money = Math.round(
        defender.money * 0.15 * (win_chance / 100),
      );

      if (stolen_money > 0) {
        defender.money = Number(defender.money) - stolen_money;
        attacker.money = Number(attacker.money) + stolen_money;
        await this.userRepository.save([defender, attacker]);

        const moneyItem = this.stolenItemRepository.create({
          type: StolenItemType.MONEY,
          value: stolen_money.toString(),
          thief: attacker,
          victim: defender,
          clan_war: activeWar,
        });
        await this.stolenItemRepository.save(moneyItem);
        stolen_items.push(moneyItem);
      }

      const captured_guards = Math.round(
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
          guard.user = attacker;
          await this.userGuardRepository.save(guard);

          const guardItem = this.stolenItemRepository.create({
            type: StolenItemType.GUARD,
            value: guard.id.toString(),
            thief: attacker,
            victim: defender,
            clan_war: activeWar,
          });
          await this.stolenItemRepository.save(guardItem);
          stolen_items.push(guardItem);
        }
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
        is_win: true,
        stolen_money: stolen_money || 0,
        captured_guards: captured_guards || 0,
        stolen_items,
        attack_cooldown_end: attackCooldownEnd,
      };
    }

    attacker.last_attack_time = new Date();
    await this.userRepository.save(attacker);

    await this.eventHistoryService.create(
      attacker.id,
      EventHistoryType.ATTACK,
      [],
      defender.id,
    );

    await this.eventHistoryService.create(
      defender.id,
      EventHistoryType.DEFENSE,
      [],
      attacker.id,
    );

    const attackCooldownEnd = new Date(new Date().getTime() + attackCooldown);

    return {
      win_chance,
      is_win: false,
      stolen_money: 0,
      captured_guards: 0,
      stolen_items: [],
      attack_cooldown_end: attackCooldownEnd,
    };
  }

  async leaveClan(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan', 'clan.leader'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (!user.clan) {
      throw new BadRequestException('Пользователь не состоит в клане');
    }

    if (user.clan.leader?.id === userId) {
      throw new BadRequestException('Лидер клана не может покинуть клан');
    }

    user.clan_leave_time = new Date();
    user.clan_id = null;
    user.clan = undefined;
    await this.userRepository.save(user);

    return user;
  }

  async createApplication(
    userId: number,
    clanId: number,
  ): Promise<ClanApplication> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.clan) {
      throw new BadRequestException('Пользователь уже состоит в клане');
    }

    const clan = await this.clanRepository.findOne({
      where: { id: clanId },
      relations: ['members'],
    });

    if (!clan) {
      throw new NotFoundException('Клан не найден');
    }

    if (clan.members && clan.members.length >= clan.max_members) {
      throw new BadRequestException('Клан заполнен');
    }

    const existingApplication = await this.clanApplicationRepository.findOne({
      where: {
        user_id: userId,
        clan_id: clanId,
        status: ClanApplicationStatus.PENDING,
      },
    });

    if (existingApplication) {
      throw new BadRequestException('Заявка уже существует');
    }

    const clanJoinCooldown = Settings[SettingKey.CLAN_JOIN_COOLDOWN];
    if (user.clan_leave_time) {
      const cooldownEndTime = new Date(
        user.clan_leave_time.getTime() + clanJoinCooldown,
      );
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException(
          'Кулдаун вступления в клан все еще активен',
        );
      }
    }

    const application = this.clanApplicationRepository.create({
      user,
      clan,
      status: ClanApplicationStatus.PENDING,
    });

    return this.clanApplicationRepository.save(application);
  }

  async getApplications(userId: number): Promise<ClanApplication[]> {
    const clan = await this.getLeaderClan(userId);

    return this.clanApplicationRepository.find({
      where: {
        clan_id: clan.id,
        status: ClanApplicationStatus.PENDING,
      },
      relations: ['user', 'clan'],
      order: { created_at: 'DESC' },
    });
  }

  async acceptApplication(
    userId: number,
    applicationId: number,
  ): Promise<ClanApplication> {
    const clan = await this.getLeaderClan(userId);

    const application = await this.clanApplicationRepository.findOne({
      where: { id: applicationId },
      relations: ['user', 'clan', 'user.clan'],
    });

    if (!application) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (application.clan.id !== clan.id) {
      throw new BadRequestException('Заявка не принадлежит вашему клану');
    }

    if (application.status !== ClanApplicationStatus.PENDING) {
      throw new BadRequestException('Заявка не находится в ожидании');
    }

    const user = application.user;

    if (user.clan) {
      throw new BadRequestException('Пользователь уже состоит в клане');
    }

    const clanJoinCooldown = Settings[SettingKey.CLAN_JOIN_COOLDOWN];
    if (user.clan_leave_time) {
      const cooldownEndTime = new Date(
        user.clan_leave_time.getTime() + clanJoinCooldown,
      );
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException(
          'Кулдаун вступления в клан все еще активен',
        );
      }
    }

    const updatedClan = await this.clanRepository.findOne({
      where: { id: clan.id },
      relations: ['members'],
    });

    if (!updatedClan) {
      throw new NotFoundException('Клан не найден');
    }

    if (
      updatedClan.members &&
      updatedClan.members.length >= updatedClan.max_members
    ) {
      throw new BadRequestException('Клан заполнен');
    }

    application.status = ClanApplicationStatus.ACCEPTED;
    await this.clanApplicationRepository.save(application);

    user.clan = updatedClan;
    await this.userRepository.save(user);

    return application;
  }

  async rejectApplication(
    userId: number,
    applicationId: number,
  ): Promise<ClanApplication> {
    const clan = await this.getLeaderClan(userId);

    const application = await this.clanApplicationRepository.findOne({
      where: { id: applicationId },
      relations: ['clan'],
    });

    if (!application) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (application.clan.id !== clan.id) {
      throw new BadRequestException('Заявка не принадлежит вашему клану');
    }

    if (application.status !== ClanApplicationStatus.PENDING) {
      throw new BadRequestException('Заявка не находится в ожидании');
    }

    application.status = ClanApplicationStatus.REJECTED;
    return this.clanApplicationRepository.save(application);
  }

  async getUserClan(userId: number): Promise<ClanWithReferralResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'clan',
        'clan.leader',
        'clan.members',
        'clan.members.guards',
        'clan._wars_1',
        'clan._wars_2',
      ],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (!user.clan) {
      throw new NotFoundException('Пользователь не состоит в клане');
    }

    const activeWarsCount = await this.clanWarRepository.count({
      where: [
        { clan_1_id: user.clan.id, status: ClanWarStatus.IN_PROGRESS },
        { clan_2_id: user.clan.id, status: ClanWarStatus.IN_PROGRESS },
      ],
    });

    const isLeader = user.clan.leader_id === userId;
    let result: ClanWithReferralResponseDto | ClanWithStatsResponseDto;
    if (isLeader) {
      result = this.transformToClanWithReferralResponseDto(user.clan);
    } else {
      result = this.transformToClanWithStatsResponseDto(user.clan);
    }
    (result as any).has_active_wars = activeWarsCount > 0;
    return result as ClanWithReferralResponseDto;
  }

  async getActiveWars(clanId: number): Promise<ClanWarResponseDto[]> {
    const wars = await this.clanWarRepository.find({
      where: [
        { clan_1_id: clanId, status: ClanWarStatus.IN_PROGRESS },
        { clan_2_id: clanId, status: ClanWarStatus.IN_PROGRESS },
      ],
      relations: [
        'clan_1',
        'clan_2',
        'clan_1.leader',
        'clan_2.leader',
        'stolen_items',
      ],
      order: { start_time: 'DESC' },
    });

    return wars.map((war) => this.transformClanWarToResponseDto(war));
  }

  async getAllWars(
    clanId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanWarResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [wars, total] = await this.clanWarRepository.findAndCount({
      where: [{ clan_1_id: clanId }, { clan_2_id: clanId }],
      relations: [
        'clan_1',
        'clan_2',
        'clan_1.leader',
        'clan_2.leader',
        'stolen_items',
      ],
      order: { start_time: 'DESC' },
      skip,
      take: limit,
    });

    const transformedData = wars.map((war) =>
      this.transformClanWarToResponseDto(war),
    );

    return {
      data: transformedData,
      total,
      page,
      limit,
    };
  }

  private transformClanWarToResponseDto(war: ClanWar): ClanWarResponseDto {
    const transformed: any = { ...war };
    delete transformed.clan_1_id;
    delete transformed.clan_2_id;

    if (war.clan_1) {
      transformed.clan_1 = this.transformToClanWithStatsResponseDto(war.clan_1);
    }
    if (war.clan_2) {
      transformed.clan_2 = this.transformToClanWithStatsResponseDto(war.clan_2);
    }

    return transformed as ClanWarResponseDto;
  }

  async getEnemyClans(userId: number): Promise<ClanWithStatsResponseDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan'],
    });

    if (!user || !user.clan) {
      throw new NotFoundException('Пользователь не состоит в клане');
    }

    const activeWars = await this.clanWarRepository.find({
      where: [
        { clan_1_id: user.clan.id, status: ClanWarStatus.IN_PROGRESS },
        { clan_2_id: user.clan.id, status: ClanWarStatus.IN_PROGRESS },
      ],
      relations: ['clan_1', 'clan_2', 'clan_1.leader', 'clan_2.leader'],
    });

    const enemyClanIds = activeWars.map((war) =>
      war.clan_1.id === user.clan!.id ? war.clan_2.id : war.clan_1.id,
    );

    if (enemyClanIds.length === 0) {
      return [];
    }

    const enemyClans = await this.clanRepository.find({
      where: { id: In(enemyClanIds) },
      relations: ['leader', 'members', 'members.guards', '_wars_1', '_wars_2'],
    });

    const enemyClansMap = new Map(enemyClans.map((clan) => [clan.id, clan]));
    const warsMap = new Map(
      activeWars.map((war) => {
        const enemyClanId =
          war.clan_1.id === user.clan!.id ? war.clan_2.id : war.clan_1.id;
        return [enemyClanId, war];
      }),
    );

    return enemyClans.map((clan) => {
      const transformed = this.transformToClanWithStatsResponseDto(clan);
      const war = warsMap.get(clan.id);
      if (war) {
        (transformed as any).war_start_time = war.start_time;
        (transformed as any).war_end_time = war.end_time;
      }
      return transformed;
    });
  }

  async getEnemyClanById(
    userId: number,
    enemyClanId: number,
  ): Promise<ClanWithStatsResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan'],
    });

    if (!user || !user.clan) {
      throw new NotFoundException('Пользователь не состоит в клане');
    }

    const activeWars = await this.clanWarRepository.find({
      where: [
        { clan_1_id: user.clan.id, status: ClanWarStatus.IN_PROGRESS },
        { clan_2_id: user.clan.id, status: ClanWarStatus.IN_PROGRESS },
      ],
      relations: ['clan_1', 'clan_2'],
    });

    const enemyClanIds = activeWars.map((war) =>
      war.clan_1.id === user.clan!.id ? war.clan_2.id : war.clan_1.id,
    );

    if (!enemyClanIds.includes(enemyClanId)) {
      throw new BadRequestException(
        'Клан не является врагом или война не активна',
      );
    }

    const activeWar = activeWars.find(
      (war) =>
        (war.clan_1.id === user.clan!.id && war.clan_2.id === enemyClanId) ||
        (war.clan_2.id === user.clan!.id && war.clan_1.id === enemyClanId),
    );

    const enemyClan = await this.clanRepository.findOne({
      where: { id: enemyClanId },
      relations: ['leader', 'members', 'members.guards', '_wars_1', '_wars_2'],
    });

    if (!enemyClan) {
      throw new NotFoundException('Вражеский клан не найден');
    }

    const transformed = this.transformToClanWithStatsResponseDto(enemyClan);
    if (activeWar) {
      (transformed as any).war_start_time = activeWar.start_time;
      (transformed as any).war_end_time = activeWar.end_time;
    }
    return transformed;
  }

  async getEnemyClanMembersById(
    userId: number,
    enemyClanId: number,
  ): Promise<UserWithStatsResponseDto[]> {
    await this.getEnemyClanById(userId, enemyClanId);

    const members = await this.userRepository.find({
      where: { clan_id: enemyClanId },
      relations: ['guards'],
    });

    const membersWithStats = members.map((member) =>
      this.transformToUserWithStatsResponseDto(member),
    );

    membersWithStats.sort((a, b) => {
      const scoreA = (a.strength || 0) * 1000 + (a.money || 0);
      const scoreB = (b.strength || 0) * 1000 + (b.money || 0);
      return scoreB - scoreA;
    });

    return membersWithStats;
  }

  async getClanMembers(clanId: number): Promise<UserWithStatsResponseDto[]> {
    const clan = await this.clanRepository.findOne({
      where: { id: clanId },
    });

    if (!clan) {
      throw new NotFoundException('Клан не найден');
    }

    const members = await this.userRepository.find({
      where: { clan_id: clanId },
      relations: ['guards'],
    });

    const membersWithStats = members.map((member) =>
      this.transformToUserWithStatsResponseDto(member),
    );

    membersWithStats.sort((a, b) => {
      const scoreA = (a.strength || 0) * 1000 + (a.money || 0);
      const scoreB = (b.strength || 0) * 1000 + (b.money || 0);
      return scoreB - scoreA;
    });

    return membersWithStats;
  }

  async getClanRating(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanRatingResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const allClans = await this.clanRepository.find({
      relations: ['leader', 'members', 'members.guards', '_wars_1', '_wars_2'],
    });

    const clansWithRating = await Promise.all(
      allClans.map(async (clan) => {
        const winsAsClan1 = await this.clanWarRepository.count({
          where: {
            clan_1_id: clan.id,
            status: ClanWarStatus.WON_BY_CLAN_1,
          },
        });

        const winsAsClan2 = await this.clanWarRepository.count({
          where: {
            clan_2_id: clan.id,
            status: ClanWarStatus.WON_BY_CLAN_2,
          },
        });

        const lossesAsClan1 = await this.clanWarRepository.count({
          where: {
            clan_1_id: clan.id,
            status: ClanWarStatus.WON_BY_CLAN_2,
          },
        });

        const lossesAsClan2 = await this.clanWarRepository.count({
          where: {
            clan_2_id: clan.id,
            status: ClanWarStatus.WON_BY_CLAN_1,
          },
        });

        const wins = winsAsClan1 + winsAsClan2;
        const losses = lossesAsClan1 + lossesAsClan2;
        const rating = wins;

        const transformed = this.transformClanForResponse(clan, {
          includeReferralLink: false,
          includeMembers: false,
        });

        return {
          ...transformed,
          wins,
          losses,
          rating,
        } as ClanRatingResponseDto;
      }),
    );

    clansWithRating.sort((a, b) => {
      const scoreA = (a.strength || 0) * 1000 + (a.money || 0);
      const scoreB = (b.strength || 0) * 1000 + (b.money || 0);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return a.id - b.id;
    });

    const total = clansWithRating.length;
    const paginatedData = clansWithRating.slice(skip, skip + limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
    };
  }

  async syncClanWithVkGroup(
    userId: number,
    vkGroupId: string,
    vkViewerGroupRole: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan'],
    });

    if (!user) {
      return;
    }

    const groupId = String(vkGroupId).replace(/^-/, '');
    const isAdmin = vkViewerGroupRole === 'admin';

    let groupData: { id: number; name: string; photo_200?: string } | null =
      null;

    try {
      const vkApiUrl = `https://api.vk.com/method/groups.getById`;
      const vkApiParams = new URLSearchParams({
        group_id: groupId,
        access_token: ENV.VK_SERVICE_TOKEN || ENV.VK_APP_SECRET,
        v: '5.131',
        fields: 'photo_200',
      });

      const response = await fetch(`${vkApiUrl}?${vkApiParams}`);
      const data = await response.json();

      if (data.error || !data.response || !data.response[0]) {
        console.warn(
          `Failed to get VK group data for group_id ${groupId}:`,
          data.error,
        );
        return;
      }

      groupData = {
        id: Math.abs(data.response[0].id),
        name: data.response[0].name || '',
        photo_200: data.response[0].photo_200 || null,
      };
    } catch (error) {
      console.error(`Error fetching VK group data: ${error.message}`);
      return;
    }

    if (!groupData) {
      return;
    }

    const existingClan = await this.clanRepository.findOne({
      where: { vk_group_id: groupData.id },
      relations: ['members'],
    });

    const userCurrentClanId = user.clan_id;

    if (existingClan) {
      existingClan.name = groupData.name;
      if (groupData.photo_200) {
        existingClan.image_path = await this.downloadAndSaveGroupImage(
          groupData.photo_200,
        );
      }
      await this.clanRepository.save(existingClan);

      if (
        isAdmin &&
        (userCurrentClanId !== existingClan.id || !userCurrentClanId)
      ) {
        user.clan_id = existingClan.id;
        await this.userRepository.save(user);
      }
    }
  }

  private async downloadAndSaveGroupImage(photoUrl: string): Promise<string> {
    try {
      const response = await fetch(photoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const uploadDir = path.join(process.cwd(), 'data', 'clan-images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExtension = path.extname(new URL(photoUrl).pathname) || '.jpg';
      const fileName = `clan-vk-${Date.now()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);

      return path.join('data', 'clan-images', fileName).replace(/\\/g, '/');
    } catch (error) {
      console.error(`Error downloading group image: ${error.message}`);
      return '';
    }
  }

  async getNotifications(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan'],
    });

    if (!user || !user.clan) {
      return [];
    }

    return this.notificationService.findByUserId(userId);
  }
}
