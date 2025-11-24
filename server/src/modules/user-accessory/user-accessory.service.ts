import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccessory } from './user-accessory.entity';
import { UserAccessoryStatus } from './enums/user-accessory-status.enum';
import { ItemTemplateType } from '../item-template/enums/item-template-type.enum';
import { UserBoost } from '../user-boost/user-boost.entity';
import { UserBoostType } from '../user-boost/enums/user-boost-type.enum';
import { User } from '../user/user.entity';

@Injectable()
export class UserAccessoryService {
  constructor(
    @InjectRepository(UserAccessory)
    private readonly userAccessoryRepository: Repository<UserAccessory>,
    @InjectRepository(UserBoost)
    private readonly userBoostRepository: Repository<UserBoost>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByUserId(userId: number): Promise<UserAccessory[]> {
    return this.userAccessoryRepository.find({
      where: { user: { id: userId } },
      relations: ['item_template'],
      order: { created_at: 'DESC' },
    });
  }

  async findEquippedByUserId(userId: number): Promise<UserAccessory[]> {
    return this.userAccessoryRepository.find({
      where: {
        user: { id: userId },
        status: UserAccessoryStatus.EQUIPPED,
      },
      relations: ['item_template'],
    });
  }

  async equip(userId: number, accessoryId: number): Promise<UserAccessory> {
    const accessory = await this.userAccessoryRepository.findOne({
      where: { id: accessoryId },
      relations: ['user', 'item_template'],
    });

    if (!accessory) {
      throw new NotFoundException('Accessory not found');
    }

    if (accessory.user.id !== userId) {
      throw new BadRequestException('Accessory does not belong to this user');
    }

    const itemTemplateType = accessory.item_template.type;

    if (
      itemTemplateType !== ItemTemplateType.NICKNAME_COLOR &&
      itemTemplateType !== ItemTemplateType.NICKNAME_ICON &&
      itemTemplateType !== ItemTemplateType.AVATAR_FRAME
    ) {
      throw new BadRequestException('This accessory type cannot be equipped');
    }

    const equippedOfSameType = await this.userAccessoryRepository.findOne({
      where: {
        user: { id: userId },
        item_template: { type: itemTemplateType },
        status: UserAccessoryStatus.EQUIPPED,
      },
    });

    if (equippedOfSameType && equippedOfSameType.id !== accessoryId) {
      equippedOfSameType.status = UserAccessoryStatus.UNEQUIPPED;
      await this.userAccessoryRepository.save(equippedOfSameType);
    }

    accessory.status = UserAccessoryStatus.EQUIPPED;
    return this.userAccessoryRepository.save(accessory);
  }

  async unequip(userId: number, accessoryId: number): Promise<UserAccessory> {
    const accessory = await this.userAccessoryRepository.findOne({
      where: { id: accessoryId },
      relations: ['user'],
    });

    if (!accessory) {
      throw new NotFoundException('Accessory not found');
    }

    if (accessory.user.id !== userId) {
      throw new BadRequestException('Accessory does not belong to this user');
    }

    if (accessory.status === UserAccessoryStatus.UNEQUIPPED) {
      throw new BadRequestException('Accessory is already unequipped');
    }

    accessory.status = UserAccessoryStatus.UNEQUIPPED;
    return this.userAccessoryRepository.save(accessory);
  }

  async activateShield(
    userId: number,
    accessoryId: number,
  ): Promise<{ user: User; user_boost: UserBoost }> {
    const accessory = await this.userAccessoryRepository.findOne({
      where: { id: accessoryId },
      relations: ['user', 'item_template'],
    });

    if (!accessory) {
      throw new NotFoundException('Accessory not found');
    }

    if (accessory.user.id !== userId) {
      throw new BadRequestException('Accessory does not belong to this user');
    }

    if (accessory.item_template.type !== ItemTemplateType.SHIELD) {
      throw new BadRequestException('This accessory is not a shield');
    }

    const shieldHours = parseInt(accessory.item_template.value, 10);
    const now = new Date();

    const user = accessory.user;

    const shieldEndTime =
      user.shield_end_time && user.shield_end_time > now
        ? new Date(
            user.shield_end_time.getTime() + shieldHours * 60 * 60 * 1000,
          )
        : new Date(now.getTime() + shieldHours * 60 * 60 * 1000);

    user.shield_end_time = shieldEndTime;

    const userBoost = this.userBoostRepository.create({
      type: UserBoostType.SHIELD,
      end_time: shieldEndTime,
      user,
    });
    const createdBoost = await this.userBoostRepository.save(userBoost);

    await this.userAccessoryRepository.remove(accessory);
    await this.userRepository.save(user);

    return { user, user_boost: createdBoost };
  }
}
