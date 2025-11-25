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
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { KitPurchaseResponseDto } from './dtos/responses/kit-purchase-response.dto';
import { ItemTemplate } from '../item-template/item-template.entity';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';
import { ItemTemplateType } from '../item-template/enums/item-template-type.enum';
import { Currency } from '../../common/enums/currency.enum';
import { ShopItemStatus } from '../shop-item/enums/shop-item-status.enum';
import { Settings } from '../../config/setting.config';
import { SettingKey } from '../setting/enums/setting-key.enum';
import { UserBoost } from '../user-boost/user-boost.entity';
import { UserBoostType } from '../user-boost/enums/user-boost-type.enum';
import { UserBoostService } from '../user-boost/user-boost.service';

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
    private readonly userBoostService: UserBoostService,
  ) {}

  private generateAccessoryName(itemTemplate: ItemTemplate): string {
    const randomCode = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');

    switch (itemTemplate.type) {
      case ItemTemplateType.SHIELD:
        return itemTemplate.value
          ? `Щит ${itemTemplate.value}h`
          : `Щит #${randomCode}`;
      case ItemTemplateType.NICKNAME_COLOR:
        return itemTemplate.value
          ? `Цвет ника: ${itemTemplate.value}`
          : `Цвет ника: #${randomCode}`;
      case ItemTemplateType.NICKNAME_ICON:
        return itemTemplate.value
          ? `Иконка ника: ${itemTemplate.value}`
          : `Иконка ника: #${randomCode}`;
      case ItemTemplateType.AVATAR_FRAME:
        return itemTemplate.value
          ? `Рамка аватара: ${itemTemplate.value}`
          : `Рамка аватара: #${randomCode}`;
      default:
        return itemTemplate.value || itemTemplate.name || `#${randomCode}`;
    }
  }

  private generateGuardName(): string {
    const randomCode = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `Страж #${randomCode}`;
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Kit>> {
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

  async findAvailable(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Kit>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.kitRepository.findAndCount({
      where: { status: ShopItemStatus.IN_STOCK },
      relations: ['item_templates'],
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
  ): Promise<KitPurchaseResponseDto> {
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

    // Для виртуальной валюты списываем деньги с пользователя
    // Для голосов (VOICES) деньги уже списаны VK, просто выдаем товары
    if (kit.currency === Currency.VIRTUAL) {
      if (Number(user.money) < kit.price) {
        throw new BadRequestException('Insufficient funds');
      }
      user.money = Number(user.money) - kit.price;
    } else if (kit.currency === Currency.VOICES) {
      // Для голосов не списываем деньги - их уже списал VK
      // Просто выдаем товары
    } else {
      throw new BadRequestException(`Unsupported currency: ${kit.currency}`);
    }

    const createdGuards: UserGuard[] = [];
    const userAccessories: UserAccessory[] = [];
    const userBoosts: UserBoost[] = [];

    for (const itemTemplate of kit.item_templates) {
      if (itemTemplate.type === ItemTemplateType.GUARD) {
        if (!itemTemplate.value) {
          throw new BadRequestException(
            'ItemTemplate value is required for GUARD type',
          );
        }
        const guardStrength = parseInt(itemTemplate.value, 10);
        const guard = this.userGuardRepository.create({
          name: this.generateGuardName(),
          strength: guardStrength,
          is_first: false,
          user,
        });
        const createdGuard = await this.userGuardRepository.save(guard);
        createdGuards.push(createdGuard);
      } else if (itemTemplate.type === ItemTemplateType.SHIELD) {
        const userAccessory = this.userAccessoryRepository.create({
          name: this.generateAccessoryName(itemTemplate),
          user,
          item_template: itemTemplate,
        });
        const createdAccessory =
          await this.userAccessoryRepository.save(userAccessory);
        userAccessories.push(createdAccessory);
      } else if (
        itemTemplate.type === ItemTemplateType.REWARD_DOUBLING ||
        itemTemplate.type === ItemTemplateType.COOLDOWN_HALVING
      ) {
        const boostType =
          itemTemplate.type === ItemTemplateType.REWARD_DOUBLING
            ? UserBoostType.REWARD_DOUBLING
            : UserBoostType.COOLDOWN_HALVING;

        if (!itemTemplate.value) {
          throw new BadRequestException(
            'ItemTemplate value is required for REWARD_DOUBLING and COOLDOWN_HALVING types',
          );
        }
        const boostHours = parseInt(itemTemplate.value, 10);
        const now = new Date();

        const lastBoost = await this.userBoostService.findLastByUserIdAndType(
          user.id,
          boostType,
        );

        let boostEndTime: Date;
        let boostToAdd: UserBoost;

        if (lastBoost && lastBoost.end_time && lastBoost.end_time > now) {
          boostEndTime = new Date(
            lastBoost.end_time.getTime() + boostHours * 60 * 60 * 1000,
          );
          lastBoost.end_time = boostEndTime;
          boostToAdd = await this.userBoostRepository.save(lastBoost);
        } else {
          boostEndTime = new Date(now.getTime() + boostHours * 60 * 60 * 1000);
          const userBoost = this.userBoostRepository.create({
            type: boostType,
            end_time: boostEndTime,
            user,
          });
          boostToAdd = await this.userBoostRepository.save(userBoost);
        }

        if (!userBoosts.find((b) => b.id === boostToAdd.id)) {
          userBoosts.push(boostToAdd);
        }
      } else if (
        itemTemplate.type === ItemTemplateType.NICKNAME_COLOR ||
        itemTemplate.type === ItemTemplateType.NICKNAME_ICON ||
        itemTemplate.type === ItemTemplateType.AVATAR_FRAME
      ) {
        const userAccessory = this.userAccessoryRepository.create({
          name: this.generateAccessoryName(itemTemplate),
          user,
          item_template: itemTemplate,
        });
        const createdUserAccessory =
          await this.userAccessoryRepository.save(userAccessory);
        userAccessories.push(createdUserAccessory);
      } else {
        const userAccessory = this.userAccessoryRepository.create({
          name: this.generateAccessoryName(itemTemplate),
          user,
          item_template: itemTemplate,
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
