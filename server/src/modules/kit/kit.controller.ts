import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { KitService } from './kit.service';
import { Kit } from './kit.entity';
import { CreateKitDto } from './dtos/create-kit.dto';
import { UpdateKitDto } from './dtos/update-kit.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PurchaseKitDto } from './dtos/purchase-kit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CacheTTL, CacheKey, InvalidateCache } from '../../common/decorators/cache.decorator';

@ApiTags('Kit')
@Controller('kits')
export class KitController {
  constructor(private readonly kitService: KitService) {}

  @Get()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @CacheTTL(180)
  @CacheKey('kit:list')
  @ApiOperation({ 
    summary: 'Получить все наборы с пагинацией',
    description: 'Возвращает список всех доступных наборов с поддержкой пагинации. Каждый набор содержит несколько продуктов, которые будут применены при покупке.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы (по умолчанию 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество элементов на странице (по умолчанию 10)', example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: 'Список наборов успешно возвращен',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Premium Kit',
            currency: 'virtual',
            price: 5000,
            status: 'in_stock',
            products: [
              { id: 1, type: 'nickname_color', value: 'red' },
              { id: 2, type: 'guard', value: '100' }
            ]
          }
        ],
        total: 20,
        page: 1,
        limit: 10
      }
    }
  })
  async findAll(@Query() paginationDto: PaginationDto): Promise<{ data: Kit[]; total: number; page: number; limit: number }> {
    return this.kitService.findAll(paginationDto);
  }

  @Get(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @CacheTTL(300)
  @CacheKey('kit::id')
  @ApiOperation({ 
    summary: 'Получить набор по ID',
    description: 'Возвращает полную информацию о наборе по его идентификатору, включая все продукты, входящие в набор.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID набора', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Набор успешно возвращен',
    schema: {
      example: {
        id: 1,
        name: 'Premium Kit',
        currency: 'virtual',
        price: 5000,
        status: 'in_stock',
        products: [
          {
            id: 1,
            name: 'Red Nickname',
            type: 'nickname_color',
            value: 'red'
          },
          {
            id: 2,
            name: 'Strong Guard',
            type: 'guard',
            value: '100'
          }
        ],
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Набор не найден' })
  async findOne(@Param('id') id: string): Promise<Kit> {
    return this.kitService.findOne(+id);
  }

  @Post()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @InvalidateCache('kit:list')
  @ApiOperation({ summary: 'Создать новый набор' })
  @ApiResponse({ status: 201, description: 'Возвращает созданный набор' })
  async create(@Body() createKitDto: CreateKitDto): Promise<Kit> {
    return this.kitService.create(createKitDto);
  }

  @Patch(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @InvalidateCache('kit::id', 'kit:list')
  @ApiOperation({ summary: 'Обновить набор' })
  @ApiResponse({ status: 200, description: 'Возвращает обновленный набор' })
  async update(@Param('id') id: string, @Body() updateKitDto: UpdateKitDto): Promise<Kit> {
    return this.kitService.update(+id, updateKitDto);
  }

  @Delete(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @InvalidateCache('kit::id', 'kit:list')
  @ApiOperation({ summary: 'Удалить набор' })
  @ApiResponse({ status: 200, description: 'Набор успешно удален' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.kitService.remove(+id);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Купить набор',
    description: 'Покупает набор продуктов за виртуальную валюту. Обрабатывает все продукты в наборе: GUARD - создает стражей, SHIELD - продлевает щит (с проверкой кулдауна), NICKNAME_COLOR/NICKNAME_ICON/AVATAR_FRAME - сохраняет в профиль и создает UserAccessory.'
  })
  @ApiBody({
    schema: {
      example: {
        kit_id: 1
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Набор успешно куплен',
    schema: {
      example: {
        user: { id: 1, money: 5000, nickname_color: 'red', shield_end_time: '2024-01-02T08:00:00.000Z' },
        created_guards: [
          { id: 10, name: 'Guard #1234567890', strength: 50, is_first: false }
        ],
        user_accessories: [
          { id: 1, name: 'Premium Kit', product: { type: 'nickname_color' } }
        ]
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Недостаточно средств, набор недоступен, кулдаун на покупку щита активен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Набор или пользователь не найден' })
  async purchase(@Request() req, @Body() purchaseKitDto: PurchaseKitDto) {
    return this.kitService.purchase(req.user.id, purchaseKitDto.kit_id);
  }
}
