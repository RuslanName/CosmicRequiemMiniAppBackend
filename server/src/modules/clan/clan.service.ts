import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import { Clan } from './entities/clan.entity';
import { CreateClanDto } from './dtos/create-clan.dto';
import { UpdateClanDto } from './dtos/update-clan.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { ClanWar } from '../clan-war/entities/clan-war.entity';
import { Settings } from '../../config/setting.config';
import { SettingKey } from '../setting/setting-key.enum';
import { ClanWarStatus } from '../clan-war/enums/clan-war-status.enum';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { StolenItem } from '../clan-war/entities/stolen-item.entity';
import { StolenItemType } from '../clan-war/enums/stolen-item-type.enum';
import { ClanApplication } from './entities/clan-application.entity';
import { ClanApplicationStatus } from './enums/clan-application.enum';
import * as fs from 'fs';
import * as path from 'path';
import { Express } from 'express';
import { UserBoostService } from '../user-boost/user-boost.service';
import { UserBoostType } from '../user-boost/enums/user-boost-type.enum';

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
  ) {}

  private calculateUserPower(guards: UserGuard[]): number {
    if (!guards || guards.length === 0) return 0;
    return guards.reduce((sum, guard) => sum + Number(guard.strength), 0);
  }

  private getGuardsCount(guards: UserGuard[]): number {
    return guards ? guards.length : 0;
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ data: Clan[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.clanRepository.findAndCount({
      relations: ['members', 'leader'],
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<Clan> {
    const clan = await this.clanRepository.findOne({
      where: { id },
      relations: ['members', 'leader'],
    });

    if (!clan) {
      throw new NotFoundException(`Clan with ID ${id} not found`);
    }

    return clan;
  }

  private async saveClanImage(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('Image file is required');
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

  private async deleteClanImage(imagePath: string): Promise<void> {
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
  ): Promise<Clan> {
    const imagePath = await this.saveClanImage(image);
    const clan = this.clanRepository.create({
      ...createClanDto,
      image_path: imagePath,
    });
    return this.clanRepository.save(clan);
  }

  async update(
    id: number,
    updateClanDto: UpdateClanDto,
    image?: Express.Multer.File,
  ): Promise<Clan> {
    const clan = await this.clanRepository.findOne({
      where: { id },
      relations: ['members', 'leader'],
    });

    if (!clan) {
      throw new NotFoundException(`Clan with ID ${id} not found`);
    }

    if (image) {
      if (clan.image_path) {
        await this.deleteClanImage(clan.image_path);
      }
      const imagePath = await this.saveClanImage(image);
      updateClanDto = {
        ...updateClanDto,
        image_path: imagePath,
      } as UpdateClanDto;
    }

    Object.assign(clan, updateClanDto);
    return this.clanRepository.save(clan);
  }

  async remove(id: number): Promise<void> {
    const clan = await this.clanRepository.findOne({ where: { id } });

    if (!clan) {
      throw new NotFoundException(`Clan with ID ${id} not found`);
    }

    if (clan.image_path) {
      await this.deleteClanImage(clan.image_path);
    }

    await this.clanRepository.remove(clan);
  }

  async getLeaderClan(userId: number): Promise<Clan> {
    const clan = await this.clanRepository.findOne({
      where: { leader_id: userId },
      relations: ['leader'],
    });

    if (!clan) {
      throw new NotFoundException('Clan not found or user is not a leader');
    }

    return clan;
  }

  async getAvailableClansForWar(userId: number): Promise<Clan[]> {
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
        throw new BadRequestException('Clan war cooldown is still active');
      }
    }

    const allClans = await this.clanRepository.find({
      where: { id: MoreThan(0) },
      relations: ['leader'],
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

    return availableClans;
  }

  async declareWar(userId: number, targetClanId: number): Promise<ClanWar> {
    const myClan = await this.getLeaderClan(userId);

    if (myClan.id === targetClanId) {
      throw new BadRequestException('Cannot declare war on your own clan');
    }

    const targetClan = await this.clanRepository.findOne({
      where: { id: targetClanId },
    });

    if (!targetClan) {
      throw new NotFoundException('Target clan not found');
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
        throw new BadRequestException('Clan war cooldown is still active');
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
        'Target clan has reached maximum active wars',
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

    return this.clanWarRepository.save(clanWar);
  }

  async getEnemyClanMembers(userId: number): Promise<User[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan', 'clan.leader'],
    });

    if (!user || !user.clan) {
      throw new BadRequestException('User is not in a clan');
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

    return await this.userRepository.find({
      where: { clan_id: In(enemyClanIds) },
      relations: ['clan', 'guards'],
    });
  }

  async attackEnemy(
    userId: number,
    targetUserId: number,
  ): Promise<{
    win_chance: number;
    is_win: boolean;
    stolen_money: number;
    captured_guards: number;
    stolen_items: StolenItem[];
  }> {
    const attacker = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan', 'guards'],
    });

    const defender = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['clan', 'guards'],
    });

    if (!attacker || !defender) {
      throw new NotFoundException('Attacker or defender not found');
    }

    // Проверяем и завершаем истекшие SHIELD бусты у защитника
    await this.userBoostService.checkAndCompleteExpiredShieldBoosts(
      targetUserId,
      defender.shield_end_time || null,
    );

    // Проверяем активный SHIELD буст у защитника
    const defenderActiveBoosts =
      await this.userBoostService.findActiveByUserId(targetUserId);
    const defenderShieldBoost = defenderActiveBoosts.find(
      (b) => b.type === UserBoostType.SHIELD,
    );

    // Проверяем shield_end_time (для обратной совместимости и проверки времени)
    if (defender.shield_end_time && defender.shield_end_time > new Date()) {
      throw new BadRequestException('Cannot attack user with active shield');
    }

    // Если есть активный SHIELD буст, но shield_end_time истек, завершаем буст
    if (
      defenderShieldBoost &&
      (!defender.shield_end_time || defender.shield_end_time <= new Date())
    ) {
      await this.userBoostService.complete(defenderShieldBoost.id);
    }

    attacker.shield_end_time = undefined;

    // Проверяем активные бусты у атакующего
    const attackerActiveBoosts =
      await this.userBoostService.findActiveByUserId(userId);
    const cooldownHalvingBoost = attackerActiveBoosts.find(
      (b) => b.type === UserBoostType.COOLDOWN_HALVING,
    );

    let attackCooldown = Settings[SettingKey.ATTACK_COOLDOWN];
    if (cooldownHalvingBoost) {
      attackCooldown = attackCooldown / 2;
      // Завершаем буст после использования
      await this.userBoostService.complete(cooldownHalvingBoost.id);
    }

    if (attacker.last_attack_time) {
      const cooldownEndTime = new Date(
        attacker.last_attack_time.getTime() + attackCooldown,
      );
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException('Attack cooldown is still active');
      }
    }

    if (!attacker.clan || !defender.clan) {
      throw new BadRequestException('Attacker or defender is not in a clan');
    }

    if (attacker.clan.id === defender.clan.id) {
      throw new BadRequestException('Cannot attack member of your own clan');
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
      throw new BadRequestException('No active war between clans');
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
      throw new BadRequestException('Attacker or defender has no guards');
    }

    if (defender_guards === 0) {
      throw new BadRequestException('Defender has no capturable guards');
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

      return {
        win_chance,
        is_win: true,
        stolen_money: stolen_money || 0,
        captured_guards: captured_guards || 0,
        stolen_items,
      };
    }

    attacker.last_attack_time = new Date();
    await this.userRepository.save(attacker);

    return {
      win_chance,
      is_win: false,
      stolen_money: 0,
      captured_guards: 0,
      stolen_items: [],
    };
  }

  async leaveClan(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan', 'clan.leader'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.clan) {
      throw new BadRequestException('User is not in a clan');
    }

    if (user.clan.leader?.id === userId) {
      throw new BadRequestException('Clan leader cannot leave the clan');
    }

    user.clan_leave_time = new Date();
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
      throw new NotFoundException('User not found');
    }

    if (user.clan) {
      throw new BadRequestException('User is already in a clan');
    }

    const clan = await this.clanRepository.findOne({
      where: { id: clanId },
      relations: ['members'],
    });

    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    if (clan.members && clan.members.length >= clan.max_members) {
      throw new BadRequestException('Clan is full');
    }

    const existingApplication = await this.clanApplicationRepository.findOne({
      where: {
        user_id: userId,
        clan_id: clanId,
        status: ClanApplicationStatus.PENDING,
      },
    });

    if (existingApplication) {
      throw new BadRequestException('Application already exists');
    }

    const clanJoinCooldown = Settings[SettingKey.CLAN_JOIN_COOLDOWN];
    if (user.clan_leave_time) {
      const cooldownEndTime = new Date(
        user.clan_leave_time.getTime() + clanJoinCooldown,
      );
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException('Clan join cooldown is still active');
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
      throw new NotFoundException('Application not found');
    }

    if (application.clan.id !== clan.id) {
      throw new BadRequestException('Application does not belong to your clan');
    }

    if (application.status !== ClanApplicationStatus.PENDING) {
      throw new BadRequestException('Application is not pending');
    }

    const user = application.user;

    if (user.clan) {
      throw new BadRequestException('User is already in a clan');
    }

    const clanJoinCooldown = Settings[SettingKey.CLAN_JOIN_COOLDOWN];
    if (user.clan_leave_time) {
      const cooldownEndTime = new Date(
        user.clan_leave_time.getTime() + clanJoinCooldown,
      );
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException('Clan join cooldown is still active');
      }
    }

    const updatedClan = await this.clanRepository.findOne({
      where: { id: clan.id },
      relations: ['members'],
    });

    if (!updatedClan) {
      throw new NotFoundException('Clan not found');
    }

    if (
      updatedClan.members &&
      updatedClan.members.length >= updatedClan.max_members
    ) {
      throw new BadRequestException('Clan is full');
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
      throw new NotFoundException('Application not found');
    }

    if (application.clan.id !== clan.id) {
      throw new BadRequestException('Application does not belong to your clan');
    }

    if (application.status !== ClanApplicationStatus.PENDING) {
      throw new BadRequestException('Application is not pending');
    }

    application.status = ClanApplicationStatus.REJECTED;
    return this.clanApplicationRepository.save(application);
  }

  async getUserClan(userId: number): Promise<Clan> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan', 'clan.leader', 'clan.members'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.clan) {
      throw new NotFoundException('User is not in a clan');
    }

    return user.clan;
  }

  async getActiveWars(clanId: number): Promise<ClanWar[]> {
    return this.clanWarRepository.find({
      where: [
        { clan_1_id: clanId, status: ClanWarStatus.IN_PROGRESS },
        { clan_2_id: clanId, status: ClanWarStatus.IN_PROGRESS },
      ],
      relations: ['clan_1', 'clan_2'],
      order: { start_time: 'DESC' },
    });
  }

  async getAllWars(clanId: number): Promise<ClanWar[]> {
    return await this.clanWarRepository.find({
      where: [{ clan_1_id: clanId }, { clan_2_id: clanId }],
      relations: ['clan_1', 'clan_2', 'clan_1.leader', 'clan_2.leader'],
      order: { created_at: 'DESC' },
    });
  }

  async getClanMembers(clanId: number): Promise<User[]> {
    const clan = await this.clanRepository.findOne({
      where: { id: clanId },
    });

    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    return await this.userRepository.find({
      where: { clan_id: clanId },
      relations: ['guards'],
    });
  }

  async getClanRating(
    paginationDto?: PaginationDto,
  ): Promise<{
    data: (Omit<Clan, 'combineWars'> & {
      wins: number;
      losses: number;
      rating: number;
    })[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const allClans = await this.clanRepository.find({
      relations: ['leader', 'members'],
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

        return {
          ...clan,
          wins,
          losses,
          rating,
        } as Omit<Clan, 'combineWars'> & {
          wins: number;
          losses: number;
          rating: number;
        };
      }),
    );

    clansWithRating.sort((a, b) => {
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
}
