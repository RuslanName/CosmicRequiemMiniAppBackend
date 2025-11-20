import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiCookieAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Admin } from './admin.entity';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { UpdateAdminDto } from './dtos/update-admin.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

@ApiTags('Admins')
@Controller('admins')
@UseGuards(AdminJwtAuthGuard)
@ApiCookieAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Получить всех администраторов с пагинацией' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает список администраторов с пагинацией',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<{ data: Admin[]; total: number; page: number; limit: number }> {
    return this.adminService.findAll(paginationDto);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Получить текущего аутентифицированного администратора',
  })
  @ApiResponse({
    status: 200,
    description: 'Возвращает текущего администратора',
  })
  async findMe(@Request() req): Promise<Admin> {
    return this.adminService.findOne(req.user.adminId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить администратора по ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID администратора' })
  @ApiResponse({ status: 200, description: 'Возвращает администратора' })
  @ApiResponse({ status: 404, description: 'Администратор не найден' })
  async findOne(@Param('id') id: string): Promise<Admin> {
    return this.adminService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать нового администратора' })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({ status: 201, description: 'Администратор успешно создан' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  async create(@Body() createAdminDto: CreateAdminDto): Promise<Admin> {
    return this.adminService.create(createAdminDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить администратора' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID администратора' })
  @ApiBody({ type: UpdateAdminDto })
  @ApiResponse({ status: 200, description: 'Администратор успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Администратор не найден' })
  async update(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<Admin> {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить администратора' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID администратора' })
  @ApiResponse({ status: 200, description: 'Администратор успешно удален' })
  @ApiResponse({ status: 404, description: 'Администратор не найден' })
  async remove(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.adminService.remove(+id);
    return {
      success: true,
      message: 'Admin deleted successfully',
    };
  }
}
