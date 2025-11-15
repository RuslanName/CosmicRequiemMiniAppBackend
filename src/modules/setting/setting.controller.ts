import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingService } from './services/setting.service';
import { Setting } from './setting.entity';
import { UpdateSettingDto } from './dtos/update-setting.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { CacheTTL, CacheKey, InvalidateCache } from '../../common/decorators/cache.decorator';

@ApiTags('Setting')
@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  @CacheTTL(3600)
  @CacheKey('setting:list')
  @ApiOperation({ summary: 'Получить все настройки с пагинацией' })
  @ApiResponse({ status: 200, description: 'Возвращает список настроек с пагинацией' })
  async findAll(@Query() paginationDto: PaginationDto): Promise<{ data: Setting[]; total: number; page: number; limit: number }> {
    return this.settingService.findAll(paginationDto);
  }

  @Get(':id')
  @CacheTTL(3600)
  @CacheKey('setting::id')
  @ApiOperation({ summary: 'Получить настройку по ID' })
  @ApiResponse({ status: 200, description: 'Возвращает настройку' })
  async findOne(@Param('id') id: string): Promise<Setting> {
    return this.settingService.findOne(+id);
  }

  @Get('key/:key')
  @CacheTTL(3600)
  @CacheKey('setting:key::key')
  @ApiOperation({ summary: 'Получить настройку по ключу' })
  @ApiResponse({ status: 200, description: 'Возвращает настройку по ключу' })
  async findByKey(@Param('key') key: string): Promise<Setting | null> {
    return this.settingService.findByKey(key);
  }

  @Patch(':id')
  @InvalidateCache('setting::id', 'setting:key:*', 'setting:list')
  @ApiOperation({ summary: 'Обновить настройку' })
  @ApiResponse({ status: 200, description: 'Возвращает обновленную настройку' })
  async update(@Param('id') id: string, @Body() updateSettingDto: UpdateSettingDto): Promise<Setting> {
    return this.settingService.update(+id, updateSettingDto);
  }
}