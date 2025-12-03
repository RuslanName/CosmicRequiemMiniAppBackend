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
  ApiCookieAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Express } from 'express';
import { ItemTemplateService } from './item-template.service';
import { ItemTemplateResponseDto } from './dtos/responses/item-template-response.dto';
import { CreateItemTemplateDto } from './dtos/create-item-template.dto';
import { UpdateItemTemplateDto } from './dtos/update-item-template.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';

@ApiTags('Item Templates')
@Controller('item-templates')
@UseGuards(AdminJwtAuthGuard)
@ApiCookieAuth()
export class ItemTemplateController {
  constructor(private readonly itemTemplateService: ItemTemplateService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все шаблоны предметов с пагинацией' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: PaginatedResponseDto<ItemTemplateResponseDto>,
    description: 'Список шаблонов предметов с пагинацией',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ItemTemplateResponseDto>> {
    return this.itemTemplateService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить шаблон предмета по ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID шаблона предмета',
  })
  @ApiResponse({
    status: 200,
    type: ItemTemplateResponseDto,
    description: 'Информация о шаблоне предмета',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Шаблон предмета не найден' })
  async findOne(@Param('id') id: string): Promise<ItemTemplateResponseDto> {
    return this.itemTemplateService.findOne(+id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Создать новый шаблон предмета' })
  @ApiBody({ type: CreateItemTemplateDto })
  @ApiResponse({
    status: 201,
    type: ItemTemplateResponseDto,
    description: 'Шаблон предмета успешно создан',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные или файл изображения',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async create(
    @Body() createItemTemplateDto: CreateItemTemplateDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ItemTemplateResponseDto> {
    return this.itemTemplateService.create(createItemTemplateDto, image);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Обновить шаблон предмета' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID шаблона предмета',
  })
  @ApiBody({ type: UpdateItemTemplateDto })
  @ApiResponse({
    status: 200,
    type: ItemTemplateResponseDto,
    description: 'Шаблон предмета успешно обновлен',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные или файл изображения',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Шаблон предмета не найден' })
  async update(
    @Param('id') id: string,
    @Body() updateItemTemplateDto: UpdateItemTemplateDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ItemTemplateResponseDto> {
    return this.itemTemplateService.update(+id, updateItemTemplateDto, image);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить шаблон предмета' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID шаблона предмета',
  })
  @ApiResponse({
    status: 200,
    description: 'Шаблон предмета успешно удален',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Шаблон предмета не найден' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.itemTemplateService.remove(+id);
  }
}
