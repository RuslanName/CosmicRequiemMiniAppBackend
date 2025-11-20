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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { UserGuardService } from './user-guard.service';
import { UserGuard } from './user-guard.entity';
import { CreateUserGuardDto } from './dtos/create-user-guard.dto';
import { UpdateUserGuardDto } from './dtos/update-user-guard.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

@ApiTags('UserGuard')
@Controller('user-guards')
@UseGuards(AdminJwtAuthGuard)
@ApiCookieAuth()
export class UserGuardController {
  constructor(private readonly userGuardService: UserGuardService) {}

  @Get()
  @ApiOperation({ summary: 'Получить всех стражей с пагинацией' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает список стражей с пагинацией',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<{
    data: UserGuard[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.userGuardService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить стража по ID' })
  @ApiResponse({ status: 200, description: 'Возвращает стража' })
  async findOne(@Param('id') id: string): Promise<UserGuard> {
    return this.userGuardService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать нового стража' })
  @ApiResponse({ status: 201, description: 'Возвращает созданного стража' })
  async create(
    @Body() createUserGuardDto: CreateUserGuardDto,
  ): Promise<UserGuard> {
    return this.userGuardService.create(createUserGuardDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить стража' })
  @ApiResponse({ status: 200, description: 'Возвращает обновленного стража' })
  async update(
    @Param('id') id: string,
    @Body() updateUserGuardDto: UpdateUserGuardDto,
  ): Promise<UserGuard> {
    return this.userGuardService.update(+id, updateUserGuardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить стража' })
  @ApiResponse({ status: 200, description: 'Страж успешно удален' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.userGuardService.remove(+id);
  }
}
