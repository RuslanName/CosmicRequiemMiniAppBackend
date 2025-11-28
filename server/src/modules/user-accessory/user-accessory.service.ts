import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccessory } from './user-accessory.entity';
import { UserAccessoryStatus } from './enums/user-accessory-status.enum';
import { ItemTemplateType } from '../item-template/enums/item-template-type.enum';
import { UserBoost } from '../user-boost/user-boost.entity';
import { UserBoostType } from '../user-boost/enums/user-boost-type.enum';
import { User } from '../user/user.entity';
import { UserAccessoryResponseDto } from './dtos/user-accessory-response.dto';
import { Settings } from '../../config/setting.config';
import { SettingKey } from '../setting/enums/setting-key.enum';
import { UserMeResponseDto } from '../user/dtos/responses/user-me-response.dto';
import { UserBoostResponseDto } from '../user-boost/dtos/user-boost-response.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class UserAccessoryService {
  constructor(
    @InjectRepository(UserAccessory)
    private readonly userAccessoryRepository: Repository<UserAccessory>,
    @InjectRepository(UserBoost)
    private readonly userBoostRepository: Repository<UserBoost>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

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

  private transformToUserAccessoryResponseDto(
    accessory: UserAccessory,
  ): UserAccessoryResponseDto {
    return {
      id: accessory.id,
      name: accessory.item_template?.name || '',
      status: accessory.status,
      type: accessory.item_template?.type || '',
      value: accessory.item_template?.value || null,
      image_path: accessory.item_template?.image_path || null,
      created_at: accessory.created_at,
    };
  }

  async findByUserId(userId: number): Promise<UserAccessoryResponseDto[]> {
    const accessories = await this.userAccessoryRepository.find({
      where: { user: { id: userId } },
      relations: ['item_template'],
      order: { created_at: 'DESC' },
    });

    return accessories.map((accessory) =>
      this.transformToUserAccessoryResponseDto(accessory),
    );
  }

  async findEquippedByUserId(
    userId: number,
  ): Promise<UserAccessoryResponseDto[]> {
    const accessories = await this.userAccessoryRepository.find({
      where: {
        user: { id: userId },
        status: UserAccessoryStatus.EQUIPPED,
      },
      relations: ['item_template'],
    });

    return accessories.map((accessory) =>
      this.transformToUserAccessoryResponseDto(accessory),
    );
  }

  async equip(
    userId: number,
    accessoryId: number,
  ): Promise<UserAccessoryResponseDto> {
    const accessory = await this.userAccessoryRepository.findOne({
      where: { id: accessoryId },
      relations: ['user', 'item_template'],
    });

    if (!accessory) {
      throw new NotFoundException('Аксессуар не найден');
    }

    if (accessory.user.id !== userId) {
      throw new BadRequestException(
        'Аксессуар не принадлежит этому пользователю',
      );
    }

    const itemTemplateType = accessory.item_template.type;

    if (
      itemTemplateType !== ItemTemplateType.NICKNAME_COLOR &&
      itemTemplateType !== ItemTemplateType.NICKNAME_ICON &&
      itemTemplateType !== ItemTemplateType.AVATAR_FRAME
    ) {
      throw new BadRequestException('Этот тип аксессуара нельзя экипировать');
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
    const savedAccessory = await this.userAccessoryRepository.save(accessory);
    const accessoryWithRelations = await this.userAccessoryRepository.findOne({
      where: { id: savedAccessory.id },
      relations: ['item_template'],
    });
    if (!accessoryWithRelations) {
      throw new NotFoundException('Аксессуар не найден после сохранения');
    }
    return this.transformToUserAccessoryResponseDto(accessoryWithRelations);
  }

  async unequip(
    userId: number,
    accessoryId: number,
  ): Promise<UserAccessoryResponseDto> {
    const accessory = await this.userAccessoryRepository.findOne({
      where: { id: accessoryId },
      relations: ['user', 'item_template'],
    });

    if (!accessory) {
      throw new NotFoundException('Аксессуар не найден');
    }

    if (accessory.user.id !== userId) {
      throw new BadRequestException(
        'Аксессуар не принадлежит этому пользователю',
      );
    }

    if (accessory.status === UserAccessoryStatus.UNEQUIPPED) {
      throw new BadRequestException('Аксессуар уже снят');
    }

    accessory.status = UserAccessoryStatus.UNEQUIPPED;
    const savedAccessory = await this.userAccessoryRepository.save(accessory);
    const accessoryWithRelations = await this.userAccessoryRepository.findOne({
      where: { id: savedAccessory.id },
      relations: ['item_template'],
    });
    if (!accessoryWithRelations) {
      throw new NotFoundException('Аксессуар не найден после сохранения');
    }
    return this.transformToUserAccessoryResponseDto(accessoryWithRelations);
  }

  async activateShield(
    userId: number,
    accessoryId: number,
  ): Promise<{ user: UserMeResponseDto; user_boost: UserBoostResponseDto }> {
    const accessory = await this.userAccessoryRepository.findOne({
      where: { id: accessoryId },
      relations: ['user', 'item_template'],
    });

    if (!accessory) {
      throw new NotFoundException('Аксессуар не найден');
    }

    if (accessory.user.id !== userId) {
      throw new BadRequestException(
        'Аксессуар не принадлежит этому пользователю',
      );
    }

    if (accessory.item_template.type !== ItemTemplateType.SHIELD) {
      throw new BadRequestException('Этот аксессуар не является щитом');
    }

    if (!accessory.item_template.value) {
      throw new BadRequestException(
        'Значение шаблона предмета обязательно для типа SHIELD',
      );
    }

    const user = accessory.user;
    const now = new Date();

    const activateShieldCooldown =
      Settings[SettingKey.ACTIVATE_SHIELD_COOLDOWN];

    const lastShieldBoost = await this.userBoostRepository.findOne({
      where: {
        user: { id: userId },
        type: UserBoostType.SHIELD,
      },
      order: { created_at: 'DESC' },
    });

    if (lastShieldBoost && lastShieldBoost.created_at) {
      const cooldownEndTime = new Date(
        lastShieldBoost.created_at.getTime() + activateShieldCooldown,
      );
      if (cooldownEndTime > now) {
        throw new BadRequestException({
          message: 'Кулдаун активации щита все еще активен',
          cooldown_end: cooldownEndTime,
        });
      }
    }

    const shieldHours = parseInt(accessory.item_template.value, 10);

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

    const userResponse = await this.userService.findMe(user.id);
    const boostResponse = this.transformUserBoostToResponseDto(createdBoost);

    return { user: userResponse, user_boost: boostResponse };
  }
}
