import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserGuard } from './user-guard.entity';
import { UserGuardAdminResponseDto } from './dtos/responses/user-guard-admin-response.dto';
import { CreateUserGuardDto } from './dtos/create-user-guard.dto';
import { UpdateUserGuardDto } from './dtos/update-user-guard.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { Settings } from '../../config/setting.config';
import { SettingKey } from '../setting/enums/setting-key.enum';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class UserGuardService {
  constructor(
    @InjectRepository(UserGuard)
    private readonly userGuardRepository: Repository<UserGuard>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<UserGuardAdminResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userGuardRepository
      .createQueryBuilder('guard')
      .select([
        'guard.id',
        'guard.name',
        'guard.strength',
        'guard.is_first',
        'guard.user_id',
      ])
      .orderBy('guard.id', 'DESC')
      .skip(skip)
      .take(limit);

    const [userGuards, total] = await queryBuilder.getManyAndCount();

    return {
      data: userGuards.map((guard) => ({
        id: guard.id,
        name: guard.name,
        strength: guard.strength,
        is_first: guard.is_first,
        user_id: guard.user_id,
      })),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<UserGuardAdminResponseDto> {
    const userGuard = await this.userGuardRepository
      .createQueryBuilder('guard')
      .select([
        'guard.id',
        'guard.name',
        'guard.strength',
        'guard.is_first',
        'guard.user_id',
      ])
      .where('guard.id = :id', { id })
      .getOne();

    if (!userGuard) {
      throw new NotFoundException(`Страж с ID ${id} не найден`);
    }

    return {
      id: userGuard.id,
      name: userGuard.name,
      strength: userGuard.strength,
      is_first: userGuard.is_first,
      user_id: userGuard.user_id,
    };
  }

  async create(
    createUserGuardDto: CreateUserGuardDto,
  ): Promise<UserGuardAdminResponseDto> {
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
    const savedUserGuard = await this.userGuardRepository.save(userGuard);
    await this.userService.updateUserGuardsStats(user_id);
    return {
      id: savedUserGuard.id,
      name: savedUserGuard.name,
      strength: savedUserGuard.strength,
      is_first: savedUserGuard.is_first,
      user_id: savedUserGuard.user_id,
    };
  }

  async update(
    id: number,
    updateUserGuardDto: UpdateUserGuardDto,
  ): Promise<UserGuardAdminResponseDto> {
    const userGuard = await this.userGuardRepository.findOne({
      where: { id },
    });

    if (!userGuard) {
      throw new NotFoundException(`Страж с ID ${id} не найден`);
    }

    const { user_id, ...rest } = updateUserGuardDto;

    if (user_id !== undefined && user_id !== userGuard.user_id) {
      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });

      if (!user) {
        throw new NotFoundException(`Пользователь с ID ${user_id} не найден`);
      }

      userGuard.user_id = user_id;
    }

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
    const savedUserGuard = await this.userGuardRepository.save(userGuard);
    await this.userService.updateUserGuardsStats(userGuard.user_id);
    if (user_id !== undefined && user_id !== userGuard.user_id) {
      await this.userService.updateUserGuardsStats(user_id);
    }
    return {
      id: savedUserGuard.id,
      name: savedUserGuard.name,
      strength: savedUserGuard.strength,
      is_first: savedUserGuard.is_first,
      user_id: savedUserGuard.user_id,
    };
  }

  async remove(id: number): Promise<void> {
    const userGuard = await this.userGuardRepository.findOne({ where: { id } });

    if (!userGuard) {
      throw new NotFoundException(`Страж с ID ${id} не найден`);
    }

    const userId = userGuard.user_id;
    await this.userGuardRepository.remove(userGuard);
    await this.userService.updateUserGuardsStats(userId);
  }
}
