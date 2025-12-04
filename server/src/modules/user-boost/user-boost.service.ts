import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { UserBoost } from './user-boost.entity';
import { CreateUserBoostDto } from './dtos/create-user-boost.dto';
import { UpdateUserBoostDto } from './dtos/update-user-boost.dto';
import { UserBoostType } from './enums/user-boost-type.enum';

@Injectable()
export class UserBoostService {
  constructor(
    @InjectRepository(UserBoost)
    private readonly userBoostRepository: Repository<UserBoost>,
  ) {}

  async findByUserId(userId: number): Promise<UserBoost[]> {
    return this.userBoostRepository
      .createQueryBuilder('boost')
      .leftJoin('boost.user', 'user')
      .select(['boost.id', 'boost.type', 'boost.end_time', 'boost.user_id'])
      .where('boost.user_id = :userId', { userId })
      .orderBy('boost.created_at', 'DESC')
      .getMany();
  }

  async findActiveByUserId(userId: number): Promise<UserBoost[]> {
    const now = new Date();
    return this.userBoostRepository
      .createQueryBuilder('boost')
      .leftJoin('boost.user', 'user')
      .select(['boost.id', 'boost.type', 'boost.end_time', 'boost.user_id'])
      .where('boost.user_id = :userId', { userId })
      .andWhere('boost.end_time > :now', { now })
      .orderBy('boost.created_at', 'DESC')
      .getMany();
  }

  async findActiveShieldBoostsByUserIds(
    userIds: number[],
  ): Promise<Map<number, Date | null>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const now = new Date();
    const shieldBoosts = await this.userBoostRepository
      .createQueryBuilder('boost')
      .leftJoin('boost.user', 'user')
      .select(['boost.id', 'boost.type', 'boost.end_time', 'boost.user_id'])
      .where('boost.user_id IN (:...userIds)', { userIds })
      .andWhere('boost.type = :type', { type: UserBoostType.SHIELD })
      .andWhere('boost.end_time > :now', { now })
      .orderBy('boost.created_at', 'DESC')
      .getMany();

    const shieldMap = new Map<number, Date | null>();
    for (const userId of userIds) {
      shieldMap.set(userId, null);
    }

    for (const boost of shieldBoosts) {
      const userId = boost.user_id;
      const existingEndTime = shieldMap.get(userId);
      if (existingEndTime === null || !existingEndTime) {
        shieldMap.set(userId, boost.end_time || null);
      } else if (boost.end_time && boost.end_time > existingEndTime) {
        shieldMap.set(userId, boost.end_time);
      }
    }

    return shieldMap;
  }

  async findLastByUserIdAndType(
    userId: number,
    type: UserBoostType,
  ): Promise<UserBoost | null> {
    return this.userBoostRepository.findOne({
      where: {
        user: { id: userId },
        type,
      },
      order: { created_at: 'DESC' },
    });
  }

  async checkAndCompleteExpiredShieldBoosts(userId: number): Promise<void> {
    const now = new Date();
    const shieldBoosts = await this.userBoostRepository.find({
      where: {
        user: { id: userId },
        type: UserBoostType.SHIELD,
      },
    });

    const expiredBoosts = shieldBoosts.filter(
      (boost) => boost.end_time && boost.end_time <= now,
    );

    if (expiredBoosts.length > 0) {
      expiredBoosts.forEach((boost) => {
        boost.end_time = now;
      });
      await this.userBoostRepository.save(expiredBoosts);
    }
  }

  async create(createUserBoostDto: CreateUserBoostDto): Promise<UserBoost> {
    const { user_id, ...rest } = createUserBoostDto;
    const userBoost = this.userBoostRepository.create({
      ...rest,
      user: { id: user_id } as any,
    });
    return this.userBoostRepository.save(userBoost);
  }

  async update(
    id: number,
    updateUserBoostDto: UpdateUserBoostDto,
  ): Promise<UserBoost> {
    const userBoost = await this.userBoostRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!userBoost) {
      throw new NotFoundException(`UserBoost with ID ${id} not found`);
    }

    Object.assign(userBoost, updateUserBoostDto);
    return this.userBoostRepository.save(userBoost);
  }

  async complete(id: number): Promise<UserBoost> {
    const userBoost = await this.userBoostRepository.findOne({
      where: { id },
    });

    if (!userBoost) {
      throw new NotFoundException(`UserBoost with ID ${id} not found`);
    }

    userBoost.end_time = new Date();
    return this.userBoostRepository.save(userBoost);
  }
}
