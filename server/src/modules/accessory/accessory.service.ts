import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Accessory } from './accessory.entity';
import { CreateAccessoryDto } from './dtos/create-accessory.dto';
import { UpdateAccessoryDto } from './dtos/update-accessory.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';
import { ProductType } from '../product/enums/product-type.enum';
import { Currency } from '../../common/enums/currency.enum';
import { AccessoryStatus } from './enums/accessory-status.enum';
import { Settings } from '../../config/setting.config';
import { SettingKey } from '../setting/setting-key.enum';

@Injectable()
export class AccessoryService {
  constructor(
    @InjectRepository(Accessory)
    private readonly accessoryRepository: Repository<Accessory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserGuard)
    private readonly userGuardRepository: Repository<UserGuard>,
    @InjectRepository(UserAccessory)
    private readonly userAccessoryRepository: Repository<UserAccessory>,
  ) {}

  async findAll(paginationDto: PaginationDto): Promise<{ data: Accessory[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.accessoryRepository.findAndCount({
      relations: ['product'],
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

  async findOne(id: number): Promise<Accessory> {
    const accessory = await this.accessoryRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!accessory) {
      throw new NotFoundException(`Accessory with ID ${id} not found`);
    }

    return accessory;
  }

  async create(createAccessoryDto: CreateAccessoryDto): Promise<Accessory> {
    const product = await this.productRepository.findOne({
      where: { id: createAccessoryDto.product_id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${createAccessoryDto.product_id} not found`);
    }

    const accessory = this.accessoryRepository.create({
      name: createAccessoryDto.name,
      currency: createAccessoryDto.currency,
      price: createAccessoryDto.price,
      status: createAccessoryDto.status,
      product,
    });

    return this.accessoryRepository.save(accessory);
  }

  async update(id: number, updateAccessoryDto: UpdateAccessoryDto): Promise<Accessory> {
    const accessory = await this.accessoryRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!accessory) {
      throw new NotFoundException(`Accessory with ID ${id} not found`);
    }

    if (updateAccessoryDto.product_id) {
      const product = await this.productRepository.findOne({
        where: { id: updateAccessoryDto.product_id },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${updateAccessoryDto.product_id} not found`);
      }

      accessory.product = product;
    }

    Object.assign(accessory, {
      name: updateAccessoryDto.name,
      currency: updateAccessoryDto.currency,
      price: updateAccessoryDto.price,
      status: updateAccessoryDto.status,
    });

    return this.accessoryRepository.save(accessory);
  }

  async remove(id: number): Promise<void> {
    const accessory = await this.accessoryRepository.findOne({ where: { id } });

    if (!accessory) {
      throw new NotFoundException(`Accessory with ID ${id} not found`);
    }

    await this.accessoryRepository.remove(accessory);
  }

  async purchase(userId: number, accessoryId: number): Promise<{ user: User; created_guard?: UserGuard; user_accessory?: UserAccessory }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const accessory = await this.accessoryRepository.findOne({
      where: { id: accessoryId },
      relations: ['product'],
    });

    if (!accessory) {
      throw new NotFoundException('Accessory not found');
    }

    if (accessory.status !== AccessoryStatus.IN_STOCK) {
      throw new BadRequestException('Accessory is not available');
    }

    if (accessory.currency === Currency.VIRTUAL) {
      if (Number(user.money) < accessory.price) {
        throw new BadRequestException('Insufficient funds');
      }
      user.money = Number(user.money) - accessory.price;
    } else {
      throw new BadRequestException('VOICES currency not implemented yet');
    }

    const product = accessory.product;

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
      await this.userRepository.save(user);
      return { user };
    } else if (product.type === ProductType.NICKNAME_COLOR) {
      user.nickname_color = product.value;
      await this.userRepository.save(user);
      const userAccessory = this.userAccessoryRepository.create({
        name: accessory.name,
        currency: accessory.currency,
        price: accessory.price,
        user,
        product,
        accessory,
      });
      const createdUserAccessory = await this.userAccessoryRepository.save(userAccessory);
      return { user, user_accessory: createdUserAccessory };
    } else if (product.type === ProductType.NICKNAME_ICON) {
      user.nickname_icon = product.value;
      await this.userRepository.save(user);
      const userAccessory = this.userAccessoryRepository.create({
        name: accessory.name,
        currency: accessory.currency,
        price: accessory.price,
        user,
        product,
        accessory,
      });
      const createdUserAccessory = await this.userAccessoryRepository.save(userAccessory);
      return { user, user_accessory: createdUserAccessory };
    } else if (product.type === ProductType.AVATAR_FRAME) {
      user.avatar_frame = product.value;
      await this.userRepository.save(user);
      const userAccessory = this.userAccessoryRepository.create({
        name: accessory.name,
        currency: accessory.currency,
        price: accessory.price,
        user,
        product,
        accessory,
      });
      const createdUserAccessory = await this.userAccessoryRepository.save(userAccessory);
      return { user, user_accessory: createdUserAccessory };
    } else {
      const userAccessory = this.userAccessoryRepository.create({
        name: accessory.name,
        currency: accessory.currency,
        price: accessory.price,
        user,
        product,
        accessory,
      });
      const createdUserAccessory = await this.userAccessoryRepository.save(userAccessory);
      await this.userRepository.save(user);
      return { user, user_accessory: createdUserAccessory };
    }
  }
}
