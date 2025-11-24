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
import { ItemTemplate } from './item-template.entity';
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
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: [ItemTemplate],
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ItemTemplate>> {
    return this.itemTemplateService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить шаблон предмета по ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Шаблон предмета не найден' })
  async findOne(@Param('id') id: string): Promise<ItemTemplate> {
    return this.itemTemplateService.findOne(+id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Создать новый шаблон предмета' })
  @ApiBody({ type: CreateItemTemplateDto })
  @ApiResponse({
    status: 201,
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async create(
    @Body() createItemTemplateDto: CreateItemTemplateDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ItemTemplate> {
    return this.itemTemplateService.create(createItemTemplateDto, image);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Обновить шаблон предмета' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateItemTemplateDto })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Шаблон предмета не найден' })
  async update(
    @Param('id') id: string,
    @Body() updateItemTemplateDto: UpdateItemTemplateDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ItemTemplate> {
    return this.itemTemplateService.update(+id, updateItemTemplateDto, image);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить шаблон предмета' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Шаблон предмета не найден' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.itemTemplateService.remove(+id);
  }
}
