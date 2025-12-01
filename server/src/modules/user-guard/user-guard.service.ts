import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserGuard } from './user-guard.entity';
import { CreateUserGuardDto } from './dtos/create-user-guard.dto';
import { UpdateUserGuardDto } from './dtos/update-user-guard.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { Settings } from '../../config/setting.config';
import { SettingKey } from '../setting/enums/setting-key.enum';

@Injectable()
export class UserGuardService {
  constructor(
    @InjectRepository(UserGuard)
    private readonly userGuardRepository: Repository<UserGuard>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<UserGuard>> {
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
      throw new NotFoundException(`Страж с ID ${id} не найден`);
    }

    return userGuard;
  }

  async create(createUserGuardDto: CreateUserGuardDto): Promise<UserGuard> {
    const { user_id, ...rest } = createUserGuardDto;

    if (rest.is_first && rest.strength !== undefined) {
      const maxStrengthFirstGuard = Settings[
        SettingKey.MAX_STRENGTH_FIRST_USER_GUARD
      ] as number;
      if (rest.strength > maxStrengthFirstGuard) {
        throw new BadRequestException(
          `Сила первого стража не может превышать ${maxStrengthFirstGuard}`,
        );
      }
    }

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
      throw new NotFoundException(`Страж с ID ${id} не найден`);
    }

    const { user_id, ...rest } = updateUserGuardDto;

    const isFirst =
      rest.is_first !== undefined ? rest.is_first : userGuard.is_first;
    const newStrength =
      rest.strength !== undefined ? rest.strength : userGuard.strength;

    if (isFirst && newStrength !== undefined) {
      const maxStrengthFirstGuard = Settings[
        SettingKey.MAX_STRENGTH_FIRST_USER_GUARD
      ] as number;
      if (newStrength > maxStrengthFirstGuard) {
        throw new BadRequestException(
          `Сила первого стража не может превышать ${maxStrengthFirstGuard}`,
        );
      }
    }

    Object.assign(userGuard, rest);
    if (user_id !== undefined) {
      userGuard.user_id = user_id;
    }
    return this.userGuardRepository.save(userGuard);
  }

  async remove(id: number): Promise<void> {
    const userGuard = await this.userGuardRepository.findOne({ where: { id } });

    if (!userGuard) {
      throw new NotFoundException(`Страж с ID ${id} не найден`);
    }

    await this.userGuardRepository.remove(userGuard);
  }
}
