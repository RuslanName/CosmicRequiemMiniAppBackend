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
import { KitService } from './kit.service';
import { KitResponseDto } from './dtos/responses/kit-response.dto';
import { CreateKitDto } from './dtos/create-kit.dto';
import { UpdateKitDto } from './dtos/update-kit.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { KitPurchaseResponseDto } from './dtos/responses/kit-purchase-response.dto';
import { PurchaseKitDto } from './dtos/purchase-kit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CacheTTL, CacheKey } from '../../common/decorators/cache.decorator';

@ApiTags('Kits')
@Controller('kits')
export class KitController {
  constructor(private readonly kitService: KitService) {}

  @Get()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Получить все наборы с пагинацией' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: PaginatedResponseDto<KitResponseDto>,
    description: 'Список наборов с пагинацией',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<KitResponseDto>> {
    return this.kitService.findAll(paginationDto);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('kit:public-list:page::page:limit::limit')
  @ApiOperation({ summary: 'Получить список доступных наборов (Для Mini App)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: PaginatedResponseDto<KitResponseDto>,
    description: 'Список доступных наборов с пагинацией',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getKitsList(
    @Request() req: AuthenticatedRequest,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<KitResponseDto>> {
    return this.kitService.findAvailable(req.user.id, paginationDto);
  }

  @Get(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Получить набор по ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID набора' })
  @ApiResponse({
    status: 200,
    type: KitResponseDto,
    description: 'Информация о наборе',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Набор не найден' })
  async findOne(@Param('id') id: string): Promise<KitResponseDto> {
    return this.kitService.findOne(+id);
  }

  @Post()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Создать новый набор' })
  @ApiBody({ type: CreateKitDto })
  @ApiResponse({
    status: 201,
    type: KitResponseDto,
    description: 'Набор успешно создан',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async create(@Body() createKitDto: CreateKitDto): Promise<KitResponseDto> {
    return this.kitService.create(createKitDto);
  }

  @Patch(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Обновить набор' })
  @ApiParam({ name: 'id', type: Number, description: 'ID набора' })
  @ApiBody({ type: UpdateKitDto })
  @ApiResponse({
    status: 200,
    type: KitResponseDto,
    description: 'Набор успешно обновлен',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Набор не найден' })
  async update(
    @Param('id') id: string,
    @Body() updateKitDto: UpdateKitDto,
  ): Promise<KitResponseDto> {
    return this.kitService.update(+id, updateKitDto);
  }

  @Delete(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Удалить набор' })
  @ApiParam({ name: 'id', type: Number, description: 'ID набора' })
  @ApiResponse({
    status: 200,
    description: 'Набор успешно удален',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Набор не найден' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.kitService.remove(+id);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Купить набор (Для Mini App)',
    description:
      'Покупка набора за виртуальную валюту или голоса VK. В зависимости от валюты набора списываются соответствующие средства.',
  })
  @ApiBody({ type: PurchaseKitDto })
  @ApiResponse({
    status: 200,
    type: KitPurchaseResponseDto,
    description: 'Набор успешно куплен',
  })
  @ApiResponse({
    status: 400,
    description: 'Недостаточно средств, набор недоступен или неверная валюта',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Набор или пользователь не найден' })
  async purchase(
    @Request() req: AuthenticatedRequest,
    @Body() purchaseKitDto: PurchaseKitDto,
  ): Promise<KitPurchaseResponseDto> {
    return this.kitService.purchase(req.user.id, purchaseKitDto.kit_id);
  }
}
