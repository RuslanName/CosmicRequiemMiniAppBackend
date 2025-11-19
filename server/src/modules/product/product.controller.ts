import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { CacheTTL, CacheKey, InvalidateCache } from '../../common/decorators/cache.decorator';

@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @CacheTTL(180)
  @CacheKey('product:list')
  @ApiOperation({ 
    summary: 'Получить все продукты с пагинацией',
    description: 'Возвращает список всех продуктов с поддержкой пагинации. Продукты могут быть разных типов: NICKNAME_COLOR, NICKNAME_ICON, AVATAR_FRAME, GUARD, SHIELD.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы (по умолчанию 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество элементов на странице (по умолчанию 10)', example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: 'Список продуктов успешно возвращен',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Red Nickname',
            type: 'nickname_color',
            value: 'red',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
          }
        ],
        total: 100,
        page: 1,
        limit: 10
      }
    }
  })
  async findAll(@Query() paginationDto: PaginationDto): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    return this.productService.findAll(paginationDto);
  }

  @Get(':id')
  @CacheTTL(300)
  @CacheKey('product::id')
  @ApiOperation({ 
    summary: 'Получить продукт по ID',
    description: 'Возвращает полную информацию о продукте по его идентификатору.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID продукта', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Продукт успешно возвращен',
    schema: {
      example: {
        id: 1,
        name: 'Red Nickname',
        type: 'nickname_color',
        value: 'red',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Продукт не найден' })
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productService.findOne(+id);
  }

  @Post()
  @InvalidateCache('product:list')
  @ApiOperation({ 
    summary: 'Создать новый продукт',
    description: 'Создает новый продукт с валидацией значения в зависимости от типа: NICKNAME_COLOR - значение из enum Color (red, blue, green, colorful), NICKNAME_ICON - значение из enum NicknameIcon, AVATAR_FRAME - значение из enum AvatarFrame, GUARD - положительное число (сила), SHIELD - положительное число (часы).'
  })
  @ApiBody({
    schema: {
      examples: {
        nicknameColor: {
          value: {
            name: 'Red Nickname',
            type: 'nickname_color',
            value: 'red'
          },
          description: 'Пример создания продукта типа NICKNAME_COLOR'
        },
        guard: {
          value: {
            name: 'Strong Guard',
            type: 'guard',
            value: '100'
          },
          description: 'Пример создания продукта типа GUARD (сила стража)'
        },
        shield: {
          value: {
            name: '24h Shield',
            type: 'shield',
            value: '24'
          },
          description: 'Пример создания продукта типа SHIELD (часы защиты)'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Продукт успешно создан',
    schema: {
      example: {
        id: 1,
        name: 'Red Nickname',
        type: 'nickname_color',
        value: 'red',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверное значение для типа продукта' })
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
  }

  @Patch(':id')
  @InvalidateCache('product::id', 'product:list')
  @ApiOperation({ summary: 'Обновить продукт' })
  @ApiResponse({ status: 200, description: 'Возвращает обновленный продукт' })
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto): Promise<Product> {
    return this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @InvalidateCache('product::id', 'product:list')
  @ApiOperation({ summary: 'Удалить продукт' })
  @ApiResponse({ status: 200, description: 'Продукт успешно удален' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.productService.remove(+id);
  }
}

