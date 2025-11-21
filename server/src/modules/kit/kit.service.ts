import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Kit } from './kit.entity';
import { CreateKitDto } from './dtos/create-kit.dto';
import { UpdateKitDto } from './dtos/update-kit.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { ItemTemplate } from '../item-template/item-template.entity';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';
import { ProductType } from '../item-template/enums/product-type.enum';
import { Currency } from '../../common/enums/currency.enum';
import { ShopItemStatus } from '../shop-item/enums/shop-item-status.enum';
import { Settings } from '../../config/setting.config';
import { SettingKey } from '../setting/setting-key.enum';
import { UserBoost } from '../user-boost/user-boost.entity';
import { UserBoostType } from '../user-boost/enums/user-boost-type.enum';

@Injectable()
export class KitService {
  constructor(
    @InjectRepository(Kit)
    private readonly kitRepository: Repository<Kit>,
    @InjectRepository(ItemTemplate)
    private readonly itemTemplateRepository: Repository<ItemTemplate>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserGuard)
    private readonly userGuardRepository: Repository<UserGuard>,
    @InjectRepository(UserAccessory)
    private readonly userAccessoryRepository: Repository<UserAccessory>,
    @InjectRepository(UserBoost)
    private readonly userBoostRepository: Repository<UserBoost>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ data: Kit[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.kitRepository.findAndCount({
      relations: ['item_templates'],
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

  async findOne(id: number): Promise<Kit> {
    const kit = await this.kitRepository.findOne({
      where: { id },
      relations: ['item_templates'],
    });

    if (!kit) {
      throw new NotFoundException(`Kit with ID ${id} not found`);
    }

    return kit;
  }

  async create(createKitDto: CreateKitDto): Promise<Kit> {
    const itemTemplates = await this.itemTemplateRepository.find({
      where: { id: In(createKitDto.item_template_ids) },
    });

    if (itemTemplates.length !== createKitDto.item_template_ids.length) {
      throw new NotFoundException('Some item templates not found');
    }

    const kit = this.kitRepository.create({
      name: createKitDto.name,
      currency: createKitDto.currency,
      price: createKitDto.price,
      status: createKitDto.status,
      item_templates: itemTemplates,
    });

    return this.kitRepository.save(kit);
  }

  async update(id: number, updateKitDto: UpdateKitDto): Promise<Kit> {
    const kit = await this.kitRepository.findOne({
      where: { id },
      relations: ['item_templates'],
    });

    if (!kit) {
      throw new NotFoundException(`Kit with ID ${id} not found`);
    }

    if (updateKitDto.item_template_ids) {
      const itemTemplates = await this.itemTemplateRepository.find({
        where: { id: In(updateKitDto.item_template_ids) },
      });

      if (itemTemplates.length !== updateKitDto.item_template_ids.length) {
        throw new NotFoundException('Some item templates not found');
      }

      kit.item_templates = itemTemplates;
    }

    Object.assign(kit, {
      name: updateKitDto.name,
      currency: updateKitDto.currency,
      price: updateKitDto.price,
      status: updateKitDto.status,
    });

    return this.kitRepository.save(kit);
  }

  async remove(id: number): Promise<void> {
    const kit = await this.kitRepository.findOne({ where: { id } });

    if (!kit) {
      throw new NotFoundException(`Kit with ID ${id} not found`);
    }

    await this.kitRepository.remove(kit);
  }

  async purchase(
    userId: number,
    kitId: number,
  ): Promise<{
    user: User;
    created_guards: UserGuard[];
    user_accessories: UserAccessory[];
    user_boosts: UserBoost[];
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const kit = await this.kitRepository.findOne({
      where: { id: kitId },
      relations: ['item_templates'],
    });

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    if (kit.status !== ShopItemStatus.IN_STOCK) {
      throw new BadRequestException('Kit is not available');
    }

    if (kit.currency === Currency.VIRTUAL) {
      if (Number(user.money) < kit.price) {
        throw new BadRequestException('Insufficient funds');
      }
      user.money = Number(user.money) - kit.price;
    } else {
      throw new BadRequestException('VOICES currency not implemented yet');
    }

    const createdGuards: UserGuard[] = [];
    const userAccessories: UserAccessory[] = [];
    const userBoosts: UserBoost[] = [];

    for (const product of kit.item_templates) {
      if (product.type === ProductType.GUARD) {
        const guardStrength = parseInt(product.value, 10);
        const guard = this.userGuardRepository.create({
          name: `Guard #${Date.now()}`,
          strength: guardStrength,
          is_first: false,
          user,
        });
        const createdGuard = await this.userGuardRepository.save(guard);
        createdGuards.push(createdGuard);
      } else if (product.type === ProductType.SHIELD) {
        const purchaseShieldCooldown =
          Settings[SettingKey.PURCHASE_SHIELD_COOLDOWN];
        if (user.last_shield_purchase_time) {
          const cooldownEndTime = new Date(
            user.last_shield_purchase_time.getTime() + purchaseShieldCooldown,
          );
          if (cooldownEndTime > new Date()) {
            throw new BadRequestException(
              'Shield purchase cooldown is still active',
            );
          }
        }

        const shieldHours = parseInt(product.value, 10);
        const now = new Date();
        const shieldEndTime =
          user.shield_end_time && user.shield_end_time > now
            ? new Date(
                user.shield_end_time.getTime() + shieldHours * 60 * 60 * 1000,
              )
            : new Date(now.getTime() + shieldHours * 60 * 60 * 1000);

        user.shield_end_time = shieldEndTime;
        user.last_shield_purchase_time = now;

        const userBoost = this.userBoostRepository.create({
          type: UserBoostType.SHIELD,
          user,
        });
        const createdBoost = await this.userBoostRepository.save(userBoost);
        userBoosts.push(createdBoost);
      } else if (
        product.type === ProductType.NICKNAME_COLOR ||
        product.type === ProductType.NICKNAME_ICON ||
        product.type === ProductType.AVATAR_FRAME
      ) {
        const userAccessory = this.userAccessoryRepository.create({
          name: kit.name,
          currency: kit.currency,
          price: kit.price,
          user,
          item_template: product,
        });
        const createdUserAccessory =
          await this.userAccessoryRepository.save(userAccessory);
        userAccessories.push(createdUserAccessory);
      } else {
        const userAccessory = this.userAccessoryRepository.create({
          name: kit.name,
          currency: kit.currency,
          price: kit.price,
          user,
          item_template: product,
        });
        const createdUserAccessory =
          await this.userAccessoryRepository.save(userAccessory);
        userAccessories.push(createdUserAccessory);
      }
    }

    await this.userRepository.save(user);
    return {
      user,
      created_guards: createdGuards,
      user_accessories: userAccessories,
      user_boosts: userBoosts,
    };
  }
}
