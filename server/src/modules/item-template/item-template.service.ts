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
import { ProductType } from './enums/product-type.enum';
import { Color } from './enums/color.enum';
import { NicknameIcon } from './enums/nickname-icon.enum';
import { AvatarFrame } from './enums/avatar-frame.enum';

@Injectable()
export class ItemTemplateService {
  constructor(
    @InjectRepository(ItemTemplate)
    private readonly itemTemplateRepository: Repository<ItemTemplate>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{
    data: ItemTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
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

  private validateProductValue(type: ProductType, value: string): void {
    switch (type) {
      case ProductType.NICKNAME_COLOR:
        if (!Object.values(Color).includes(value as Color)) {
          throw new BadRequestException(
            `Value must be one of: ${Object.values(Color).join(', ')}`,
          );
        }
        break;
      case ProductType.NICKNAME_ICON:
        if (!Object.values(NicknameIcon).includes(value as NicknameIcon)) {
          throw new BadRequestException(
            `Value must be one of: ${Object.values(NicknameIcon).join(', ')}`,
          );
        }
        break;
      case ProductType.AVATAR_FRAME:
        if (!Object.values(AvatarFrame).includes(value as AvatarFrame)) {
          throw new BadRequestException(
            `Value must be one of: ${Object.values(AvatarFrame).join(', ')}`,
          );
        }
        break;
      case ProductType.GUARD:
        const guardStrength = parseInt(value, 10);
        if (isNaN(guardStrength) || guardStrength <= 0) {
          throw new BadRequestException(
            'Value must be a positive number for GUARD type',
          );
        }
        break;
      case ProductType.SHIELD:
        const shieldHours = parseInt(value, 10);
        if (isNaN(shieldHours) || shieldHours <= 0) {
          throw new BadRequestException(
            'Value must be a positive number for SHIELD type',
          );
        }
        break;
    }
  }

  async create(
    createItemTemplateDto: CreateItemTemplateDto,
  ): Promise<ItemTemplate> {
    this.validateProductValue(
      createItemTemplateDto.type,
      createItemTemplateDto.value,
    );
    const itemTemplate = this.itemTemplateRepository.create(
      createItemTemplateDto,
    );
    return this.itemTemplateRepository.save(itemTemplate);
  }

  async update(
    id: number,
    updateItemTemplateDto: UpdateItemTemplateDto,
  ): Promise<ItemTemplate> {
    const itemTemplate = await this.itemTemplateRepository.findOne({
      where: { id },
    });

    if (!itemTemplate) {
      throw new NotFoundException(`ItemTemplate with ID ${id} not found`);
    }

    const typeToValidate = updateItemTemplateDto.type || itemTemplate.type;
    const valueToValidate = updateItemTemplateDto.value || itemTemplate.value;

    if (updateItemTemplateDto.type || updateItemTemplateDto.value) {
      this.validateProductValue(typeToValidate, valueToValidate);
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

    await this.itemTemplateRepository.remove(itemTemplate);
  }
}
