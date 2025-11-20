import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopItem } from './shop-item.entity';
import { CreateShopItemDto } from './dtos/create-shop-item.dto';
import { UpdateShopItemDto } from './dtos/update-shop-item.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { ItemTemplate } from '../item-template/item-template.entity';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';
import { ProductType } from '../item-template/enums/product-type.enum';
import { Currency } from '../../common/enums/currency.enum';
import { ShopItemStatus } from './enums/shop-item-status.enum';
import { Settings } from '../../config/setting.config';
import { SettingKey } from '../setting/setting-key.enum';
import { UserBoost } from '../user-boost/user-boost.entity';
import { UserBoostType } from '../user-boost/enums/user-boost-type.enum';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ShopItemService {
  constructor(
    @InjectRepository(ShopItem)
    private readonly shopItemRepository: Repository<ShopItem>,
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
  ): Promise<{ data: ShopItem[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.shopItemRepository.findAndCount({
      relations: ['item_template'],
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

  async findOne(id: number): Promise<ShopItem> {
    const shopItem = await this.shopItemRepository.findOne({
      where: { id },
      relations: ['item_template'],
    });

    if (!shopItem) {
      throw new NotFoundException(`ShopItem with ID ${id} not found`);
    }

    return shopItem;
  }

  private async saveShopItemImage(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const uploadDir = path.join(process.cwd(), 'data', 'shop-item-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `shop-item-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return path.join('data', 'shop-item-images', fileName).replace(/\\/g, '/');
  }

  private async deleteShopItemImage(imagePath: string): Promise<void> {
    if (imagePath && imagePath.startsWith('data/shop-item-images/')) {
      const fullPath = path.join(process.cwd(), imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  }

  async create(
    createShopItemDto: CreateShopItemDto,
    image: Express.Multer.File,
  ): Promise<ShopItem> {
    const itemTemplate = await this.itemTemplateRepository.findOne({
      where: { id: createShopItemDto.item_template_id },
    });

    if (!itemTemplate) {
      throw new NotFoundException(
        `ItemTemplate with ID ${createShopItemDto.item_template_id} not found`,
      );
    }

    const imagePath = await this.saveShopItemImage(image);
    const shopItem = this.shopItemRepository.create({
      name: createShopItemDto.name,
      currency: createShopItemDto.currency,
      price: createShopItemDto.price,
      status: createShopItemDto.status,
      image_path: imagePath,
      item_template_id: createShopItemDto.item_template_id,
      item_template: itemTemplate,
    });

    return this.shopItemRepository.save(shopItem);
  }

  async update(
    id: number,
    updateShopItemDto: UpdateShopItemDto,
    image?: Express.Multer.File,
  ): Promise<ShopItem> {
    const shopItem = await this.shopItemRepository.findOne({
      where: { id },
      relations: ['item_template'],
    });

    if (!shopItem) {
      throw new NotFoundException(`ShopItem with ID ${id} not found`);
    }

    if (image) {
      if (shopItem.image_path) {
        await this.deleteShopItemImage(shopItem.image_path);
      }
      const imagePath = await this.saveShopItemImage(image);
      updateShopItemDto = {
        ...updateShopItemDto,
        image_path: imagePath,
      } as UpdateShopItemDto;
    }

    if (updateShopItemDto.item_template_id) {
      const itemTemplate = await this.itemTemplateRepository.findOne({
        where: { id: updateShopItemDto.item_template_id },
      });

      if (!itemTemplate) {
        throw new NotFoundException(
          `ItemTemplate with ID ${updateShopItemDto.item_template_id} not found`,
        );
      }

      shopItem.item_template_id = updateShopItemDto.item_template_id;
      shopItem.item_template = itemTemplate;
    }

    Object.assign(shopItem, {
      name: updateShopItemDto.name,
      currency: updateShopItemDto.currency,
      price: updateShopItemDto.price,
      status: updateShopItemDto.status,
      image_path: updateShopItemDto.image_path,
    });

    return this.shopItemRepository.save(shopItem);
  }

  async remove(id: number): Promise<void> {
    const shopItem = await this.shopItemRepository.findOne({ where: { id } });

    if (!shopItem) {
      throw new NotFoundException(`ShopItem with ID ${id} not found`);
    }

    if (shopItem.image_path) {
      await this.deleteShopItemImage(shopItem.image_path);
    }

    await this.shopItemRepository.remove(shopItem);
  }

  async purchase(
    userId: number,
    accessoryId: number,
  ): Promise<{
    user: User;
    created_guard?: UserGuard;
    user_accessory?: UserAccessory;
    user_boost?: UserBoost;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const shopItem = await this.shopItemRepository.findOne({
      where: { id: accessoryId },
      relations: ['item_template'],
    });

    if (!shopItem) {
      throw new NotFoundException('ShopItem not found');
    }

    if (shopItem.status !== ShopItemStatus.IN_STOCK) {
      throw new BadRequestException('ShopItem is not available');
    }

    if (shopItem.currency === Currency.VIRTUAL) {
      if (Number(user.money) < shopItem.price) {
        throw new BadRequestException('Insufficient funds');
      }
      user.money = Number(user.money) - shopItem.price;
    } else {
      throw new BadRequestException('VOICES currency not implemented yet');
    }

    const product = shopItem.item_template;

    if (product.type === ProductType.GUARD) {
      const guardStrength = parseInt(product.value, 10);
      const guard = this.userGuardRepository.create({
        name: `Guard #${Date.now()}`,
        strength: guardStrength,
        is_first: false,
        user,
      });
      const createdGuard = await this.userGuardRepository.save(guard);
      await this.userRepository.save(user);
      return { user, created_guard: createdGuard };
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

      await this.userRepository.save(user);
      return { user, user_boost: createdBoost };
    } else if (
      product.type === ProductType.NICKNAME_COLOR ||
      product.type === ProductType.NICKNAME_ICON ||
      product.type === ProductType.AVATAR_FRAME
    ) {
      const userAccessory = this.userAccessoryRepository.create({
        name: shopItem.name,
        currency: shopItem.currency,
        price: shopItem.price,
        user,
        item_template: product,
        shop_item: shopItem,
      });
      const createdUserAccessory =
        await this.userAccessoryRepository.save(userAccessory);
      await this.userRepository.save(user);
      return { user, user_accessory: createdUserAccessory };
    } else {
      const userAccessory = this.userAccessoryRepository.create({
        name: shopItem.name,
        currency: shopItem.currency,
        price: shopItem.price,
        user,
        item_template: product,
        shop_item: shopItem,
      });
      const createdUserAccessory =
        await this.userAccessoryRepository.save(userAccessory);
      await this.userRepository.save(user);
      return { user, user_accessory: createdUserAccessory };
    }
  }
}
