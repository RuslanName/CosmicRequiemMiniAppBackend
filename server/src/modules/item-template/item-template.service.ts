import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemTemplate } from './item-template.entity';
import { CreateItemTemplateDto } from './dtos/create-item-template.dto';
import { UpdateItemTemplateDto } from './dtos/update-item-template.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { ItemTemplateType } from './enums/item-template-type.enum';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ItemTemplateService {
  constructor(
    @InjectRepository(ItemTemplate)
    private readonly itemTemplateRepository: Repository<ItemTemplate>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ItemTemplate>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.itemTemplateRepository.findAndCount({
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

  async findOne(id: number): Promise<ItemTemplate> {
    const itemTemplate = await this.itemTemplateRepository.findOne({
      where: { id },
    });

    if (!itemTemplate) {
      throw new NotFoundException(`ItemTemplate with ID ${id} not found`);
    }

    return itemTemplate;
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
            'Value must be a valid hex color (e.g., #ff0000)',
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
            'Value must be a positive number for GUARD type',
          );
        }
        break;
      case ItemTemplateType.SHIELD:
      case ItemTemplateType.REWARD_DOUBLING:
      case ItemTemplateType.COOLDOWN_HALVING:
        const timeValue = parseInt(value, 10);
        if (isNaN(timeValue) || timeValue <= 0) {
          throw new BadRequestException(
            'Value must be a positive number (time in hours) for SHIELD, REWARD_DOUBLING, and COOLDOWN_HALVING types',
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
  ): Promise<ItemTemplate> {
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
    return this.itemTemplateRepository.save(itemTemplate);
  }

  async update(
    id: number,
    updateItemTemplateDto: UpdateItemTemplateDto,
    image?: Express.Multer.File,
  ): Promise<ItemTemplate> {
    const itemTemplate = await this.itemTemplateRepository.findOne({
      where: { id },
    });

    if (!itemTemplate) {
      throw new NotFoundException(`ItemTemplate with ID ${id} not found`);
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
    return this.itemTemplateRepository.save(itemTemplate);
  }

  async remove(id: number): Promise<void> {
    const itemTemplate = await this.itemTemplateRepository.findOne({
      where: { id },
    });

    if (!itemTemplate) {
      throw new NotFoundException(`ItemTemplate with ID ${id} not found`);
    }

    if (itemTemplate.image_path) {
      this.deleteItemTemplateImage(itemTemplate.image_path);
    }

    await this.itemTemplateRepository.remove(itemTemplate);
  }
}
