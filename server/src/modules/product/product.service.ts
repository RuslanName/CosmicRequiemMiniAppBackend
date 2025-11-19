import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { ProductType } from './enums/product-type.enum';
import { Color } from './enums/color.enum';
import { NicknameIcon } from './enums/nickname-icon.enum';
import { AvatarFrame } from './enums/avatar-frame.enum';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(paginationDto: PaginationDto): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.productRepository.findAndCount({
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

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  private validateProductValue(type: ProductType, value: string): void {
    switch (type) {
      case ProductType.NICKNAME_COLOR:
        if (!Object.values(Color).includes(value as Color)) {
          throw new BadRequestException(`Value must be one of: ${Object.values(Color).join(', ')}`);
        }
        break;
      case ProductType.NICKNAME_ICON:
        if (!Object.values(NicknameIcon).includes(value as NicknameIcon)) {
          throw new BadRequestException(`Value must be one of: ${Object.values(NicknameIcon).join(', ')}`);
        }
        break;
      case ProductType.AVATAR_FRAME:
        if (!Object.values(AvatarFrame).includes(value as AvatarFrame)) {
          throw new BadRequestException(`Value must be one of: ${Object.values(AvatarFrame).join(', ')}`);
        }
        break;
      case ProductType.GUARD:
        const guardStrength = parseInt(value, 10);
        if (isNaN(guardStrength) || guardStrength <= 0) {
          throw new BadRequestException('Value must be a positive number for GUARD type');
        }
        break;
      case ProductType.SHIELD:
        const shieldHours = parseInt(value, 10);
        if (isNaN(shieldHours) || shieldHours <= 0) {
          throw new BadRequestException('Value must be a positive number for SHIELD type');
        }
        break;
    }
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    this.validateProductValue(createProductDto.type, createProductDto.value);
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const typeToValidate = updateProductDto.type || product.type;
    const valueToValidate = updateProductDto.value || product.value;

    if (updateProductDto.type || updateProductDto.value) {
      this.validateProductValue(typeToValidate, valueToValidate);
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.productRepository.remove(product);
  }
}

