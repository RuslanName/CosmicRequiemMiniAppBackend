import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { User } from '../user/user.entity';
import { ShopItem } from '../shop-item/shop-item.entity';
import { Kit } from '../kit/kit.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';
import { UserBoost } from '../user-boost/user-boost.entity';
import { ItemTemplateType } from '../item-template/enums/item-template-type.enum';
import { UserBoostType } from '../user-boost/enums/user-boost-type.enum';
import { ShopItemStatus } from '../shop-item/enums/shop-item-status.enum';
import { Currency } from '../../common/enums/currency.enum';
import { VKNotificationDto } from './dtos/vk-notification.dto';
import { ENV } from '../../config/constants';
import { KitService } from '../kit/kit.service';
import { UserBoostService } from '../user-boost/user-boost.service';

@Injectable()
export class VKPaymentsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ShopItem)
    private readonly shopItemRepository: Repository<ShopItem>,
    @InjectRepository(Kit)
    private readonly kitRepository: Repository<Kit>,
    @InjectRepository(UserGuard)
    private readonly userGuardRepository: Repository<UserGuard>,
    @InjectRepository(UserAccessory)
    private readonly userAccessoryRepository: Repository<UserAccessory>,
    @InjectRepository(UserBoost)
    private readonly userBoostRepository: Repository<UserBoost>,
    private readonly kitService: KitService,
    private readonly userBoostService: UserBoostService,
  ) {}

  async handleNotification(
    notification: VKNotificationDto,
    originalQuery?: any,
  ): Promise<any> {
    if (!this.verifySignature(notification, originalQuery)) {
      throw new UnauthorizedException('Invalid VK signature');
    }

    switch (notification.notification_type) {
      case 'get_item':
      case 'get_item_test':
        return this.handleGetItem(notification);
      case 'order_status_change':
        return this.handleOrderStatusChange(notification);
      default:
        throw new BadRequestException(
          `Unknown notification type: ${notification.notification_type}`,
        );
    }
  }

  private async handleGetItem(notification: VKNotificationDto): Promise<any> {
    if (!notification.item_id) {
      throw new BadRequestException('item_id is required for get_item');
    }

    const shopItemId = this.extractShopItemId(notification.item_id);
    const kitId = this.extractKitId(notification.item_id);

    if (shopItemId) {
      const shopItem = await this.shopItemRepository.findOne({
        where: { id: shopItemId },
        relations: ['item_template'],
      });

      if (!shopItem) {
        throw new NotFoundException('ShopItem not found');
      }

      if (shopItem.currency !== Currency.VOICES) {
        throw new BadRequestException(
          'Item is not available for voices purchase',
        );
      }

      if (shopItem.status !== ShopItemStatus.IN_STOCK) {
        throw new BadRequestException('ShopItem is not available');
      }

      const baseUrl = ENV.VK_APP_URL.replace(/\/$/, '');
      const imagePath = shopItem.item_template?.image_path;
      const imageUrl = imagePath
        ? imagePath.startsWith('http')
          ? imagePath
          : `${baseUrl}/${imagePath.replace(/^\//, '')}`
        : undefined;

      return {
        response: {
          title: shopItem.name,
          photo_url: imageUrl,
          price: shopItem.price,
          item_id: notification.item_id,
        },
      };
    } else if (kitId) {
      const kit = await this.kitRepository.findOne({
        where: { id: kitId },
        relations: ['item_templates'],
      });

      if (!kit) {
        throw new NotFoundException('Kit not found');
      }

      if (kit.currency !== Currency.VOICES) {
        throw new BadRequestException(
          'Kit is not available for voices purchase',
        );
      }

      if (kit.status !== ShopItemStatus.IN_STOCK) {
        throw new BadRequestException('Kit is not available');
      }

      return {
        response: {
          title: kit.name,
          photo_url: undefined,
          price: kit.price,
          item_id: notification.item_id,
        },
      };
    }

    throw new BadRequestException('Invalid item_id format');
  }

  private async handleOrderStatusChange(
    notification: VKNotificationDto,
  ): Promise<any> {
    if (!notification.order_id || !notification.item_id) {
      throw new BadRequestException(
        'order_id and item_id are required for order_status_change',
      );
    }

    if (notification.status === 'chargeable') {
      return this.processPurchase(notification);
    } else if (notification.status === 'refunded') {
      return this.processRefund(notification);
    }

    return {
      response: {
        order_id: notification.order_id,
      },
    };
  }

  private async processPurchase(notification: VKNotificationDto): Promise<any> {
    const shopItemId = this.extractShopItemId(notification.item_id!);
    const kitId = this.extractKitId(notification.item_id!);

    const user = await this.userRepository.findOne({
      where: { vk_id: notification.user_id! },
      relations: ['guards'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (kitId) {
      const kit = await this.kitRepository.findOne({
        where: { id: kitId },
        relations: ['item_templates'],
      });

      if (!kit) {
        throw new NotFoundException('Kit not found');
      }

      if (kit.currency !== Currency.VOICES) {
        throw new BadRequestException(
          'Kit is not available for voices purchase',
        );
      }

      if (kit.status !== ShopItemStatus.IN_STOCK) {
        throw new BadRequestException('Kit is not available');
      }

      await this.kitService.purchase(user.id, kitId);

      return {
        response: {
          order_id: notification.order_id,
        },
      };
    }

    if (!shopItemId) {
      throw new BadRequestException('Invalid item_id format');
    }

    const shopItem = await this.shopItemRepository.findOne({
      where: { id: shopItemId },
      relations: ['item_template'],
    });

    if (!shopItem) {
      throw new NotFoundException('ShopItem not found');
    }

    if (shopItem.currency !== Currency.VOICES) {
      throw new BadRequestException(
        'Item is not available for voices purchase',
      );
    }

    if (shopItem.status !== ShopItemStatus.IN_STOCK) {
      throw new BadRequestException('ShopItem is not available');
    }

    const itemTemplate = shopItem.item_template;

    if (itemTemplate.type === ItemTemplateType.GUARD) {
      if (!itemTemplate.value) {
        throw new BadRequestException(
          'ItemTemplate value is required for GUARD type',
        );
      }
      const guardStrength = parseInt(itemTemplate.value, 10);
      const guard = this.userGuardRepository.create({
        name: `Guard #${Date.now()}`,
        strength: guardStrength,
        is_first: false,
        user,
      });
      await this.userGuardRepository.save(guard);
      return {
        response: {
          order_id: notification.order_id,
        },
      };
    } else if (itemTemplate.type === ItemTemplateType.SHIELD) {
      const userAccessory = this.userAccessoryRepository.create({
        name: shopItem.name,
        user,
        item_template: itemTemplate,
      });
      await this.userAccessoryRepository.save(userAccessory);
      return {
        response: {
          order_id: notification.order_id,
        },
      };
    } else if (
      itemTemplate.type === ItemTemplateType.NICKNAME_COLOR ||
      itemTemplate.type === ItemTemplateType.NICKNAME_ICON ||
      itemTemplate.type === ItemTemplateType.AVATAR_FRAME
    ) {
      const userAccessory = this.userAccessoryRepository.create({
        name: shopItem.name,
        user,
        item_template: itemTemplate,
      });
      await this.userAccessoryRepository.save(userAccessory);
      return {
        response: {
          order_id: notification.order_id,
        },
      };
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
      if (lastBoost && lastBoost.end_time && lastBoost.end_time > now) {
        boostEndTime = new Date(
          lastBoost.end_time.getTime() + boostHours * 60 * 60 * 1000,
        );
        lastBoost.end_time = boostEndTime;
        await this.userBoostRepository.save(lastBoost);
      } else {
        boostEndTime = new Date(now.getTime() + boostHours * 60 * 60 * 1000);
        const userBoost = this.userBoostRepository.create({
          type: boostType,
          end_time: boostEndTime,
          user,
        });
        await this.userBoostRepository.save(userBoost);
      }

      return {
        response: {
          order_id: notification.order_id,
        },
      };
    }

    throw new BadRequestException('Unsupported item template type');
  }

  private async processRefund(notification: VKNotificationDto): Promise<any> {
    return {
      response: {
        order_id: notification.order_id,
      },
    };
  }

  private extractShopItemId(itemId: string): number | null {
    if (itemId.startsWith('shop_item_')) {
      const id = parseInt(itemId.replace('shop_item_', ''), 10);
      return isNaN(id) ? null : id;
    }
    return null;
  }

  private extractKitId(itemId: string): number | null {
    if (itemId.startsWith('kit_')) {
      const id = parseInt(itemId.replace('kit_', ''), 10);
      return isNaN(id) ? null : id;
    }
    return null;
  }

  private verifySignature(
    notification: VKNotificationDto,
    originalQuery?: any,
  ): boolean {
    const VK_APP_SECRET = ENV.VK_APP_SECRET;

    if (!VK_APP_SECRET) {
      throw new Error('VK_APP_SECRET is not set');
    }

    if (!notification.sig) {
      return false;
    }

    const params: Record<string, string> = {};

    if (originalQuery) {
      Object.keys(originalQuery).forEach((key) => {
        if (
          key !== 'sig' &&
          originalQuery[key] !== undefined &&
          originalQuery[key] !== null
        ) {
          params[key] = String(originalQuery[key]);
        }
      });
    } else {
      if (notification.app_id) {
        params.app_id = String(notification.app_id);
      }
      if (notification.notification_type) {
        params.notification_type = notification.notification_type;
      }
      if (notification.item_id) {
        params.item_id = notification.item_id;
      }
      if (notification.order_id) {
        params.order_id = String(notification.order_id);
      }
      if (notification.status) {
        params.status = notification.status;
      }
      if (notification.user_id) {
        params.user_id = String(notification.user_id);
      }
      if (notification.item_price) {
        params.item_price = String(notification.item_price);
      }
    }

    const queryString = Object.keys(params)
      .filter((key) => params[key] && key !== 'sig')
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const computedHash = createHmac('sha256', VK_APP_SECRET)
      .update(queryString)
      .digest('base64url');

    return computedHash === notification.sig;
  }
}
