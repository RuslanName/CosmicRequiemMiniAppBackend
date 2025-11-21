import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccessory } from './user-accessory.entity';
import { UserAccessoryStatus } from './enums/user-accessory-status.enum';
import { ProductType } from '../item-template/enums/product-type.enum';

@Injectable()
export class UserAccessoryService {
  constructor(
    @InjectRepository(UserAccessory)
    private readonly userAccessoryRepository: Repository<UserAccessory>,
  ) {}

  async findByUserId(userId: number): Promise<UserAccessory[]> {
    return this.userAccessoryRepository.find({
      where: { user: { id: userId } },
      relations: ['item_template', 'shop_item'],
      order: { created_at: 'DESC' },
    });
  }

  async findEquippedByUserId(userId: number): Promise<UserAccessory[]> {
    return this.userAccessoryRepository.find({
      where: {
        user: { id: userId },
        status: UserAccessoryStatus.EQUIPPED,
      },
      relations: ['item_template', 'shop_item'],
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
      itemTemplateType !== ProductType.NICKNAME_COLOR &&
      itemTemplateType !== ProductType.NICKNAME_ICON &&
      itemTemplateType !== ProductType.AVATAR_FRAME
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
}
