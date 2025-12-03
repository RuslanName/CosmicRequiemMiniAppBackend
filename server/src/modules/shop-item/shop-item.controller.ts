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
} from '@nestjs/common';
import { AuthenticatedRequest } from '../../common/types/request.types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { ShopItemService } from './shop-item.service';
import { ShopItemResponseDto } from './dtos/responses/shop-item-response.dto';
import { CreateShopItemDto } from './dtos/create-shop-item.dto';
import { UpdateShopItemDto } from './dtos/update-shop-item.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { ShopItemsListResponseDto } from './dtos/responses/shop-items-list-response.dto';
import { ShopItemPurchaseResponseDto } from './dtos/responses/shop-item-purchase-response.dto';
import { PurchaseShopItemDto } from './dtos/purchase-shop-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CacheTTL, CacheKey } from '../../common/decorators/cache.decorator';

@ApiTags('Shop items')
@Controller('shop-items')
export class ShopItemController {
  constructor(private readonly shopItemService: ShopItemService) {}

  @Get()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Получить все товары магазина с пагинацией' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: PaginatedResponseDto<ShopItemResponseDto>,
    description: 'Список товаров магазина с пагинацией',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ShopItemResponseDto>> {
    return this.shopItemService.findAll(paginationDto);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('shop-item:public-list')
  @ApiOperation({
    summary: 'Получить список доступных товаров по категориям (Для Mini App)',
    description:
      'Пагинация: используйте `page` и `limit` для всех категорий, или `{category}_page` и `{category}_limit` для конкретной категории (например: `guard_page=1&guard_limit=10`)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Общий номер страницы для всех категорий',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Общий лимит для всех категорий',
  })
  @ApiQuery({
    name: '{category}_page',
    required: false,
    type: Number,
    description:
      'Номер страницы для конкретной категории (например: guard_page=1)',
  })
  @ApiQuery({
    name: '{category}_limit',
    required: false,
    type: Number,
    description: 'Лимит для конкретной категории (например: guard_limit=10)',
  })
  @ApiResponse({
    status: 200,
    type: ShopItemsListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getShopItemsList(
    @Query() query: any,
  ): Promise<ShopItemsListResponseDto> {
    return this.shopItemService.findAvailable(query);
  }

  @Get(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Получить товар магазина по ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID товара' })
  @ApiResponse({
    status: 200,
    type: ShopItemResponseDto,
    description: 'Информация о товаре',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async findOne(@Param('id') id: string): Promise<ShopItemResponseDto> {
    return this.shopItemService.findOne(+id);
  }

  @Post()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Создать новый товар магазина' })
  @ApiBody({ type: CreateShopItemDto })
  @ApiResponse({
    status: 201,
    type: ShopItemResponseDto,
    description: 'Товар успешно создан',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async create(
    @Body() createShopItemDto: CreateShopItemDto,
  ): Promise<ShopItemResponseDto> {
    return this.shopItemService.create(createShopItemDto);
  }

  @Patch(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Обновить товар магазина' })
  @ApiParam({ name: 'id', type: Number, description: 'ID товара' })
  @ApiBody({ type: UpdateShopItemDto })
  @ApiResponse({
    status: 200,
    type: ShopItemResponseDto,
    description: 'Товар успешно обновлен',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async update(
    @Param('id') id: string,
    @Body() updateShopItemDto: UpdateShopItemDto,
  ): Promise<ShopItemResponseDto> {
    return this.shopItemService.update(+id, updateShopItemDto);
  }

  @Delete(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Удалить товар магазина' })
  @ApiParam({ name: 'id', type: Number, description: 'ID товара' })
  @ApiResponse({
    status: 200,
    description: 'Товар успешно удален',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.shopItemService.remove(+id);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Купить товар за виртуальную валюту (Для Mini App)',
    description:
      'Покупка товара за виртуальную валюту. Для покупки за голоса VK используйте VK payments.',
  })
  @ApiBody({ type: PurchaseShopItemDto })
  @ApiResponse({
    status: 200,
    type: ShopItemPurchaseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Недостаточно средств, товар недоступен или неверная валюта',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({
    status: 404,
    description: 'Товар или пользователь не найден',
  })
  async purchase(
    @Request() req: AuthenticatedRequest,
    @Body() purchaseShopItemDto: PurchaseShopItemDto,
  ): Promise<ShopItemPurchaseResponseDto> {
    return this.shopItemService.purchase(
      req.user.id,
      purchaseShopItemDto.shop_item_id,
    );
  }
}
