import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { In, Not, Repository, DataSource, EntityManager } from 'typeorm';
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
import { ClanStatsResponseDto } from './dtos/responses/clan-with-stats-response.dto';
import { ClanReferralResponseDto } from './dtos/responses/clan-with-referral-response.dto';
import { ClanRatingResponseDto } from './dtos/responses/clan-rating-response.dto';
import { UserStatsResponseDto } from './dtos/responses/user-with-stats-response.dto';
import { ClanAttackEnemyResponseDto } from './dtos/responses/attack-enemy-response.dto';
import { ClanWarResponseDto } from '../clan-war/dtos/responses/clan-war-response.dto';
import { ClanApplicationStatus } from './enums/clan-application.enum';
import { LeaveClanResponseDto } from '../user/dtos/responses/user-leave-clan-response.dto';
import { KickMemberResponseDto } from '../user/dtos/responses/user-kick-member-response.dto';
import { UserBasicStatsResponseDto } from '../user/dtos/responses/user-with-basic-stats-response.dto';
import { ClanApplicationResponseDto } from './dtos/responses/clan-application-response.dto';
import { ClanDetailResponseDto } from './dtos/responses/clan-detail-response.dto';
import * as fs from 'fs';
import * as path from 'path';
import { UserBoostService } from '../user-boost/user-boost.service';
import { UserBoostType } from '../user-boost/enums/user-boost-type.enum';
import { ENV } from '../../config/constants';
import { randomUUID } from 'crypto';
import { EventHistoryService } from '../event-history/event-history.service';
import { EventHistoryType } from '../event-history/enums/event-history-type.enum';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enums/notification-type.enum';
import { CacheService } from '../../common/services/cache.service';

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
    @InjectRepository(ClanApplication)
    private readonly clanApplicationRepository: Repository<ClanApplication>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly userBoostService: UserBoostService,
    private readonly eventHistoryService: EventHistoryService,
    private readonly notificationService: NotificationService,
    private readonly cacheService: CacheService,
  ) {}

  private async updateUserGuardsStats(
    userId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const userGuardRepo = manager
      ? manager.getRepository(UserGuard)
      : this.userGuardRepository;

    const result = await userGuardRepo
      .createQueryBuilder('guard')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(guard.strength), 0)', 'strength')
      .where('guard.user_id = :userId', { userId })
      .getRawOne();

    const guardsCount = parseInt(result.count, 10) || 0;
    const strength = parseInt(result.strength, 10) || 0;

    if (manager) {
      await manager.update(User, userId, {
        guards_count: guardsCount,
        strength: strength,
      });
    } else {
      await this.userRepository.update(userId, {
        guards_count: guardsCount,
        strength: strength,
      });
    }
  }

  private calculateClanMoney(members: User[]): number {
    if (!members || members.length === 0) return 0;
    return members.reduce((sum, member) => sum + Number(member.money || 0), 0);
  }

  async updateClanStats(
    clanId: number,
    manager?: EntityManager,
  ): Promise<void> {
    if (manager) {
      await manager.query(
        `UPDATE clan SET 
          strength = (SELECT COALESCE(SUM(strength), 0) FROM "user" WHERE clan_id = $1),
          guards_count = (SELECT COALESCE(SUM(guards_count), 0) FROM "user" WHERE clan_id = $1),
          members_count = (SELECT COUNT(*) FROM "user" WHERE clan_id = $1)
        WHERE id = $1`,
        [clanId],
      );
    } else {
      await this.clanRepository.manager.query(
        `UPDATE clan SET 
        strength = (SELECT COALESCE(SUM(strength), 0) FROM "user" WHERE clan_id = $1),
        guards_count = (SELECT COALESCE(SUM(guards_count), 0) FROM "user" WHERE clan_id = $1),
        members_count = (SELECT COUNT(*) FROM "user" WHERE clan_id = $1)
      WHERE id = $1`,
        [clanId],
      );
    }
  }

  private transformClanForResponse(
    clan: Clan,
    options?: { includeReferralLink?: boolean; includeMembers?: boolean },
  ): ClanStatsResponseDto | ClanReferralResponseDto {
    const transformed: any = {
      id: clan.id,
      name: clan.name,
      max_members: clan.max_members,
      image_path: clan.image_path,
      leader_id: clan.leader_id || undefined,
    };

    if ((clan as any).money !== undefined) {
      transformed.money = (clan as any).money;
    } else if (clan.members) {
      transformed.money = this.calculateClanMoney(clan.members);
    }
    transformed.strength = clan.strength ?? 0;
    transformed.guards_count = clan.guards_count ?? 0;
    transformed.members_count =
      clan.members_count ?? (clan.members?.length || 0);

    if (clan.wars) {
      transformed.wars_count = clan.wars.length;
    } else {
      transformed.wars_count = 0;
    }

    if (options?.includeReferralLink) {
      transformed.referral_link = clan.referral_link_id
        ? `${ENV.VK_APP_URL}#ref_${clan.referral_link_id}`
        : undefined;
      transformed.referral_link_id = clan.referral_link_id || undefined;
      return transformed as ClanReferralResponseDto;
    }

    return transformed as ClanStatsResponseDto;
  }

  private transformToClanStatsResponseDto(clan: Clan): ClanStatsResponseDto {
    return this.transformClanForResponse(clan, {
      includeReferralLink: false,
      includeMembers: false,
    }) as ClanStatsResponseDto;
  }

  private transformToClanReferralResponseDto(
    clan: Clan,
  ): ClanReferralResponseDto {
    const transformed = this.transformClanForResponse(clan, {
      includeReferralLink: true,
      includeMembers: false,
    }) as ClanReferralResponseDto;

    return {
      ...transformed,
      leader_id: clan.leader_id || undefined,
      referral_link_id: clan.referral_link_id || undefined,
    } as ClanReferralResponseDto;
  }

  private async transformToUserStatsResponseDto(
    user: User,
    shieldBoostsMap?: Map<number, Date | null>,
  ): Promise<UserStatsResponseDto> {
    const guardsCount = user.guards_count ?? 0;
    const strength = user.strength ?? 0;
    const shieldEndTime = shieldBoostsMap
      ? shieldBoostsMap.get(user.id) || null
      : (await this.userBoostService.findActiveByUserId(user.id)).find(
          (b) => b.type === UserBoostType.SHIELD,
        )?.end_time || null;

    return {
      id: user.id,
      vk_id: user.vk_id,
      first_name: user.first_name,
      last_name: user.last_name,
      sex: user.sex,
      image_path: user.image_path || null,
      birthday_date: user.birthday_date,
      money: user.money,
      shield_end_time: shieldEndTime || undefined,
      last_training_time: user.last_training_time,
      last_contract_time: user.last_contract_time,
      last_attack_time: user.last_attack_time,
      clan_leave_time: user.clan_leave_time,
      registered_at: user.registered_at,
      last_login_at: user.last_login_at,
      clan_id: user.clan_id,
      strength,
      guards_count: guardsCount,
    };
  }

  private async transformToUserBasicStatsResponseDto(
    user: User,
    shieldBoostsMap?: Map<number, Date | null>,
  ): Promise<UserBasicStatsResponseDto> {
    const guardsCount = user.guards_count ?? 0;
    const strength = user.strength ?? 0;
    const guardAsUserStrength = user.user_as_guard
      ? Number(user.user_as_guard.strength)
      : null;
    const referralsCount = user.referrals_count ?? 0;
    const shieldEndTime = shieldBoostsMap
      ? shieldBoostsMap.get(user.id) || null
      : (await this.userBoostService.findActiveByUserId(user.id)).find(
          (b) => b.type === UserBoostType.SHIELD,
        )?.end_time || null;

    return {
      id: user.id,
      vk_id: user.vk_id,
      first_name: user.first_name,
      last_name: user.last_name,
      sex: user.sex,
      image_path: user.image_path || null,
      birthday_date: user.birthday_date,
      money: user.money,
      shield_end_time: shieldEndTime || undefined,
      last_training_time: user.last_training_time,
      last_contract_time: user.last_contract_time,
      last_attack_time: user.last_attack_time,
      clan_leave_time: user.clan_leave_time,
      registered_at: user.registered_at,
      last_login_at: user.last_login_at,
      clan_id: user.clan_id,
      strength,
      guards_count: guardsCount,
      first_guard_strength: guardAsUserStrength,
      referral_link: user.referral_link_id
        ? `${ENV.VK_APP_URL}#ref_${user.referral_link_id}`
        : undefined,
      referrals_count: referralsCount,
    };
  }

  private transformToClanApplicationResponseDto(
    application: ClanApplication,
  ): ClanApplicationResponseDto {
    return {
      id: application.id,
      user: application.user
        ? {
            id: application.user.id,
            vk_id: application.user.vk_id,
            first_name: application.user.first_name,
            last_name: application.user.last_name,
            sex: application.user.sex,
            image_path: application.user.image_path || null,
            birthday_date: application.user.birthday_date,
            money: application.user.money,
            shield_end_time: undefined,
            last_training_time: application.user.last_training_time,
            last_contract_time: application.user.last_contract_time,
            last_attack_time: application.user.last_attack_time,
            clan_leave_time: application.user.clan_leave_time,
            registered_at: application.user.registered_at,
            last_login_at: application.user.last_login_at,
            clan_id: application.user.clan_id,
            strength: application.user.strength ?? 0,
            guards_count: application.user.guards_count ?? 0,
            first_guard_strength: application.user.user_as_guard
              ? Number(application.user.user_as_guard.strength)
              : null,
            referral_link: application.user.referral_link_id
              ? `${ENV.VK_APP_URL}#ref_${application.user.referral_link_id}`
              : undefined,
            referrals_count: application.user.referrals_count ?? 0,
          }
        : undefined,
      created_at: application.created_at,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
    query?: string,
  ): Promise<PaginatedResponseDto<ClanStatsResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.clanRepository
      .createQueryBuilder('clan')
      .select([
        'clan.id',
        'clan.name',
        'clan.max_members',
        'clan.image_path',
        'clan.leader_id',
        'clan.strength',
        'clan.guards_count',
        'clan.members_count',
        'clan.referral_link_id',
      ]);

    if (query && query.trim()) {
      const searchQuery = `%${query.trim()}%`;
      queryBuilder.where('clan.name ILIKE :query', { query: searchQuery });
    }

    queryBuilder
      .orderBy('clan.strength', 'DESC')
      .addOrderBy('clan.guards_count', 'DESC')
      .addOrderBy('clan.id', 'ASC')
      .skip(skip)
      .take(limit);

    const [clans, total] = await queryBuilder.getManyAndCount();

    const transformedData = clans.map((clan) => {
      return {
        id: clan.id,
        name: clan.name,
        max_members: clan.max_members,
        image_path: clan.image_path,
        leader_id: clan.leader_id || undefined,
        strength: clan.strength ?? 0,
        guards_count: clan.guards_count ?? 0,
        members_count: clan.members_count ?? 0,
      } as ClanStatsResponseDto;
    });

    return {
      data: transformedData,
      total,
      page,
      limit,
    };
  }

  private async transformToClanDetailResponseDto(
    clan: Clan,
    activeWarsCount?: number,
    warEndTime?: Date,
  ): Promise<ClanDetailResponseDto> {
    const strength = clan.strength ?? 0;
    const membersCount = clan.members_count ?? (clan.members?.length || 0);
    const hasActiveWars =
      activeWarsCount !== undefined ? activeWarsCount > 0 : false;

    const allUserIds = [
      ...(clan.leader ? [clan.leader.id] : []),
      ...(clan.members || []).map((m) => m.id),
    ];
    const shieldBoostsMap =
      allUserIds.length > 0
        ? await this.userBoostService.findActiveShieldBoostsByUserIds(
            allUserIds,
          )
        : new Map<number, Date | null>();

    const leader = clan.leader
      ? await this.transformToUserBasicStatsResponseDto(
          clan.leader,
          shieldBoostsMap,
        )
      : null;

    if (!leader) {
      throw new NotFoundException('Лидер клана не найден');
    }

    const members = await Promise.all(
      (clan.members || []).map((member) =>
        this.transformToUserStatsResponseDto(member, shieldBoostsMap),
      ),
    );

    return {
      id: clan.id,
      name: clan.name,
      image_path: clan.image_path,
      strength,
      members_count: membersCount,
      vk_group_id: clan.vk_group_id,
      description: '',
      has_active_wars: hasActiveWars,
      war_end_time: warEndTime?.toISOString(),
      leader,
      members,
    };
  }

  async findOneForAdmin(id: number): Promise<ClanStatsResponseDto> {
    const clan = await this.clanRepository
      .createQueryBuilder('clan')
      .select([
        'clan.id',
        'clan.name',
        'clan.max_members',
        'clan.image_path',
        'clan.leader_id',
        'clan.strength',
        'clan.guards_count',
        'clan.members_count',
        'clan.referral_link_id',
      ])
      .where('clan.id = :id', { id })
      .getOne();

    if (!clan) {
      throw new NotFoundException(`Клан с ID ${id} не найден`);
    }

    return {
      id: clan.id,
      name: clan.name,
      max_members: clan.max_members,
      image_path: clan.image_path,
      leader_id: clan.leader_id || undefined,
      strength: clan.strength ?? 0,
      guards_count: clan.guards_count ?? 0,
      members_count: clan.members_count ?? 0,
    };
  }

  async findOneForMiniApp(id: number): Promise<ClanDetailResponseDto> {
    const clan = await this.clanRepository
      .createQueryBuilder('clan')
      .leftJoinAndSelect('clan.members', 'member')
      .leftJoinAndSelect('member.user_as_guard', 'user_as_guard')
      .leftJoinAndSelect('clan.leader', 'leader')
      .leftJoinAndSelect('leader.user_as_guard', 'leader_user_as_guard')
      .select([
        'clan.id',
        'clan.name',
        'clan.image_path',
        'clan.strength',
        'clan.vk_group_id',
        'clan.members_count',
        'member.id',
        'member.vk_id',
        'member.first_name',
        'member.last_name',
        'member.sex',
        'member.image_path',
        'member.birthday_date',
        'member.money',
        'member.last_training_time',
        'member.last_contract_time',
        'member.last_attack_time',
        'member.clan_leave_time',
        'member.registered_at',
        'member.last_login_at',
        'member.clan_id',
        'member.strength',
        'member.guards_count',
        'user_as_guard.strength',
        'leader.id',
        'leader.vk_id',
        'leader.first_name',
        'leader.last_name',
        'leader.sex',
        'leader.image_path',
        'leader.birthday_date',
        'leader.money',
        'leader.last_training_time',
        'leader.last_contract_time',
        'leader.last_attack_time',
        'leader.clan_leave_time',
        'leader.registered_at',
        'leader.last_login_at',
        'leader.clan_id',
        'leader.strength',
        'leader.guards_count',
        'leader.referral_link_id',
        'leader.referrals_count',
        'leader_user_as_guard.strength',
      ])
      .where('clan.id = :id', { id })
      .getOne();

    if (!clan) {
      throw new NotFoundException(`Клан с ID ${id} не найден`);
    }

    const activeWarsCount = await this.clanWarRepository.count({
      where: [
        { clan_1_id: clan.id, status: ClanWarStatus.IN_PROGRESS },
        { clan_2_id: clan.id, status: ClanWarStatus.IN_PROGRESS },
      ],
    });

    return await this.transformToClanDetailResponseDto(clan, activeWarsCount);
  }

  async searchClans(
    query: string,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanStatsResponseDto>> {
    if (!query || query.trim() === '') {
      throw new BadRequestException('Параметр запроса обязателен');
    }

    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.clanRepository
      .createQueryBuilder('clan')
      .select([
        'clan.id',
        'clan.name',
        'clan.max_members',
        'clan.image_path',
        'clan.leader_id',
        'clan.strength',
        'clan.guards_count',
        'clan.members_count',
        'clan.referral_link_id',
      ])
      .where('clan.name LIKE :query', { query: `%${query.trim()}%` })
      .orderBy('clan.strength', 'DESC')
      .addOrderBy('clan.guards_count', 'DESC')
      .addOrderBy('clan.id', 'ASC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const transformedData = data.map((clan) => ({
      id: clan.id,
      name: clan.name,
      max_members: clan.max_members,
      image_path: clan.image_path,
      leader_id: clan.leader_id || undefined,
      strength: clan.strength ?? 0,
      guards_count: clan.guards_count ?? 0,
      members_count: clan.members_count ?? 0,
    }));

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
  ): Promise<ClanReferralResponseDto> {
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
    await this.updateClanStats(savedClan.id);

    const clanWithRelations = await this.clanRepository
      .createQueryBuilder('clan')
      .leftJoin('clan.members', 'member')
      .select([
        'clan.id',
        'clan.name',
        'clan.max_members',
        'clan.image_path',
        'clan.leader_id',
        'clan.strength',
        'clan.guards_count',
        'clan.members_count',
        'clan.referral_link_id',
        'member.id',
        'member.money',
      ])
      .where('clan.id = :id', { id: savedClan.id })
      .getOne();

    if (!clanWithRelations) {
      throw new NotFoundException('Клан не найден после создания');
    }

    return this.transformToClanReferralResponseDto(clanWithRelations);
  }

  async createClanByUser(
    userId: number,
    createClanByUserDto: CreateClanByUserDto,
  ): Promise<ClanReferralResponseDto> {
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

    let groupName = createClanByUserDto.name;
    let groupImageUrl = createClanByUserDto.image_url;

    if (!groupName || !groupImageUrl) {
      try {
        const vkApiUrl = 'https://api.vk.com/method/groups.getById';
        const vkApiParams = new URLSearchParams({
          group_id: createClanByUserDto.vk_group_id.toString(),
          fields: 'photo_200',
          access_token: ENV.VK_SERVICE_TOKEN || ENV.VK_APP_SECRET,
          v: '5.131',
        });

        const response = await fetch(`${vkApiUrl}?${vkApiParams}`);
        const data = await response.json();

        if (data.error) {
          throw new BadRequestException(
            `Ошибка VK API при получении данных группы: ${data.error.error_msg || data.error.error_code}`,
          );
        }

        if (
          data.response &&
          Array.isArray(data.response) &&
          data.response.length > 0
        ) {
          const group = data.response[0];
          if (!groupName || !groupName.trim()) {
            groupName = group.name;
          }
          if (!groupImageUrl || !groupImageUrl.trim()) {
            groupImageUrl = group.photo_200 || '';
          }
        } else {
          throw new BadRequestException('Группа не найдена или недоступна');
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException(
          `Не удалось получить данные группы через VK API: ${error.message}`,
        );
      }
    }

    if (!groupName || !groupName.trim()) {
      throw new BadRequestException('Название клана обязательно');
    }

    if (!groupImageUrl || !groupImageUrl.trim()) {
      throw new BadRequestException('URL изображения обязателен');
    }

    if (!this.verifyVkImageUrl(groupImageUrl)) {
      throw new BadRequestException('Неверный URL изображения сообщества');
    }

    let imagePath = '';
    try {
      imagePath = await this.downloadAndSaveGroupImage(groupImageUrl);
    } catch (error) {
      throw new BadRequestException(
        `Не удалось скачать и сохранить изображение: ${error.message}`,
      );
    }

    if (!imagePath) {
      throw new BadRequestException('Не удалось сохранить изображение клана');
    }

    const clan = this.clanRepository.create({
      name: groupName.trim(),
      leader_id: userId,
      image_path: imagePath,
      referral_link_id: randomUUID(),
      vk_group_id: createClanByUserDto.vk_group_id,
    });
    const savedClan = await this.clanRepository.save(clan);

    user.clan_id = savedClan.id;
    await this.userRepository.save(user);
    await this.updateClanStats(savedClan.id);

    const clanWithRelations = await this.clanRepository
      .createQueryBuilder('clan')
      .select([
        'clan.id',
        'clan.name',
        'clan.max_members',
        'clan.image_path',
        'clan.leader_id',
        'clan.strength',
        'clan.guards_count',
        'clan.members_count',
        'clan.referral_link_id',
      ])
      .where('clan.id = :id', { id: savedClan.id })
      .getOne();

    if (!clanWithRelations) {
      throw new NotFoundException('Клан не найден после создания');
    }

    const moneyResult = await this.userRepository
      .createQueryBuilder('user')
      .select('COALESCE(SUM(user.money), 0)', 'total')
      .where('user.clan_id = :clanId', { clanId: savedClan.id })
      .getRawOne();

    const money = parseInt(moneyResult?.total || '0', 10);
    (clanWithRelations as any).money = money;

    await this.cacheService.invalidateClanCaches(savedClan.id, userId);

    return this.transformToClanReferralResponseDto(clanWithRelations);
  }

  async update(
    id: number,
    updateClanDto: UpdateClanDto,
    image?: Express.Multer.File,
  ): Promise<ClanReferralResponseDto> {
    const clan = await this.clanRepository.findOne({
      where: { id },
      relations: ['members'],
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

    if (
      updateClanDto.leader_id !== undefined &&
      updateClanDto.leader_id !== clan.leader_id
    ) {
      const newLeader = await this.userRepository.findOne({
        where: { id: updateClanDto.leader_id },
      });

      if (!newLeader) {
        throw new NotFoundException('Новый лидер не найден');
      }

      if (newLeader.clan_id !== clan.id) {
        throw new BadRequestException(
          'Новый лидер должен состоять в этом клане',
        );
      }

      clan.leader_id = updateClanDto.leader_id;
    }

    if (updateClanDto.member_ids !== undefined) {
      const currentMembers = clan.members || [];

      const newMemberIds = updateClanDto.member_ids;

      const finalMemberIds = [...new Set([...newMemberIds, clan.leader_id])];

      const newMembers = await this.userRepository.find({
        where: { id: In(finalMemberIds) },
      });

      if (newMembers.length !== finalMemberIds.length) {
        throw new NotFoundException('Один или несколько участников не найдены');
      }

      const oldClanIdsToUpdate = new Set<number>();

      for (const member of currentMembers) {
        if (
          member.id !== clan.leader_id &&
          !finalMemberIds.includes(member.id)
        ) {
          if (member.clan_id) {
            oldClanIdsToUpdate.add(member.clan_id);
          }
          member.clan_id = null;
          await this.userRepository.save(member);
        }
      }

      for (const member of newMembers) {
        if (member.clan_id !== clan.id) {
          if (member.clan_id !== null && member.clan_id !== clan.id) {
            oldClanIdsToUpdate.add(member.clan_id);
            throw new BadRequestException(
              `Пользователь с ID ${member.id} уже состоит в другом клане`,
            );
          }
          member.clan_id = clan.id;
          await this.userRepository.save(member);
        }
      }

      await this.updateClanStats(clan.id);
      for (const oldClanId of oldClanIdsToUpdate) {
        await this.updateClanStats(oldClanId);
      }
    }

    if (updateClanDto.war_ids !== undefined) {
      const wars = await this.clanWarRepository.find({
        where: { id: In(updateClanDto.war_ids) },
      });

      if (wars.length !== updateClanDto.war_ids.length) {
        throw new NotFoundException('Одна или несколько войн не найдены');
      }

      for (const war of wars) {
        if (war.clan_1_id !== id && war.clan_2_id !== id) {
          throw new BadRequestException(
            `Война с ID ${war.id} не связана с этим кланом`,
          );
        }
      }
    }

    if (updateClanDto.name !== undefined) {
      clan.name = updateClanDto.name;
    }
    if (updateClanDto.max_members !== undefined) {
      clan.max_members = updateClanDto.max_members;
    }
    if (updateClanDto.image_path !== undefined) {
      clan.image_path = updateClanDto.image_path;
    }

    const savedClan = await this.clanRepository.save(clan);
    if (updateClanDto.member_ids !== undefined) {
      await this.updateClanStats(clan.id);
    }

    const clanWithRelations = await this.clanRepository
      .createQueryBuilder('clan')
      .select([
        'clan.id',
        'clan.name',
        'clan.max_members',
        'clan.image_path',
        'clan.leader_id',
        'clan.strength',
        'clan.guards_count',
        'clan.members_count',
        'clan.referral_link_id',
      ])
      .where('clan.id = :id', { id: savedClan.id })
      .getOne();

    if (!clanWithRelations) {
      throw new NotFoundException('Клан не найден после обновления');
    }

    const moneyResult = await this.userRepository
      .createQueryBuilder('user')
      .select('COALESCE(SUM(user.money), 0)', 'total')
      .where('user.clan_id = :clanId', { clanId: savedClan.id })
      .getRawOne();

    const money = parseInt(moneyResult?.total || '0', 10);
    (clanWithRelations as any).money = money;

    const clanMembers = await this.userRepository.find({
      where: { clan_id: savedClan.id },
      select: ['id'],
    });
    await Promise.all([
      this.cacheService.invalidateClanCaches(savedClan.id),
      ...clanMembers.map((member) =>
        this.cacheService.invalidateClanCaches(savedClan.id, member.id),
      ),
    ]);

    return this.transformToClanReferralResponseDto(clanWithRelations);
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
      const memberIds = clan.members.map((m) => m.id);
      await this.userRepository.update(
        { id: In(memberIds) },
        { clan_id: null },
      );
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
      const memberIds = clan.members.map((m) => m.id);
      await this.userRepository.update(
        { id: In(memberIds) },
        { clan_id: null },
      );
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
      relations: [],
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
  ): Promise<ClanStatsResponseDto[]> {
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

    const clansWithMaxWars = await this.clanWarRepository
      .createQueryBuilder('war')
      .select('war.clan_1_id', 'clan_id')
      .addSelect('COUNT(*)', 'war_count')
      .where('war.status = :status', { status: ClanWarStatus.IN_PROGRESS })
      .groupBy('war.clan_1_id')
      .having('COUNT(*) >= :maxCount', { maxCount: maxClanWarsCount })
      .getRawMany();

    const clan2WithMaxWars = await this.clanWarRepository
      .createQueryBuilder('war')
      .select('war.clan_2_id', 'clan_id')
      .addSelect('COUNT(*)', 'war_count')
      .where('war.status = :status', { status: ClanWarStatus.IN_PROGRESS })
      .groupBy('war.clan_2_id')
      .having('COUNT(*) >= :maxCount', { maxCount: maxClanWarsCount })
      .getRawMany();

    const excludedClanIds = new Set([
      myClan.id,
      ...clansWithMaxWars.map((r) => r.clan_id),
      ...clan2WithMaxWars.map((r) => r.clan_id),
    ]);

    const availableClans = await this.clanRepository.find({
      where: {
        id: Not(In(Array.from(excludedClanIds))),
      },
      relations: ['members', 'members.guards', '_wars_1', '_wars_2'],
    });

    return availableClans.map((clan) =>
      this.transformToClanStatsResponseDto(clan),
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

  async attackEnemy(
    userId: number,
    targetUserId: number,
    enemyClanId?: number,
  ): Promise<ClanAttackEnemyResponseDto> {
    const [defender, attackerForCheck] = await Promise.all([
      this.userRepository.findOne({
        where: { id: targetUserId },
        relations: ['clan'],
        select: ['id', 'clan', 'strength'],
      }),
      this.userRepository.findOne({
        where: { id: userId },
        relations: ['clan'],
        select: ['id', 'clan_id', 'clan'],
      }),
    ]);

    if (!defender) {
      throw new NotFoundException('Защищающийся не найден');
    }

    if (!defender.clan) {
      throw new BadRequestException('Защищающийся не состоит в клане');
    }

    if (!attackerForCheck) {
      throw new NotFoundException('Атакующий не найден');
    }

    if (!attackerForCheck.clan) {
      throw new BadRequestException('Атакующий не состоит в клане');
    }

    if (attackerForCheck.clan.id === defender.clan.id) {
      throw new BadRequestException('Нельзя атаковать участника своего клана');
    }

    if (enemyClanId && defender.clan.id !== enemyClanId) {
      throw new BadRequestException(
        'Целевой пользователь не принадлежит указанному вражескому клану',
      );
    }

    const userIds = [targetUserId, userId];
    const [shieldBoostsMap, activeBoostsMap, activeWar] = await Promise.all([
      this.userBoostService.findActiveShieldBoostsByUserIds(userIds),
      this.userBoostService.findActiveBoostsByUserIds(userIds),
      this.clanWarRepository.findOne({
        where: [
          {
            clan_1_id: attackerForCheck.clan.id,
            clan_2_id: defender.clan.id,
            status: ClanWarStatus.IN_PROGRESS,
          },
          {
            clan_1_id: defender.clan.id,
            clan_2_id: attackerForCheck.clan.id,
            status: ClanWarStatus.IN_PROGRESS,
          },
        ],
      }),
    ]);

    const defenderShieldEndTime = shieldBoostsMap.get(targetUserId);
    if (defenderShieldEndTime) {
      throw new BadRequestException(
        'Нельзя атаковать пользователя с активным щитом',
      );
    }

    if (!activeWar) {
      throw new BadRequestException('Нет активной войны между кланами');
    }

    if (enemyClanId) {
      const isEnemyClanInWar =
        (activeWar.clan_1_id === attackerForCheck.clan.id &&
          activeWar.clan_2_id === enemyClanId) ||
        (activeWar.clan_2_id === attackerForCheck.clan.id &&
          activeWar.clan_1_id === enemyClanId);
      if (!isEnemyClanInWar) {
        throw new BadRequestException(
          'Нет активной войны с указанным вражеским кланом',
        );
      }
    }

    const attackerActiveBoosts = activeBoostsMap.get(userId) || [];
    const attackerShieldBoost = attackerActiveBoosts.find(
      (b) => b.type === UserBoostType.SHIELD,
    );
    if (attackerShieldBoost) {
      await this.userBoostService.complete(attackerShieldBoost.id);
    }

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

    return await this.dataSource.transaction(async (manager) => {
      const [attacker, defenderWithGuards] = await Promise.all([
        manager
          .createQueryBuilder(User, 'user')
          .where('user.id = :userId', { userId })
          .select([
            'user.id',
            'user.vk_id',
            'user.clan_id',
            'user.strength',
            'user.guards_count',
            'user.last_attack_time',
            'user.money',
          ])
          .getOne(),
        manager
          .createQueryBuilder(User, 'user')
          .leftJoinAndSelect('user.guards', 'guard', 'guard.is_first = false')
          .where('user.id = :targetUserId', { targetUserId })
          .select([
            'user.id',
            'user.strength',
            'user.money',
            'user.guards_count',
            'guard.id',
            'guard.strength',
            'guard.is_first',
          ])
          .getOne(),
      ]);

      if (!attacker) {
        throw new NotFoundException('Атакующий не найден');
      }

      if (!defenderWithGuards) {
        throw new NotFoundException('Защищающийся не найден');
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
      const defender_power = defenderWithGuards.strength ?? 0;
      const defender_guards_count = defenderWithGuards.guards_count ?? 0;
      const capturableDefenderGuards = defenderWithGuards.guards || [];
      const defender_guards = capturableDefenderGuards.length;

      if (attacker_guards === 0 || defender_guards_count === 0) {
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
      let stolen_money = 0;
      let captured_guards = 0;

      if (is_win) {
        stolen_money = Math.round(
          defenderWithGuards.money * 0.15 * (win_chance / 100),
        );

        if (stolen_money > 0) {
          defenderWithGuards.money =
            Number(defenderWithGuards.money) - stolen_money;
          attacker.money = Number(attacker.money) + stolen_money;
          await manager.save(User, [defenderWithGuards, attacker]);

          const moneyItem = manager.create(StolenItem, {
            type: StolenItemType.MONEY,
            value: stolen_money.toString(),
            thief: attacker,
            victim: defenderWithGuards,
            clan_war: activeWar,
          });
          await manager.save(StolenItem, moneyItem);
          stolen_items.push(moneyItem);
        }

        captured_guards = Math.round(
          defender_guards * 0.08 * (win_chance / 100),
        );

        if (captured_guards > 0 && capturableDefenderGuards.length > 0) {
          const guardsToCapture = capturableDefenderGuards.slice(
            0,
            captured_guards,
          );

          guardsToCapture.forEach((guard) => {
            guard.user_id = attacker.id;
          });
          await manager.save(UserGuard, guardsToCapture);

          const guardItems = guardsToCapture.map((guard) =>
            manager.create(StolenItem, {
              type: StolenItemType.GUARD,
              value: guard.id.toString(),
              thief: attacker,
              victim: defenderWithGuards,
              clan_war: activeWar,
            }),
          );
          const savedGuardItems = await manager.save(StolenItem, guardItems);
          stolen_items.push(...savedGuardItems);
        }

        const statsUpdates: Promise<void>[] = [
          this.updateUserGuardsStats(attacker.id, manager),
          this.updateUserGuardsStats(defenderWithGuards.id, manager),
        ];

        if (attacker.clan_id) {
          statsUpdates.push(this.updateClanStats(attacker.clan_id, manager));
        }
        if (
          defenderWithGuards.clan_id &&
          defenderWithGuards.clan_id !== attacker.clan_id
        ) {
          statsUpdates.push(
            this.updateClanStats(defenderWithGuards.clan_id, manager),
          );
        }

        await Promise.all(statsUpdates);

        attacker.last_attack_time = new Date();
        await manager.save(User, attacker);

        const attackCooldownEnd = new Date(
          new Date().getTime() + attackCooldown,
        );

        const result = {
          win_chance,
          is_win: true,
          stolen_money: stolen_money || 0,
          captured_guards: captured_guards || 0,
          stolen_items,
          attack_cooldown_end: attackCooldownEnd,
        };

        Promise.all([
          this.eventHistoryService.create(
            attacker.id,
            EventHistoryType.ATTACK,
            stolen_items,
            defenderWithGuards.id,
          ),
          this.eventHistoryService.create(
            defenderWithGuards.id,
            EventHistoryType.DEFENSE,
            stolen_items,
            attacker.id,
          ),
        ]).catch((error) => {
          console.error('Ошибка при создании истории событий:', error);
        });

        return result;
      }

      const statsUpdates: Promise<void>[] = [
        this.updateUserGuardsStats(attacker.id, manager),
        this.updateUserGuardsStats(defenderWithGuards.id, manager),
      ];

      if (attacker.clan_id) {
        statsUpdates.push(this.updateClanStats(attacker.clan_id, manager));
      }
      if (
        defenderWithGuards.clan_id &&
        defenderWithGuards.clan_id !== attacker.clan_id
      ) {
        statsUpdates.push(
          this.updateClanStats(defenderWithGuards.clan_id, manager),
        );
      }

      await Promise.all(statsUpdates);

      attacker.last_attack_time = new Date();
      await manager.save(User, attacker);

      const attackCooldownEnd = new Date(new Date().getTime() + attackCooldown);

      const result = {
        win_chance,
        is_win: false,
        stolen_money: 0,
        captured_guards: 0,
        stolen_items: [],
        attack_cooldown_end: attackCooldownEnd,
      };

      Promise.all([
        this.eventHistoryService.create(
          attacker.id,
          EventHistoryType.ATTACK,
          [],
          defenderWithGuards.id,
        ),
        this.eventHistoryService.create(
          defenderWithGuards.id,
          EventHistoryType.DEFENSE,
          [],
          attacker.id,
        ),
      ]).catch((error) => {
        console.error('Ошибка при создании истории событий:', error);
      });

      return result;
    });
  }

  async leaveClan(userId: number): Promise<LeaveClanResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan', 'guards', 'referrals'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (!user.clan) {
      throw new BadRequestException('Пользователь не состоит в клане');
    }

    if (user.clan.leader_id === userId) {
      throw new BadRequestException('Лидер клана не может покинуть клан');
    }

    const clanId = user.clan.id;
    user.clan_leave_time = new Date();
    user.clan_id = null;
    user.clan = undefined;
    await this.userRepository.save(user);
    await this.updateClanStats(clanId);

    const userDto = await this.transformToUserBasicStatsResponseDto(user);
    return { user: userDto };
  }

  async kickMember(
    leaderId: number,
    memberId: number,
  ): Promise<KickMemberResponseDto> {
    const leader = await this.userRepository.findOne({
      where: { id: leaderId },
      relations: ['clan'],
    });

    if (!leader) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (!leader.clan) {
      throw new BadRequestException('Пользователь не состоит в клане');
    }

    if (leader.clan.leader?.id !== leaderId) {
      throw new BadRequestException(
        'Только лидер клана может исключать участников',
      );
    }

    if (memberId === leaderId) {
      throw new BadRequestException('Лидер не может исключить самого себя');
    }

    const member = await this.userRepository.findOne({
      where: { id: memberId },
      relations: ['clan', 'guards', 'user_as_guard', 'referrals'],
    });

    if (!member) {
      throw new NotFoundException('Участник не найден');
    }

    if (!member.clan || member.clan.id !== leader.clan.id) {
      throw new BadRequestException('Пользователь не состоит в вашем клане');
    }

    const clanId = member.clan.id;
    member.clan_leave_time = new Date();
    member.clan_id = null;
    member.clan = undefined;
    await this.userRepository.save(member);
    await this.updateClanStats(clanId);

    const memberDto = await this.transformToUserBasicStatsResponseDto(member);
    return { user: memberDto };
  }

  async createApplication(
    userId: number,
    clanId: number,
  ): Promise<ClanApplicationResponseDto> {
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

    const savedApplication =
      await this.clanApplicationRepository.save(application);

    const applicationWithRelations =
      await this.clanApplicationRepository.findOne({
        where: { id: savedApplication.id },
        relations: ['user', 'user.guards', 'user.referrals'],
      });

    return this.transformToClanApplicationResponseDto(
      applicationWithRelations!,
    );
  }

  async getApplications(userId: number): Promise<ClanApplicationResponseDto[]> {
    const clan = await this.getLeaderClan(userId);

    const applications = await this.clanApplicationRepository.find({
      where: {
        clan_id: clan.id,
        status: ClanApplicationStatus.PENDING,
      },
      relations: ['user', 'user.guards', 'user.referrals'],
      order: { created_at: 'DESC' },
    });

    return applications.map((app) =>
      this.transformToClanApplicationResponseDto(app),
    );
  }

  async acceptApplication(
    userId: number,
    applicationId: number,
  ): Promise<ClanApplicationResponseDto> {
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
    await this.updateClanStats(clan.id);

    const applicationWithRelations =
      await this.clanApplicationRepository.findOne({
        where: { id: application.id },
        relations: ['user', 'user.guards', 'user.referrals'],
      });

    return this.transformToClanApplicationResponseDto(
      applicationWithRelations!,
    );
  }

  async rejectApplication(
    userId: number,
    applicationId: number,
  ): Promise<ClanApplicationResponseDto> {
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
    const savedApplication =
      await this.clanApplicationRepository.save(application);

    const applicationWithRelations =
      await this.clanApplicationRepository.findOne({
        where: { id: savedApplication.id },
        relations: ['user', 'user.guards', 'user.referrals'],
      });

    return this.transformToClanApplicationResponseDto(
      applicationWithRelations!,
    );
  }

  async getUserClan(userId: number): Promise<ClanDetailResponseDto> {
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

    return await this.transformToClanDetailResponseDto(
      user.clan,
      activeWarsCount,
    );
  }

  async getAllWars(
    clanId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanWarResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [wars, total] = await this.clanWarRepository.findAndCount({
      where: [{ clan_1_id: clanId }, { clan_2_id: clanId }],
      relations: ['clan_1', 'clan_2', 'clan_1.leader', 'clan_2.leader'],
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
      transformed.clan_1 = this.transformToClanStatsResponseDto(war.clan_1);
    }
    if (war.clan_2) {
      transformed.clan_2 = this.transformToClanStatsResponseDto(war.clan_2);
    }

    return transformed as ClanWarResponseDto;
  }

  async getEnemyClans(userId: number): Promise<ClanStatsResponseDto[]> {
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
      war.clan_1_id === user.clan!.id ? war.clan_2_id : war.clan_1_id,
    );

    if (enemyClanIds.length === 0) {
      return [];
    }

    const enemyClans = await this.clanRepository.find({
      where: { id: In(enemyClanIds) },
      relations: ['members', 'members.guards', '_wars_1', '_wars_2'],
    });

    const enemyClansMap = new Map(enemyClans.map((clan) => [clan.id, clan]));
    const warsMap = new Map(
      activeWars.map((war) => {
        const enemyClanId =
          war.clan_1_id === user.clan!.id ? war.clan_2_id : war.clan_1_id;
        return [enemyClanId, war];
      }),
    );

    return enemyClans.map((clan) => {
      const transformed = this.transformToClanStatsResponseDto(clan);
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
  ): Promise<ClanStatsResponseDto> {
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
      war.clan_1_id === user.clan!.id ? war.clan_2_id : war.clan_1_id,
    );

    if (!enemyClanIds.includes(enemyClanId)) {
      throw new BadRequestException(
        'Клан не является врагом или война не активна',
      );
    }

    const activeWar = activeWars.find(
      (war) =>
        (war.clan_1_id === user.clan!.id && war.clan_2_id === enemyClanId) ||
        (war.clan_2_id === user.clan!.id && war.clan_1_id === enemyClanId),
    );

    const enemyClan = await this.clanRepository.findOne({
      where: { id: enemyClanId },
      relations: ['members', 'members.guards', '_wars_1', '_wars_2'],
    });

    if (!enemyClan) {
      throw new NotFoundException('Вражеский клан не найден');
    }

    const transformed = this.transformToClanStatsResponseDto(enemyClan);
    if (activeWar) {
      (transformed as any).war_start_time = activeWar.start_time;
      (transformed as any).war_end_time = activeWar.end_time;
    }
    return transformed;
  }

  async getEnemyClanMembersById(
    userId: number,
    enemyClanId: number,
  ): Promise<UserStatsResponseDto[]> {
    await this.getEnemyClanById(userId, enemyClanId);

    const enemyClan = await this.clanRepository.findOne({
      where: { id: enemyClanId },
    });

    if (!enemyClan) {
      throw new NotFoundException('Вражеский клан не найден');
    }

    const members = await this.userRepository.find({
      where: { clan_id: enemyClanId },
      relations: ['guards'],
    });

    const userIds = members.map((m) => m.id);
    const shieldBoostsMap =
      await this.userBoostService.findActiveShieldBoostsByUserIds(userIds);

    const membersWithStats = await Promise.all(
      members.map((member) =>
        this.transformToUserStatsResponseDto(member, shieldBoostsMap),
      ),
    );

    membersWithStats.sort((a, b) => {
      const isALeader = a.id === enemyClan.leader_id;
      const isBLeader = b.id === enemyClan.leader_id;

      if (isALeader && !isBLeader) {
        return -1;
      }
      if (!isALeader && isBLeader) {
        return 1;
      }

      const strengthA = a.strength || 0;
      const strengthB = b.strength || 0;
      const guardsA = a.guards_count || 0;
      const guardsB = b.guards_count || 0;

      if (strengthB !== strengthA) {
        return strengthB - strengthA;
      }
      if (guardsB !== guardsA) {
        return guardsB - guardsA;
      }
      return 0;
    });

    return membersWithStats;
  }

  async getClanMembers(clanId: number): Promise<UserStatsResponseDto[]> {
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

    const userIds = members.map((m) => m.id);
    const shieldBoostsMap =
      await this.userBoostService.findActiveShieldBoostsByUserIds(userIds);

    const membersWithStats = await Promise.all(
      members.map((member) =>
        this.transformToUserStatsResponseDto(member, shieldBoostsMap),
      ),
    );

    membersWithStats.sort((a, b) => {
      const isALeader = a.id === clan.leader_id;
      const isBLeader = b.id === clan.leader_id;

      if (isALeader && !isBLeader) {
        return -1;
      }
      if (!isALeader && isBLeader) {
        return 1;
      }

      const strengthA = a.strength || 0;
      const strengthB = b.strength || 0;
      const guardsA = a.guards_count || 0;
      const guardsB = b.guards_count || 0;

      if (strengthB !== strengthA) {
        return strengthB - strengthA;
      }
      if (guardsB !== guardsA) {
        return guardsB - guardsA;
      }
      return 0;
    });

    return membersWithStats;
  }

  async getClanRating(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanRatingResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto || {};
    const MAX_RATING_LIMIT = Settings[SettingKey.RATING_LIMIT] as number;
    const actualLimit = Math.min(limit, MAX_RATING_LIMIT);
    const skip = (page - 1) * actualLimit;

    const baseQuery = this.clanRepository.createQueryBuilder('clan');

    const totalCount = await baseQuery.getCount();
    const total = Math.min(totalCount, MAX_RATING_LIMIT);

    if (skip >= MAX_RATING_LIMIT) {
      return {
        data: [],
        total: total,
        page: Number(page),
        limit: Number(actualLimit),
      };
    }

    const remainingLimit = Math.min(actualLimit, MAX_RATING_LIMIT - skip);

    const clans = await baseQuery
      .orderBy('clan.strength', 'DESC')
      .addOrderBy('clan.guards_count', 'DESC')
      .addOrderBy('clan.id', 'ASC')
      .skip(skip)
      .take(remainingLimit)
      .getMany();

    const paginatedData = clans.map((clan) => {
      const guardsCount = clan.guards_count ?? 0;
      const strength = clan.strength ?? 0;

      return {
        id: clan.id,
        name: clan.name,
        image_path: clan.image_path,
        strength,
        guards_count: guardsCount,
        members_count: clan.members_count ?? 0,
        vk_group_id: clan.vk_group_id,
      } as ClanRatingResponseDto;
    });

    return {
      data: paginatedData,
      total: Number(total),
      page: Number(page),
      limit: Number(remainingLimit),
    };
  }

  private verifyVkImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const vkImageUrlPattern =
      /^https?:\/\/(?:[a-z0-9-]+\.)?(?:vk\.com|userapi\.com|vk-cdn\.net|vkuser\.net|vk\.me|vkuseraudio\.net|vk-cdn\.org)\/.+$/i;

    return vkImageUrlPattern.test(url);
  }

  private async downloadAndSaveGroupImage(photoUrl: string): Promise<string> {
    if (!this.verifyVkImageUrl(photoUrl)) {
      throw new BadRequestException('Неверный URL изображения сообщества');
    }

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
