import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemTemplate } from './item-template.entity';
import { ItemTemplateResponseDto } from './dtos/responses/item-template-response.dto';
import { CreateItemTemplateDto } from './dtos/create-item-template.dto';
import { UpdateItemTemplateDto } from './dtos/update-item-template.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { ItemTemplateType } from './enums/item-template-type.enum';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ShopItem } from '../shop-item/shop-item.entity';
import { Kit } from '../kit/kit.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';

@Injectable()
export class ItemTemplateService {
  constructor(
    @InjectRepository(ItemTemplate)
    private readonly itemTemplateRepository: Repository<ItemTemplate>,
    @InjectRepository(ShopItem)
    private readonly shopItemRepository: Repository<ShopItem>,
    @InjectRepository(Kit)
    private readonly kitRepository: Repository<Kit>,
    @InjectRepository(UserAccessory)
    private readonly userAccessoryRepository: Repository<UserAccessory>,
  ) {}

  private transformToItemTemplateResponseDto(
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

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ItemTemplateResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.itemTemplateRepository.findAndCount({
      skip,
      take: limit,
    });

    return {
      data: data.map((it) => this.transformToItemTemplateResponseDto(it)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<ItemTemplateResponseDto> {
    const itemTemplate = await this.itemTemplateRepository.findOne({
      where: { id },
    });

    if (!itemTemplate) {
      throw new NotFoundException(`Шаблон предмета с ID ${id} не найден`);
    }

    return this.transformToItemTemplateResponseDto(itemTemplate);
  }

  private validateItemTemplateValue(
    type: ItemTemplateType,
    value: string | null | undefined,
  ): void {
    if (!value) {
      return;
    }

    switch (type) {
      case ItemTemplateType.NICKNAME_COLOR:
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!hexColorRegex.test(value)) {
          throw new BadRequestException(
            'Значение должно быть валидным hex-цветом (например, #ff0000)',
          );
        }
        break;
      case ItemTemplateType.NICKNAME_ICON:
      case ItemTemplateType.AVATAR_FRAME:
        break;
      case ItemTemplateType.GUARD:
        const guardStrength = parseInt(value, 10);
        if (isNaN(guardStrength) || guardStrength <= 0) {
          throw new BadRequestException(
            'Значение должно быть положительным числом для типа GUARD',
          );
        }
        break;
      case ItemTemplateType.SHIELD:
      case ItemTemplateType.REWARD_DOUBLING:
      case ItemTemplateType.COOLDOWN_HALVING:
        const timeValue = parseInt(value, 10);
        if (isNaN(timeValue) || timeValue <= 0) {
          throw new BadRequestException(
            'Значение должно быть положительным числом (время в часах) для типов SHIELD, REWARD_DOUBLING и COOLDOWN_HALVING',
          );
        }
        break;
    }
  }

  private saveItemTemplateImage(file?: Express.Multer.File): string | null {
    if (!file) {
      return null;
    }

    const uploadDir = path.join(process.cwd(), 'data', 'item-template-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `item-template-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return path
      .join('data', 'item-template-images', fileName)
      .replace(/\\/g, '/');
  }

  private deleteItemTemplateImage(imagePath: string): void {
    if (imagePath && imagePath.startsWith('data/item-template-images/')) {
      const fullPath = path.join(process.cwd(), imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  }

  async create(
    createItemTemplateDto: CreateItemTemplateDto,
    image?: Express.Multer.File,
  ): Promise<ItemTemplateResponseDto> {
    if (createItemTemplateDto.value) {
      this.validateItemTemplateValue(
        createItemTemplateDto.type,
        createItemTemplateDto.value,
      );
    }

    const imagePath = this.saveItemTemplateImage(image);
    const itemTemplate = this.itemTemplateRepository.create({
      ...createItemTemplateDto,
      image_path: imagePath,
    });
    const savedItemTemplate = await this.itemTemplateRepository.save(itemTemplate);
    return this.transformToItemTemplateResponseDto(savedItemTemplate);
  }

  async update(
    id: number,
    updateItemTemplateDto: UpdateItemTemplateDto,
    image?: Express.Multer.File,
  ): Promise<ItemTemplateResponseDto> {
    const itemTemplate = await this.itemTemplateRepository.findOne({
      where: { id },
    });

    if (!itemTemplate) {
      throw new NotFoundException(`Шаблон предмета с ID ${id} не найден`);
    }

    const typeToValidate = updateItemTemplateDto.type || itemTemplate.type;
    const valueToValidate =
      updateItemTemplateDto.value !== undefined
        ? updateItemTemplateDto.value
        : itemTemplate.value;

    if (
      updateItemTemplateDto.type ||
      updateItemTemplateDto.value !== undefined
    ) {
      this.validateItemTemplateValue(typeToValidate, valueToValidate);
    }

    if (image) {
      if (itemTemplate.image_path) {
        this.deleteItemTemplateImage(itemTemplate.image_path);
      }
      const imagePath = this.saveItemTemplateImage(image);
      updateItemTemplateDto = {
        ...updateItemTemplateDto,
        image_path: imagePath,
      } as UpdateItemTemplateDto;
    }

    Object.assign(itemTemplate, updateItemTemplateDto);
    const savedItemTemplate = await this.itemTemplateRepository.save(itemTemplate);
    return this.transformToItemTemplateResponseDto(savedItemTemplate);
  }

  async remove(id: number): Promise<void> {
    const itemTemplate = await this.itemTemplateRepository.findOne({
      where: { id },
    });

    if (!itemTemplate) {
      throw new NotFoundException(`Шаблон предмета с ID ${id} не найден`);
    }

    const shopItems = await this.shopItemRepository.find({
      where: { item_template: { id } },
    });

    if (shopItems.length > 0) {
      throw new BadRequestException(
        `Нельзя удалить шаблон предмета: ${shopItems.length} товаров магазина используют его`,
      );
    }

    const allKits = await this.kitRepository.find({
      relations: ['item_templates'],
    });
    const kits = allKits.filter((kit) =>
      kit.item_templates?.some((template) => template.id === id),
    );

    if (kits.length > 0) {
      throw new BadRequestException(
        `Нельзя удалить шаблон предмета: ${kits.length} наборов используют его`,
      );
    }

    const userAccessories = await this.userAccessoryRepository.find({
      where: { item_template: { id } },
    });

    if (userAccessories.length > 0) {
      throw new BadRequestException(
        `Нельзя удалить шаблон предмета: ${userAccessories.length} аксессуаров пользователей используют его`,
      );
    }

    if (itemTemplate.image_path) {
      this.deleteItemTemplateImage(itemTemplate.image_path);
    }

    await this.itemTemplateRepository.remove(itemTemplate);
  }
}
