import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Kit } from './kit.entity';
import { CreateKitDto } from './dtos/create-kit.dto';
import { UpdateKitDto } from './dtos/update-kit.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';
import { ProductType } from '../product/enums/product-type.enum';
import { Currency } from '../../common/enums/currency.enum';
import { AccessoryStatus } from '../accessory/enums/accessory-status.enum';
import { Settings } from '../../config/setting.config';
import { SettingKey } from '../setting/setting-key.enum';

@Injectable()
export class KitService {
  constructor(
    @InjectRepository(Kit)
    private readonly kitRepository: Repository<Kit>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserGuard)
    private readonly userGuardRepository: Repository<UserGuard>,
    @InjectRepository(UserAccessory)
    private readonly userAccessoryRepository: Repository<UserAccessory>,
  ) {}

  async findAll(paginationDto: PaginationDto): Promise<{ data: Kit[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.kitRepository.findAndCount({
      relations: ['products'],
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
      relations: ['products'],
    });

    if (!kit) {
      throw new NotFoundException(`Kit with ID ${id} not found`);
    }

    return kit;
  }

  async create(createKitDto: CreateKitDto): Promise<Kit> {
    const products = await this.productRepository.find({
      where: { id: In(createKitDto.product_ids) },
    });

    if (products.length !== createKitDto.product_ids.length) {
      throw new NotFoundException('Some products not found');
    }

    const kit = this.kitRepository.create({
      name: createKitDto.name,
      currency: createKitDto.currency,
      price: createKitDto.price,
      status: createKitDto.status,
      products,
    });

    return this.kitRepository.save(kit);
  }

  async update(id: number, updateKitDto: UpdateKitDto): Promise<Kit> {
    const kit = await this.kitRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!kit) {
      throw new NotFoundException(`Kit with ID ${id} not found`);
    }

    if (updateKitDto.product_ids) {
      const products = await this.productRepository.find({
        where: { id: In(updateKitDto.product_ids) },
      });

      if (products.length !== updateKitDto.product_ids.length) {
        throw new NotFoundException('Some products not found');
      }

      kit.products = products;
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

  async purchase(userId: number, kitId: number): Promise<{ user: User; created_guards: UserGuard[]; user_accessories: UserAccessory[] }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const kit = await this.kitRepository.findOne({
      where: { id: kitId },
      relations: ['products'],
    });

    if (!kit) {
      throw new NotFoundException('Kit not found');
    }

    if (kit.status !== AccessoryStatus.IN_STOCK) {
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

    for (const product of kit.products) {
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
        const purchaseShieldCooldown = Settings[SettingKey.PURCHASE_SHIELD_COOLDOWN];
        if (user.last_shield_purchase_time) {
          const cooldownEndTime = new Date(user.last_shield_purchase_time.getTime() + purchaseShieldCooldown);
          if (cooldownEndTime > new Date()) {
            throw new BadRequestException('Shield purchase cooldown is still active');
          }
        }

        const shieldHours = parseInt(product.value, 10);
        const now = new Date();
        const shieldEndTime = user.shield_end_time && user.shield_end_time > now
          ? new Date(user.shield_end_time.getTime() + shieldHours * 60 * 60 * 1000)
          : new Date(now.getTime() + shieldHours * 60 * 60 * 1000);
        
        user.shield_end_time = shieldEndTime;
        user.last_shield_purchase_time = now;
      } else if (product.type === ProductType.NICKNAME_COLOR) {
        user.nickname_color = product.value;
        const userAccessory = this.userAccessoryRepository.create({
          name: kit.name,
          currency: kit.currency,
          price: kit.price,
          user,
          product,
        });
        const createdUserAccessory = await this.userAccessoryRepository.save(userAccessory);
        userAccessories.push(createdUserAccessory);
      } else if (product.type === ProductType.NICKNAME_ICON) {
        user.nickname_icon = product.value;
        const userAccessory = this.userAccessoryRepository.create({
          name: kit.name,
          currency: kit.currency,
          price: kit.price,
          user,
          product,
        });
        const createdUserAccessory = await this.userAccessoryRepository.save(userAccessory);
        userAccessories.push(createdUserAccessory);
      } else if (product.type === ProductType.AVATAR_FRAME) {
        user.avatar_frame = product.value;
        const userAccessory = this.userAccessoryRepository.create({
          name: kit.name,
          currency: kit.currency,
          price: kit.price,
          user,
          product,
        });
        const createdUserAccessory = await this.userAccessoryRepository.save(userAccessory);
        userAccessories.push(createdUserAccessory);
      } else {
        const userAccessory = this.userAccessoryRepository.create({
          name: kit.name,
          currency: kit.currency,
          price: kit.price,
          user,
          product,
        });
        const createdUserAccessory = await this.userAccessoryRepository.save(userAccessory);
        userAccessories.push(createdUserAccessory);
      }
    }

    await this.userRepository.save(user);
    return { user, created_guards: createdGuards, user_accessories: userAccessories };
  }
}
