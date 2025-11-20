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
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Express } from 'express';
import { ShopItemService } from './shop-item.service';
import { ShopItem } from './shop-item.entity';
import { CreateShopItemDto } from './dtos/create-shop-item.dto';
import { UpdateShopItemDto } from './dtos/update-shop-item.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PurchaseShopItemDto } from './dtos/purchase-shop-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import {
  CacheTTL,
  CacheKey,
  InvalidateCache,
} from '../../common/decorators/cache.decorator';

@ApiTags('ShopItem')
@Controller('shop-items')
export class ShopItemController {
  constructor(private readonly shopItemService: ShopItemService) {}

  @Get()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @CacheTTL(180)
  @CacheKey('shop-item:list')
  @ApiOperation({
    summary: 'Получить все аксессуары с пагинацией',
    description:
      'Возвращает список всех доступных аксессуаров с поддержкой пагинации. Каждый аксессуар содержит информацию о продукте, цене, валюте и статусе.',
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
    description: 'Список аксессуаров успешно возвращен',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Red Nickname',
            currency: 'virtual',
            price: 1000,
            status: 'in_stock',
            product: { id: 1, type: 'nickname_color', value: 'red' },
          },
        ],
        total: 50,
        page: 1,
        limit: 10,
      },
    },
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<{ data: ShopItem[]; total: number; page: number; limit: number }> {
    return this.shopItemService.findAll(paginationDto);
  }

  @Get(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @CacheTTL(300)
  @CacheKey('shop-item::id')
  @ApiOperation({
    summary: 'Получить аксессуар по ID',
    description:
      'Возвращает полную информацию об аксессуаре по его идентификатору, включая связанный продукт.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID аксессуара',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Аксессуар успешно возвращен',
    schema: {
      example: {
        id: 1,
        name: 'Red Nickname',
        currency: 'virtual',
        price: 1000,
        status: 'in_stock',
        product: {
          id: 1,
          name: 'Red Nickname Product',
          type: 'nickname_color',
          value: 'red',
        },
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Аксессуар не найден' })
  async findOne(@Param('id') id: string): Promise<ShopItem> {
    return this.shopItemService.findOne(+id);
  }

  @Post()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @InvalidateCache('shop-item:list')
  @ApiOperation({
    summary: 'Создать новый товар магазина',
    description:
      'Создает новый товар магазина. Изображение загружается через multipart/form-data.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Red Nickname' },
        currency: { type: 'string', example: 'virtual' },
        price: { type: 'number', example: 1000 },
        status: { type: 'string', example: 'in_stock' },
        item_template_id: { type: 'number', example: 1 },
        image: { type: 'string', format: 'binary' },
      },
      required: ['name', 'currency', 'price', 'item_template_id', 'image'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Возвращает созданный товар магазина',
  })
  async create(
    @Body() createShopItemDto: CreateShopItemDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<ShopItem> {
    return this.shopItemService.create(createShopItemDto, image);
  }

  @Patch(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @InvalidateCache('shop-item::id', 'shop-item:list')
  @ApiOperation({
    summary: 'Обновить товар магазина',
    description:
      'Обновляет информацию о товаре магазина. Изображение опционально, загружается через multipart/form-data.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Red Nickname' },
        currency: { type: 'string', example: 'virtual' },
        price: { type: 'number', example: 1000 },
        status: { type: 'string', example: 'in_stock' },
        item_template_id: { type: 'number', example: 1 },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Возвращает обновленный товар магазина',
  })
  async update(
    @Param('id') id: string,
    @Body() updateShopItemDto: UpdateShopItemDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ShopItem> {
    return this.shopItemService.update(+id, updateShopItemDto, image);
  }

  @Delete(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @InvalidateCache('shop-item::id', 'shop-item:list')
  @ApiOperation({ summary: 'Удалить аксессуар' })
  @ApiResponse({ status: 200, description: 'Аксессуар успешно удален' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.shopItemService.remove(+id);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Купить аксессуар',
    description:
      'Покупает аксессуар за виртуальную валюту. В зависимости от типа продукта аксессуара: GUARD - создает стража с указанной силой, SHIELD - создает UserBoost и продлевает время действия щита (с проверкой кулдауна PURCHASE_SHIELD_COOLDOWN), NICKNAME_COLOR/NICKNAME_ICON/AVATAR_FRAME - сохраняет значение в профиль пользователя и создает запись UserAccessory.',
  })
  @ApiBody({ type: PurchaseShopItemDto })
  @ApiResponse({
    status: 200,
    description: 'Аксессуар успешно куплен',
    schema: {
      examples: {
        guard: {
          value: {
            user: { id: 1, money: 5000 },
            created_guard: {
              id: 10,
              name: 'Guard #1234567890',
              strength: 50,
              is_first: false,
            },
          },
          description: 'При покупке аксессуара типа GUARD',
        },
        shield: {
          value: {
            user: {
              id: 1,
              money: 5000,
              shield_end_time: '2024-01-02T08:00:00.000Z',
            },
          },
          description: 'При покупке аксессуара типа SHIELD',
        },
        accessory: {
          value: {
            user: { id: 1, money: 5000, nickname_color: 'red' },
            user_accessory: {
              id: 1,
              name: 'Red Nickname',
              product: { type: 'nickname_color' },
            },
          },
          description:
            'При покупке аксессуара типа NICKNAME_COLOR/NICKNAME_ICON/AVATAR_FRAME',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Недостаточно средств, аксессуар недоступен, кулдаун на покупку щита активен',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({
    status: 404,
    description: 'Аксессуар или пользователь не найден',
  })
  async purchase(
    @Request() req,
    @Body() purchaseShopItemDto: PurchaseShopItemDto,
  ) {
    return this.shopItemService.purchase(
      req.user.id,
      purchaseShopItemDto.shop_item_id,
    );
  }
}
