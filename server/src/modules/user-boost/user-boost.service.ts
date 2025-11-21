import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBoost } from './user-boost.entity';
import { CreateUserBoostDto } from './dtos/create-user-boost.dto';
import { UpdateUserBoostDto } from './dtos/update-user-boost.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { UserBoostStatus } from './enums/user-boost-status.enum';
import { UserBoostType } from './enums/user-boost-type.enum';

@Injectable()
export class UserBoostService {
  constructor(
    @InjectRepository(UserBoost)
    private readonly userBoostRepository: Repository<UserBoost>,
  ) {}

  async findAll(paginationDto: PaginationDto): Promise<{
    data: UserBoost[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.userBoostRepository.findAndCount({
      relations: ['user'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<UserBoost> {
    const userBoost = await this.userBoostRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!userBoost) {
      throw new NotFoundException(`UserBoost with ID ${id} not found`);
    }

    return userBoost;
  }

  async findByUserId(userId: number): Promise<UserBoost[]> {
    return this.userBoostRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findActiveByUserId(userId: number): Promise<UserBoost[]> {
    return this.userBoostRepository.find({
      where: {
        user: { id: userId },
        status: UserBoostStatus.ACTIVE,
      },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findActiveByUserIdAndType(
    userId: number,
    type: UserBoostType,
  ): Promise<UserBoost | null> {
    return this.userBoostRepository.findOne({
      where: {
        user: { id: userId },
        type,
        status: UserBoostStatus.ACTIVE,
      },
      relations: ['user'],
    });
  }

  async checkAndCompleteExpiredShieldBoosts(
    userId: number,
    shieldEndTime: Date | null,
  ): Promise<void> {
    if (!shieldEndTime || shieldEndTime > new Date()) {
      return; // Shield еще активен
    }

    // Если shield_end_time истек, завершаем все активные SHIELD бусты
    const activeShieldBoosts = await this.userBoostRepository.find({
      where: {
        user: { id: userId },
        type: UserBoostType.SHIELD,
        status: UserBoostStatus.ACTIVE,
      },
    });

    for (const boost of activeShieldBoosts) {
      boost.status = UserBoostStatus.COMPLETED;
      await this.userBoostRepository.save(boost);
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

    userBoost.status = UserBoostStatus.COMPLETED;
    return this.userBoostRepository.save(userBoost);
  }

  async remove(id: number): Promise<void> {
    const userBoost = await this.userBoostRepository.findOne({ where: { id } });

    if (!userBoost) {
      throw new NotFoundException(`UserBoost with ID ${id} not found`);
    }

    await this.userBoostRepository.remove(userBoost);
  }
}
