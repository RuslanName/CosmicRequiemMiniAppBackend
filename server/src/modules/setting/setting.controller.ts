import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SettingService } from './services/setting.service';
import { SettingResponseDto } from './dtos/responses/setting-response.dto';
import { UpdateSettingDto } from './dtos/update-setting.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';

@ApiTags('Settings')
@Controller('settings')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Получить все настройки с пагинацией' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Возвращает список настроек с пагинацией',
    type: PaginatedResponseDto<SettingResponseDto>,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<SettingResponseDto>> {
    return this.settingService.findAll(paginationDto);
  }

  @Get('key/:key')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Получить настройку по ключу' })
  @ApiParam({
    name: 'key',
    type: String,
    description: 'Ключ настройки',
  })
  @ApiResponse({
    status: 200,
    type: SettingResponseDto,
    description: 'Настройка по указанному ключу',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Настройка не найдена' })
  async findByKey(@Param('key') key: string): Promise<SettingResponseDto | null> {
    return this.settingService.findByKey(key);
  }

  @Get(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Получить настройку по ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID настройки',
  })
  @ApiResponse({
    status: 200,
    type: SettingResponseDto,
    description: 'Информация о настройке',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Настройка не найдена' })
  async findOne(@Param('id') id: string): Promise<SettingResponseDto> {
    return this.settingService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Обновить настройку' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID настройки',
  })
  @ApiBody({ type: UpdateSettingDto })
  @ApiResponse({
    status: 200,
    type: SettingResponseDto,
    description: 'Настройка успешно обновлена',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Настройка не найдена' })
  async update(
    @Param('id') id: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ): Promise<SettingResponseDto> {
    return this.settingService.update(+id, updateSettingDto);
  }
}
