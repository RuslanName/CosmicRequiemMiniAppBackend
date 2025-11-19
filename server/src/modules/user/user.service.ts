import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { Settings } from '../../config/setting.config';
import { SettingKey } from '../setting/setting-key.enum';
import { UserGuard } from '../user-guard/user-guard.entity';
import { ENV } from '../../config/constants';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserGuard)
    private readonly userGuardRepository: Repository<UserGuard>,
  ) {}

  private calculateUserPower(guards: UserGuard[]): number {
    if (!guards || guards.length === 0) return 0;
    return guards.reduce((sum, guard) => sum + Number(guard.strength), 0);
  }

  private getGuardsCount(guards: UserGuard[]): number {
    return guards ? guards.length : 0;
  }

  private transformUserForResponse(user: User): User & { referral_link?: string } {
    const transformed: any = { ...user };
    if (user.referral_link_id) {
      transformed.referral_link = `${ENV.VK_APP_URL}/?start=ref_${user.referral_link_id}`;
      delete transformed.referral_link_id;
    }
    return transformed;
  }

  async findAll(paginationDto: PaginationDto): Promise<{ data: (User & { strength: number; referral_link?: string })[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.userRepository.findAndCount({
      relations: ['clan', 'guards'],
      skip,
      take: limit,
    });

    const dataWithStrength = data.map(user => {
      const transformed = this.transformUserForResponse(user);
      return {
        ...transformed,
        strength: this.calculateUserPower(user.guards || []),
      };
    });

    return {
      data: dataWithStrength,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<User & { strength: number; referral_link?: string }> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['clan', 'guards'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const transformed = this.transformUserForResponse(user);
    return {
      ...transformed,
      strength: this.calculateUserPower(user.guards || []),
    };
  }

  async findMe(userId: number): Promise<User & { strength: number; referral_link?: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['clan', 'guards'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const transformed = this.transformUserForResponse(user);
    return {
      ...transformed,
      strength: this.calculateUserPower(user.guards || []),
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['clan', 'guards'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async training(userId: number): Promise<{ user: User; training_cost: number; power_increase: number; new_power: number }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guards'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const trainingCooldown = Settings[SettingKey.TRAINING_COOLDOWN];

    if (user.last_training_time) {
      const cooldownEndTime = new Date(user.last_training_time.getTime() + trainingCooldown);
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException('Training cooldown is still active');
      }
    }

    if (!user.guards || user.guards.length === 0) {
      throw new BadRequestException('User has no guards');
    }

    const current_power = this.calculateUserPower(user.guards);
    const guards_count = this.getGuardsCount(user.guards);

    const training_cost = Math.round(10 * Math.pow(1 + current_power, 1.2));

    const userMoney = Number(user.money);
    if (userMoney < training_cost) {
      throw new BadRequestException('Insufficient funds for training');
    }

    const base_power_increase = Math.max(
      3 + (guards_count * 0.5),
      current_power * 0.1
    );

    const random_bonus_chance = Math.min(3, guards_count * (current_power * 0.001));
    const random_value = Math.random() * 100;
    let random_bonus = 0;

    if (random_value < random_bonus_chance) {
      random_bonus = Math.round(guards_count * 0.2);
    }

    const total_power_increase = Math.round(base_power_increase + random_bonus);
    const powerIncreasePerGuard = Math.round(total_power_increase / guards_count);

    for (const guard of user.guards) {
      guard.strength = Number(guard.strength) + powerIncreasePerGuard;
      await this.userGuardRepository.save(guard);
    }

    user.money = Number(user.money) - training_cost;
    user.last_training_time = new Date();

    await this.userRepository.save(user);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guards'],
    });

    if (!updatedUser || !updatedUser.guards) {
      throw new NotFoundException('User or guards not found after training');
    }

    const new_power = this.calculateUserPower(updatedUser.guards);

    return {
      user: updatedUser,
      training_cost,
      power_increase: total_power_increase,
      new_power,
    };
  }

  async contract(userId: number): Promise<{ user: User; contract_income: number }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guards'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const contractCooldown = Settings[SettingKey.CONTRACT_COOLDOWN];

    if (user.last_contract_time) {
      const cooldownEndTime = new Date(user.last_contract_time.getTime() + contractCooldown);
      if (cooldownEndTime > new Date()) {
        throw new BadRequestException('Contract cooldown is still active');
      }
    }

    const current_power = this.calculateUserPower(user.guards || []);

    const training_cost = Math.round(10 * Math.pow(1 + current_power, 1.2));

    const contract_income = Math.max(Math.round(training_cost * 0.55), 6);

    user.money = Number(user.money) + contract_income;
    user.last_contract_time = new Date();

    await this.userRepository.save(user);

    return {
      user,
      contract_income,
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
}
