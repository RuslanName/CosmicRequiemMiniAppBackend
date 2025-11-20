import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { ItemTemplateService } from './item-template.service';
import { ItemTemplate } from './item-template.entity';
import { CreateItemTemplateDto } from './dtos/create-item-template.dto';
import { UpdateItemTemplateDto } from './dtos/update-item-template.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import {
  CacheTTL,
  CacheKey,
  InvalidateCache,
} from '../../common/decorators/cache.decorator';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

@ApiTags('ItemTemplate')
@Controller('item-templates')
@UseGuards(AdminJwtAuthGuard)
@ApiCookieAuth()
export class ItemTemplateController {
  constructor(private readonly itemTemplateService: ItemTemplateService) {}

  @Get()
  @CacheTTL(180)
  @CacheKey('item-template:list')
  @ApiOperation({
    summary: 'Получить все продукты с пагинацией',
    description:
      'Возвращает список всех продуктов с поддержкой пагинации. Продукты могут быть разных типов: NICKNAME_COLOR, NICKNAME_ICON, AVATAR_FRAME, GUARD, SHIELD.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы (по умолчанию 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество элементов на странице (по умолчанию 10)',
    example: 10,
  })
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
            updated_at: '2024-01-01T00:00:00.000Z',
          },
        ],
        total: 100,
        page: 1,
        limit: 10,
      },
    },
  })
  async findAll(@Query() paginationDto: PaginationDto): Promise<{
    data: ItemTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.itemTemplateService.findAll(paginationDto);
  }

  @Get(':id')
  @CacheTTL(300)
  @CacheKey('item-template::id')
  @ApiOperation({
    summary: 'Получить продукт по ID',
    description:
      'Возвращает полную информацию о продукте по его идентификатору.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID продукта',
    example: 1,
  })
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
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Продукт не найден' })
  async findOne(@Param('id') id: string): Promise<ItemTemplate> {
    return this.itemTemplateService.findOne(+id);
  }

  @Post()
  @InvalidateCache('item-template:list')
  @ApiOperation({
    summary: 'Создать новый продукт',
    description:
      'Создает новый продукт с валидацией значения в зависимости от типа: NICKNAME_COLOR - значение из enum Color (red, blue, green, colorful), NICKNAME_ICON - значение из enum NicknameIcon, AVATAR_FRAME - значение из enum AvatarFrame, GUARD - положительное число (сила), SHIELD - положительное число (часы).',
  })
  @ApiBody({
    schema: {
      examples: {
        nicknameColor: {
          value: {
            name: 'Red Nickname',
            type: 'nickname_color',
            value: 'red',
          },
          description: 'Пример создания продукта типа NICKNAME_COLOR',
        },
        guard: {
          value: {
            name: 'Strong Guard',
            type: 'guard',
            value: '100',
          },
          description: 'Пример создания продукта типа GUARD (сила стража)',
        },
        shield: {
          value: {
            name: '24h Shield',
            type: 'shield',
            value: '24',
          },
          description: 'Пример создания продукта типа SHIELD (часы защиты)',
        },
      },
    },
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
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверное значение для типа продукта',
  })
  async create(
    @Body() createItemTemplateDto: CreateItemTemplateDto,
  ): Promise<ItemTemplate> {
    return this.itemTemplateService.create(createItemTemplateDto);
  }

  @Patch(':id')
  @InvalidateCache('item-template::id', 'item-template:list')
  @ApiOperation({ summary: 'Обновить шаблон предмета' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает обновленный шаблон предмета',
  })
  async update(
    @Param('id') id: string,
    @Body() updateItemTemplateDto: UpdateItemTemplateDto,
  ): Promise<ItemTemplate> {
    return this.itemTemplateService.update(+id, updateItemTemplateDto);
  }

  @Delete(':id')
  @InvalidateCache('item-template::id', 'item-template:list')
  @ApiOperation({ summary: 'Удалить шаблон предмета' })
  @ApiResponse({ status: 200, description: 'Шаблон предмета успешно удален' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.itemTemplateService.remove(+id);
  }
}
