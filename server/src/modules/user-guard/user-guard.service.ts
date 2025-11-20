import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserGuard } from './user-guard.entity';
import { CreateUserGuardDto } from './dtos/create-user-guard.dto';
import { UpdateUserGuardDto } from './dtos/update-user-guard.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@Injectable()
export class UserGuardService {
  constructor(
    @InjectRepository(UserGuard)
    private readonly userGuardRepository: Repository<UserGuard>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{
    data: UserGuard[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.userGuardRepository.findAndCount({
      relations: ['user'],
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

  async findOne(id: number): Promise<UserGuard> {
    const userGuard = await this.userGuardRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!userGuard) {
      throw new NotFoundException(`UserGuard with ID ${id} not found`);
    }

    return userGuard;
  }

  async create(createUserGuardDto: CreateUserGuardDto): Promise<UserGuard> {
    const { user_id, ...rest } = createUserGuardDto;
    const userGuard = this.userGuardRepository.create({
      ...rest,
      user: { id: user_id } as any,
    });
    return this.userGuardRepository.save(userGuard);
  }

  async update(
    id: number,
    updateUserGuardDto: UpdateUserGuardDto,
  ): Promise<UserGuard> {
    const userGuard = await this.userGuardRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!userGuard) {
      throw new NotFoundException(`UserGuard with ID ${id} not found`);
    }

    const { user_id, ...rest } = updateUserGuardDto;
    Object.assign(userGuard, rest);
    if (user_id !== undefined) {
      userGuard.user = { id: user_id } as any;
    }
    return this.userGuardRepository.save(userGuard);
  }

  async remove(id: number): Promise<void> {
    const userGuard = await this.userGuardRepository.findOne({ where: { id } });

    if (!userGuard) {
      throw new NotFoundException(`UserGuard with ID ${id} not found`);
    }

    await this.userGuardRepository.remove(userGuard);
  }
}
