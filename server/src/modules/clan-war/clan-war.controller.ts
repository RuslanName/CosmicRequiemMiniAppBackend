import {
  Controller,
  Get,
  Patch,
  Delete,
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
} from '@nestjs/swagger';
import { ClanWarService } from './services/clan-war.service';
import { ClanWar } from './entities/clan-war.entity';
import { UpdateClanWarDto } from './dtos/update-clan-war.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

@ApiTags('ClanWar')
@Controller('wars')
@UseGuards(AdminJwtAuthGuard)
@ApiCookieAuth()
export class ClanWarController {
  constructor(private readonly clanWarService: ClanWarService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все войны с пагинацией' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает список войн с пагинацией',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<{ data: ClanWar[]; total: number; page: number; limit: number }> {
    return this.clanWarService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить войну по ID' })
  @ApiResponse({ status: 200, description: 'Возвращает войну' })
  async findOne(@Param('id') id: string): Promise<ClanWar> {
    return this.clanWarService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить войну' })
  @ApiResponse({ status: 200, description: 'Возвращает обновленную войну' })
  async update(
    @Param('id') id: string,
    @Body() updateClanWarDto: UpdateClanWarDto,
  ): Promise<ClanWar> {
    return this.clanWarService.update(+id, updateClanWarDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить войну' })
  @ApiResponse({ status: 200, description: 'Война успешно удалена' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.clanWarService.remove(+id);
  }
}
