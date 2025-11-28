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
import { generateRandom8DigitCode } from '../../common/utils/number-format.util';
import { UserKit } from '../user-kit/user-kit.entity';
import { UserService } from '../user/user.service';
import { UserAccessoryService } from '../user-accessory/user-accessory.service';
import { UserMeResponseDto } from '../user/dtos/responses/user-me-response.dto';
import { UserGuardResponseDto } from '../user-guard/dtos/responses/user-guard-response.dto';
import { UserAccessoryResponseDto } from '../user-accessory/dtos/user-accessory-response.dto';
import { UserBoostResponseDto } from '../user-boost/dtos/user-boost-response.dto';

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
    @InjectRepository(UserKit)
    private readonly userKitRepository: Repository<UserKit>,
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
      created_at: guard.created_at,
      updated_at: guard.updated_at,
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
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Kit>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const purchasedKits = await this.userKitRepository.find({
      where: { user: { id: userId } },
      relations: ['kit'],
    });
    const purchasedKitIds = purchasedKits.map((uk) => uk.kit.id);

    const queryBuilder = this.kitRepository
      .createQueryBuilder('kit')
      .leftJoinAndSelect('kit.item_templates', 'item_template')
      .where('kit.status = :status', { status: ShopItemStatus.IN_STOCK });

    if (purchasedKitIds.length > 0) {
      queryBuilder.andWhere('kit.id NOT IN (:...ids)', {
        ids: purchasedKitIds,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('kit.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

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
      throw new NotFoundException(`Набор с ID ${id} не найден`);
    }

    return kit;
  }

  async create(createKitDto: CreateKitDto): Promise<Kit> {
    const itemTemplates = await this.itemTemplateRepository.find({
      where: { id: In(createKitDto.item_template_ids) },
    });

    if (itemTemplates.length !== createKitDto.item_template_ids.length) {
      throw new NotFoundException('Некоторые шаблоны предметов не найдены');
    }

    const kit = this.kitRepository.create({
      name: createKitDto.name,
      currency: createKitDto.currency,
      price: createKitDto.price,
      money: createKitDto.money || 0,
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
      throw new NotFoundException(`Набор с ID ${id} не найден`);
    }

    if (updateKitDto.item_template_ids) {
      const itemTemplates = await this.itemTemplateRepository.find({
        where: { id: In(updateKitDto.item_template_ids) },
      });

      if (itemTemplates.length !== updateKitDto.item_template_ids.length) {
        throw new NotFoundException('Некоторые шаблоны предметов не найдены');
      }

      kit.item_templates = itemTemplates;
    }

    Object.assign(kit, {
      name: updateKitDto.name,
      currency: updateKitDto.currency,
      price: updateKitDto.price,
      money: updateKitDto.money !== undefined ? updateKitDto.money : kit.money,
      status: updateKitDto.status,
    });

    return this.kitRepository.save(kit);
  }

  async remove(id: number): Promise<void> {
    const kit = await this.kitRepository.findOne({ where: { id } });

    if (!kit) {
      throw new NotFoundException(`Набор с ID ${id} не найден`);
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
      throw new NotFoundException('Пользователь не найден');
    }

    const kit = await this.kitRepository.findOne({
      where: { id: kitId },
      relations: ['item_templates'],
    });

    if (!kit) {
      throw new NotFoundException('Набор не найден');
    }

    if (kit.status !== ShopItemStatus.IN_STOCK) {
      throw new BadRequestException('Набор недоступен');
    }

    const existingUserKit = await this.userKitRepository.findOne({
      where: { user: { id: userId }, kit: { id: kitId } },
    });

    if (existingUserKit) {
      throw new BadRequestException('Набор уже был куплен');
    }

    if (kit.currency === Currency.VIRTUAL) {
      if (Number(user.money) < kit.price) {
        throw new BadRequestException('Недостаточно средств');
      }
      user.money = Number(user.money) - kit.price;
    } else if (kit.currency === Currency.VOICES) {
    } else {
      throw new BadRequestException(`Неподдерживаемая валюта: ${kit.currency}`);
    }

    const createdGuards: UserGuard[] = [];
    const userAccessories: UserAccessory[] = [];
    const userBoosts: UserBoost[] = [];

    for (const itemTemplate of kit.item_templates) {
      if (itemTemplate.type === ItemTemplateType.GUARD) {
        if (!itemTemplate.value) {
          throw new BadRequestException(
            'Значение шаблона предмета обязательно для типа GUARD',
          );
        }
        const guardStrength = parseInt(itemTemplate.value, 10);
        const quantity = itemTemplate.quantity || 1;

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
      } else if (itemTemplate.type === ItemTemplateType.SHIELD) {
        const userAccessory = this.userAccessoryRepository.create({
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
          user,
          item_template: itemTemplate,
        });
        const createdUserAccessory =
          await this.userAccessoryRepository.save(userAccessory);
        userAccessories.push(createdUserAccessory);
      } else {
        const userAccessory = this.userAccessoryRepository.create({
          user,
          item_template: itemTemplate,
        });
        const createdUserAccessory =
          await this.userAccessoryRepository.save(userAccessory);
        userAccessories.push(createdUserAccessory);
      }
    }

    if (kit.money && kit.money > 0) {
      user.money = Number(user.money) + kit.money;
    }

    const userKit = this.userKitRepository.create({
      user,
      kit,
    });
    await this.userKitRepository.save(userKit);

    await this.userRepository.save(user);

    // Transform entities to response DTOs
    const userResponse = await this.userService.findMe(user.id);
    const guardsResponse = createdGuards.map((guard) =>
      this.transformUserGuardToResponseDto(guard),
    );

    // Transform only created accessories
    const accessoriesResponse = await Promise.all(
      userAccessories.map(async (accessory) => {
        const accessoryWithRelations =
          await this.userAccessoryRepository.findOne({
            where: { id: accessory.id },
            relations: ['item_template'],
          });
        if (!accessoryWithRelations) {
          throw new NotFoundException('Аксессуар не найден');
        }
        return {
          id: accessoryWithRelations.id,
          name: accessoryWithRelations.item_template?.name || '',
          status: accessoryWithRelations.status,
          type: accessoryWithRelations.item_template?.type || '',
          value: accessoryWithRelations.item_template?.value || null,
          image_path: accessoryWithRelations.item_template?.image_path || null,
          created_at: accessoryWithRelations.created_at,
        } as UserAccessoryResponseDto;
      }),
    );

    const boostsResponse = userBoosts.map((boost) =>
      this.transformUserBoostToResponseDto(boost),
    );

    return {
      user: userResponse,
      created_guards: guardsResponse,
      user_accessories: accessoriesResponse,
      user_boosts: boostsResponse,
    };
  }
}
