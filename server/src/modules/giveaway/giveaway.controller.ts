import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiCookieAuth,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GiveawayService } from './giveaway.service';
import { Giveaway } from './giveaway.entity';
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
  })
  @ApiResponse({
    status: 200,
    type: Giveaway,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async findAvailable(): Promise<Giveaway | null> {
    return this.giveawayService.findAvailable();
  }

  @Get('giveaways')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Получить конкурс (для админ-панели)' })
  @ApiResponse({
    status: 200,
    type: Giveaway,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async findOne(): Promise<Giveaway | null> {
    return this.giveawayService.findOne();
  }

  @Post('giveaways')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Создать новый конкурс' })
  @ApiBody({ type: CreateGiveawayDto })
  @ApiResponse({
    status: 201,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({
    status: 400,
    description: 'Конкурс уже существует (может быть только один)',
  })
  async create(
    @Body() createGiveawayDto: CreateGiveawayDto,
  ): Promise<Giveaway> {
    return this.giveawayService.create(createGiveawayDto);
  }

  @Patch('giveaways/:id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Обновить конкурс' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateGiveawayDto })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Конкурс не найден' })
  async update(
    @Param('id') id: string,
    @Body() updateGiveawayDto: UpdateGiveawayDto,
  ): Promise<Giveaway> {
    return this.giveawayService.update(+id, updateGiveawayDto);
  }

  @Delete('giveaways/:id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Удалить конкурс' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Конкурс не найден' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.giveawayService.remove(+id);
  }
}
