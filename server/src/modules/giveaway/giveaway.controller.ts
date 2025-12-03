import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiCookieAuth,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { GiveawayService } from './giveaway.service';
import { GiveawayResponseDto } from './dtos/responses/giveaway-response.dto';
import { CreateGiveawayDto } from './dtos/create-giveaway.dto';
import { UpdateGiveawayDto } from './dtos/update-giveaway.dto';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Giveaways')
@Controller()
export class GiveawayController {
  constructor(private readonly giveawayService: GiveawayService) {}

  @Get('available-giveaway')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить доступный конкурс (Для Mini App)',
    description:
      'Возвращает активный конкурс, если он существует. Может быть только один активный конкурс.',
  })
  @ApiResponse({
    status: 200,
    type: GiveawayResponseDto,
    description: 'Информация о доступном конкурсе или null, если конкурса нет',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async findAvailable(): Promise<GiveawayResponseDto | null> {
    return this.giveawayService.findAvailable();
  }

  @Get('giveaways')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Получить конкурс (для админ-панели)',
    description: 'Возвращает текущий конкурс для админ-панели',
  })
  @ApiResponse({
    status: 200,
    type: GiveawayResponseDto,
    description: 'Информация о конкурсе или null, если конкурса нет',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async findOne(): Promise<GiveawayResponseDto | null> {
    return this.giveawayService.findOne();
  }

  @Post('giveaways')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Создать новый конкурс',
    description:
      'Создает новый конкурс. Может быть только один активный конкурс одновременно.',
  })
  @ApiBody({ type: CreateGiveawayDto })
  @ApiResponse({
    status: 201,
    type: GiveawayResponseDto,
    description: 'Конкурс успешно создан',
  })
  @ApiResponse({
    status: 400,
    description:
      'Конкурс уже существует (может быть только один) или неверные данные',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async create(
    @Body() createGiveawayDto: CreateGiveawayDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<GiveawayResponseDto> {
    return this.giveawayService.create(createGiveawayDto, image);
  }

  @Patch('giveaways/:id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Обновить конкурс' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID конкурса',
  })
  @ApiBody({ type: UpdateGiveawayDto })
  @ApiResponse({
    status: 200,
    type: GiveawayResponseDto,
    description: 'Конкурс успешно обновлен',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Конкурс не найден' })
  async update(
    @Param('id') id: string,
    @Body() updateGiveawayDto: UpdateGiveawayDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<GiveawayResponseDto> {
    return this.giveawayService.update(+id, updateGiveawayDto, image);
  }

  @Delete('giveaways/:id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Удалить конкурс' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID конкурса',
  })
  @ApiResponse({
    status: 200,
    description: 'Конкурс успешно удален',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Конкурс не найден' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.giveawayService.remove(+id);
  }
}
