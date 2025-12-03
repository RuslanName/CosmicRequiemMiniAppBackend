import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopItem } from './shop-item.entity';
import { ShopItemResponseDto } from './dtos/responses/shop-item-response.dto';
import { CreateShopItemDto } from './dtos/create-shop-item.dto';
import { UpdateShopItemDto } from './dtos/update-shop-item.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import {
  ShopItemsListResponseDto,
  ShopItemWithoutTemplate,
  ShopItemsCategoryResponseDto,
} from './dtos/responses/shop-items-list-response.dto';
import { ShopItemPurchaseResponseDto } from './dtos/responses/shop-item-purchase-response.dto';
import { ItemTemplate } from '../item-template/item-template.entity';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';
import { ItemTemplateType } from '../item-template/enums/item-template-type.enum';
import { Currency } from '../../common/enums/currency.enum';
import { ShopItemStatus } from './enums/shop-item-status.enum';
import { Settings } from '../../config/setting.config';
import { SettingKey } from '../setting/enums/setting-key.enum';
import { UserBoost } from '../user-boost/user-boost.entity';
import { UserBoostType } from '../user-boost/enums/user-boost-type.enum';
import { UserBoostService } from '../user-boost/user-boost.service';
import { generateRandom8DigitCode } from '../../common/utils/number-format.util';
import { UserService } from '../user/user.service';
import { UserAccessoryService } from '../user-accessory/user-accessory.service';
import { CurrentUserResponseDto } from '../user/dtos/responses/user-me-response.dto';
import { UserGuardResponseDto } from '../user-guard/dtos/responses/user-guard-response.dto';
import { UserAccessoryResponseDto } from '../user-accessory/dtos/responses/user-accessory-response.dto';
import { UserBoostResponseDto } from '../user-boost/dtos/responses/user-boost-response.dto';
import { ItemTemplateResponseDto } from '../item-template/dtos/responses/item-template-response.dto';

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
    private readonly userBoostService: UserBoostService,
    private readonly userService: UserService,
    private readonly userAccessoryService: UserAccessoryService,
  ) {}

  private transformUserGuardToResponseDto(
    guard: UserGuard,
  ): UserGuardResponseDto {
    return {
      id: guard.id,
      name: guard.name,
      strength: guard.strength,
      is_first: guard.is_first,
      guard_as_user: null,
    };
  }

  private transformUserBoostToResponseDto(
    boost: UserBoost,
  ): UserBoostResponseDto {
    return {
      id: boost.id,
      type: boost.type,
      end_time: boost.end_time || null,
      created_at: boost.created_at,
    };
  }

  private transformUserAccessoryToResponseDto(
    accessory: UserAccessory,
  ): UserAccessoryResponseDto {
    if (!accessory.item_template) {
      throw new NotFoundException('Item template не загружен для аксессуара');
    }
    return {
      id: accessory.id,
      name: accessory.item_template.name || '',
      status: accessory.status,
      type: accessory.item_template.type || '',
      value: accessory.item_template.value || null,
      image_path: accessory.item_template.image_path || null,
      created_at: accessory.created_at,
    };
  }

  private async generateUniqueGuardName(): Promise<string> {
    let name: string;
    let exists: boolean;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      const randomCode = generateRandom8DigitCode();
      name = `#${randomCode}`;
      exists = !!(await this.userGuardRepository.findOne({
        where: { name },
      }));
      attempts++;
    } while (exists && attempts < maxAttempts);

    if (exists) {
      throw new BadRequestException(
        'Не удалось сгенерировать уникальное имя стража',
      );
    }

    return name;
  }

  private transformItemTemplateToResponseDto(
    itemTemplate: ItemTemplate,
  ): ItemTemplateResponseDto {
    return {
      id: itemTemplate.id,
      name: itemTemplate.name,
      type: itemTemplate.type,
      value: itemTemplate.value,
      image_path: itemTemplate.image_path,
      quantity: itemTemplate.quantity,
      name_in_kit: itemTemplate.name_in_kit,
      created_at: itemTemplate.created_at,
      updated_at: itemTemplate.updated_at,
    };
  }

  private transformToShopItemResponseDto(shopItem: ShopItem): ShopItemResponseDto {
    return {
      id: shopItem.id,
      name: shopItem.name,
      currency: shopItem.currency,
      price: shopItem.price,
      status: shopItem.status,
      item_template_id: shopItem.item_template_id,
      item_template: shopItem.item_template
        ? this.transformItemTemplateToResponseDto(shopItem.item_template)
        : undefined,
      created_at: shopItem.created_at,
      updated_at: shopItem.updated_at,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ShopItemResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.shopItemRepository.findAndCount({
      relations: ['item_template'],
      skip,
      take: limit,
    });

    return {
      data: data.map((item) => this.transformToShopItemResponseDto(item)),
      total,
      page,
      limit,
    };
  }

  async findAvailable(queryParams?: any): Promise<ShopItemsListResponseDto> {
    const shopItems = await this.shopItemRepository.find({
      where: { status: ShopItemStatus.IN_STOCK },
      relations: ['item_template'],
      order: { created_at: 'DESC' },
    });

    const categoriesData: Record<string, ShopItemWithoutTemplate[]> = {};

    for (const item of shopItems) {
      const category = item.item_template?.type || 'other';

      if (!categoriesData[category]) {
        categoriesData[category] = [];
      }

      categoriesData[category].push({
        id: item.id,
        name: item.item_template?.name || item.name,
        description: item.item_template?.name || '',
        price: item.price,
        currency: item.currency,
        image_path: item.item_template?.image_path || '',
        value: item.item_template?.value || null,
        quantity: item.item_template?.quantity || null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      });
    }

    const defaultPage = queryParams?.page ? Number(queryParams.page) : 1;
    const defaultLimit = queryParams?.limit ? Number(queryParams.limit) : 10;

    const categories: Record<string, ShopItemsCategoryResponseDto> = {};

    for (const [categoryName, items] of Object.entries(categoriesData)) {
      const categoryPageParam = queryParams?.[`${categoryName}_page`];
      const categoryLimitParam = queryParams?.[`${categoryName}_limit`];

      const page = categoryPageParam ? Number(categoryPageParam) : defaultPage;
      const limit = categoryLimitParam
        ? Number(categoryLimitParam)
        : defaultLimit;

      const total = items.length;
      const skip = (page - 1) * limit;
      const paginatedItems = items.slice(skip, skip + limit);

      categories[categoryName] = {
        data: paginatedItems,
        total,
        page,
        limit,
      };
    }

    return { categories };
  }

  async findOne(id: number): Promise<ShopItemResponseDto> {
    const shopItem = await this.shopItemRepository.findOne({
      where: { id },
      relations: ['item_template'],
    });

    if (!shopItem) {
      throw new NotFoundException(`Товар магазина с ID ${id} не найден`);
    }

    return this.transformToShopItemResponseDto(shopItem);
  }

  async create(createShopItemDto: CreateShopItemDto): Promise<ShopItemResponseDto> {
    const itemTemplate = await this.itemTemplateRepository.findOne({
      where: { id: createShopItemDto.item_template_id },
    });

    if (!itemTemplate) {
      throw new NotFoundException(
        `Шаблон предмета с ID ${createShopItemDto.item_template_id} не найден`,
      );
    }

    const shopItem = this.shopItemRepository.create({
      name: createShopItemDto.name,
      currency: createShopItemDto.currency,
      price: createShopItemDto.price,
      status: createShopItemDto.status,
      item_template_id: createShopItemDto.item_template_id,
      item_template: itemTemplate,
    });

    const savedShopItem = await this.shopItemRepository.save(shopItem);
    const shopItemWithRelations = await this.shopItemRepository.findOne({
      where: { id: savedShopItem.id },
      relations: ['item_template'],
    });
    return this.transformToShopItemResponseDto(shopItemWithRelations!);
  }

  async update(
    id: number,
    updateShopItemDto: UpdateShopItemDto,
  ): Promise<ShopItemResponseDto> {
    const shopItem = await this.shopItemRepository.findOne({
      where: { id },
      relations: ['item_template'],
    });

    if (!shopItem) {
      throw new NotFoundException(`Товар магазина с ID ${id} не найден`);
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
    });

    const savedShopItem = await this.shopItemRepository.save(shopItem);
    const shopItemWithRelations = await this.shopItemRepository.findOne({
      where: { id: savedShopItem.id },
      relations: ['item_template'],
    });
    return this.transformToShopItemResponseDto(shopItemWithRelations!);
  }

  async remove(id: number): Promise<void> {
    const shopItem = await this.shopItemRepository.findOne({ where: { id } });

    if (!shopItem) {
      throw new NotFoundException(`Товар магазина с ID ${id} не найден`);
    }

    await this.shopItemRepository.remove(shopItem);
  }

  async purchase(
    userId: number,
    accessoryId: number,
  ): Promise<ShopItemPurchaseResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const shopItem = await this.shopItemRepository.findOne({
      where: { id: accessoryId },
      relations: ['item_template'],
    });

    if (!shopItem) {
      throw new NotFoundException('Товар магазина не найден');
    }

    if (shopItem.currency !== Currency.VIRTUAL) {
      throw new BadRequestException(
        'Этот эндпоинт поддерживает только покупки за виртуальную валюту. Используйте VK payments для покупок за голоса.',
      );
    }

    if (shopItem.status !== ShopItemStatus.IN_STOCK) {
      throw new BadRequestException('Товар магазина недоступен');
    }

    if (Number(user.money) < shopItem.price) {
      throw new BadRequestException('Недостаточно средств');
    }

    user.money = Number(user.money) - shopItem.price;

    const itemTemplate = shopItem.item_template;

    if (itemTemplate.type === ItemTemplateType.GUARD) {
      if (!itemTemplate.value) {
        throw new BadRequestException(
          'Значение шаблона предмета обязательно для типа GUARD',
        );
      }
      const guardStrength = parseInt(itemTemplate.value, 10);
      const quantity = itemTemplate.quantity || 1;
      const createdGuards: UserGuard[] = [];

      for (let i = 0; i < quantity; i++) {
        const guardName = await this.generateUniqueGuardName();
        const guard = this.userGuardRepository.create({
          name: guardName,
          strength: guardStrength,
          is_first: false,
          user,
        });
        const createdGuard = await this.userGuardRepository.save(guard);
        createdGuards.push(createdGuard);
      }

      await this.userRepository.save(user);
      const userResponse = await this.userService.findMe(user.id);
      const guardsResponse = createdGuards.map((guard) =>
        this.transformUserGuardToResponseDto(guard),
      );
      return { user: userResponse, created_guards: guardsResponse };
    } else if (itemTemplate.type === ItemTemplateType.SHIELD) {
      const userAccessory = this.userAccessoryRepository.create({
        user,
        item_template: itemTemplate,
      });
      const createdUserAccessory =
        await this.userAccessoryRepository.save(userAccessory);
      createdUserAccessory.item_template = itemTemplate;
      await this.userRepository.save(user);
      const userResponse = await this.userService.findMe(user.id);
      const accessoryResponse =
        this.transformUserAccessoryToResponseDto(createdUserAccessory);
      return { user: userResponse, user_accessory: accessoryResponse };
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
          'Значение шаблона предмета обязательно для типов REWARD_DOUBLING и COOLDOWN_HALVING',
        );
      }
      const boostHours = parseInt(itemTemplate.value, 10);
      const now = new Date();

      const lastBoost = await this.userBoostService.findLastByUserIdAndType(
        user.id,
        boostType,
      );

      let boostEndTime: Date;
      let userBoost: UserBoost;

      if (lastBoost && lastBoost.end_time && lastBoost.end_time > now) {
        boostEndTime = new Date(
          lastBoost.end_time.getTime() + boostHours * 60 * 60 * 1000,
        );
        lastBoost.end_time = boostEndTime;
        userBoost = await this.userBoostRepository.save(lastBoost);
      } else {
        boostEndTime = new Date(now.getTime() + boostHours * 60 * 60 * 1000);
        userBoost = this.userBoostRepository.create({
          type: boostType,
          end_time: boostEndTime,
          user,
        });
        userBoost = await this.userBoostRepository.save(userBoost);
      }

      await this.userRepository.save(user);
      const userResponse = await this.userService.findMe(user.id);
      const boostResponse = this.transformUserBoostToResponseDto(userBoost);
      return { user: userResponse, user_boost: boostResponse };
    } else if (
      itemTemplate.type === ItemTemplateType.NICKNAME_COLOR ||
      itemTemplate.type === ItemTemplateType.NICKNAME_ICON ||
      itemTemplate.type === ItemTemplateType.AVATAR_FRAME
    ) {
      const userAccessory = this.userAccessoryRepository.create({
        user,
        item_template: itemTemplate,
      });
      const createdUserAccessory =
        await this.userAccessoryRepository.save(userAccessory);
      createdUserAccessory.item_template = itemTemplate;
      await this.userRepository.save(user);
      const userResponse = await this.userService.findMe(user.id);
      const accessoryResponse =
        this.transformUserAccessoryToResponseDto(createdUserAccessory);
      return { user: userResponse, user_accessory: accessoryResponse };
    } else {
      const userAccessory = this.userAccessoryRepository.create({
        user,
        item_template: itemTemplate,
      });
      const createdUserAccessory =
        await this.userAccessoryRepository.save(userAccessory);
      createdUserAccessory.item_template = itemTemplate;
      await this.userRepository.save(user);
      const userResponse = await this.userService.findMe(user.id);
      const accessoryResponse =
        this.transformUserAccessoryToResponseDto(createdUserAccessory);
      return { user: userResponse, user_accessory: accessoryResponse };
    }
  }

  async purchaseForVKPayments(
    userId: number,
    shopItemId: number,
  ): Promise<ShopItemPurchaseResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const shopItem = await this.shopItemRepository.findOne({
      where: { id: shopItemId },
      relations: ['item_template'],
    });

    if (!shopItem) {
      throw new NotFoundException('Товар магазина не найден');
    }

    if (shopItem.status !== ShopItemStatus.IN_STOCK) {
      throw new BadRequestException('Товар магазина недоступен');
    }

    const itemTemplate = shopItem.item_template;

    if (itemTemplate.type === ItemTemplateType.GUARD) {
      if (!itemTemplate.value) {
        throw new BadRequestException(
          'Значение шаблона предмета обязательно для типа GUARD',
        );
      }
      const guardStrength = parseInt(itemTemplate.value, 10);
      const quantity = itemTemplate.quantity || 1;
      const createdGuards: UserGuard[] = [];

      for (let i = 0; i < quantity; i++) {
        const guardName = await this.generateUniqueGuardName();
        const guard = this.userGuardRepository.create({
          name: guardName,
          strength: guardStrength,
          is_first: false,
          user,
        });
        const createdGuard = await this.userGuardRepository.save(guard);
        createdGuards.push(createdGuard);
      }

      await this.userRepository.save(user);
      const userResponse = await this.userService.findMe(user.id);
      const guardsResponse = createdGuards.map((guard) =>
        this.transformUserGuardToResponseDto(guard),
      );
      return { user: userResponse, created_guards: guardsResponse };
    } else if (itemTemplate.type === ItemTemplateType.SHIELD) {
      const userAccessory = this.userAccessoryRepository.create({
        user,
        item_template: itemTemplate,
      });
      const createdUserAccessory =
        await this.userAccessoryRepository.save(userAccessory);
      createdUserAccessory.item_template = itemTemplate;
      await this.userRepository.save(user);
      const userResponse = await this.userService.findMe(user.id);
      const accessoryResponse =
        this.transformUserAccessoryToResponseDto(createdUserAccessory);
      return { user: userResponse, user_accessory: accessoryResponse };
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
          'Значение шаблона предмета обязательно для типов REWARD_DOUBLING и COOLDOWN_HALVING',
        );
      }
      const boostHours = parseInt(itemTemplate.value, 10);
      const now = new Date();

      const lastBoost = await this.userBoostService.findLastByUserIdAndType(
        user.id,
        boostType,
      );

      let boostEndTime: Date;
      let userBoost: UserBoost;

      if (lastBoost && lastBoost.end_time && lastBoost.end_time > now) {
        boostEndTime = new Date(
          lastBoost.end_time.getTime() + boostHours * 60 * 60 * 1000,
        );
        lastBoost.end_time = boostEndTime;
        userBoost = await this.userBoostRepository.save(lastBoost);
      } else {
        boostEndTime = new Date(now.getTime() + boostHours * 60 * 60 * 1000);
        userBoost = this.userBoostRepository.create({
          type: boostType,
          end_time: boostEndTime,
          user,
        });
        userBoost = await this.userBoostRepository.save(userBoost);
      }

      await this.userRepository.save(user);
      const userResponse = await this.userService.findMe(user.id);
      const boostResponse = this.transformUserBoostToResponseDto(userBoost);
      return { user: userResponse, user_boost: boostResponse };
    } else if (
      itemTemplate.type === ItemTemplateType.NICKNAME_COLOR ||
      itemTemplate.type === ItemTemplateType.NICKNAME_ICON ||
      itemTemplate.type === ItemTemplateType.AVATAR_FRAME
    ) {
      const userAccessory = this.userAccessoryRepository.create({
        user,
        item_template: itemTemplate,
      });
      const createdUserAccessory =
        await this.userAccessoryRepository.save(userAccessory);
      createdUserAccessory.item_template = itemTemplate;
      await this.userRepository.save(user);
      const userResponse = await this.userService.findMe(user.id);
      const accessoryResponse =
        this.transformUserAccessoryToResponseDto(createdUserAccessory);
      return { user: userResponse, user_accessory: accessoryResponse };
    } else {
      const userAccessory = this.userAccessoryRepository.create({
        user,
        item_template: itemTemplate,
      });
      const createdUserAccessory =
        await this.userAccessoryRepository.save(userAccessory);
      createdUserAccessory.item_template = itemTemplate;
      await this.userRepository.save(user);
      const userResponse = await this.userService.findMe(user.id);
      const accessoryResponse =
        this.transformUserAccessoryToResponseDto(createdUserAccessory);
      return { user: userResponse, user_accessory: accessoryResponse };
    }
  }
}
