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
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { TaskService } from './services/task.service';
import { TaskResponseDto } from './dtos/responses/user-task-response.dto';
import { CreateTaskDto } from './dtos/create-task.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(AdminJwtAuthGuard)
@ApiCookieAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все задания с пагинацией' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: PaginatedResponseDto<TaskResponseDto>,
    description: 'Список заданий с пагинацией',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<TaskResponseDto>> {
    return this.taskService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить задание по ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID задания' })
  @ApiResponse({
    status: 200,
    type: TaskResponseDto,
    description: 'Информация о задании',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  async findOne(@Param('id') id: string): Promise<TaskResponseDto> {
    return this.taskService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать новое задание' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({
    status: 201,
    type: TaskResponseDto,
    description: 'Задание успешно создано',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async create(@Body() createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    return this.taskService.create(createTaskDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить задание' })
  @ApiParam({ name: 'id', type: Number, description: 'ID задания' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({
    status: 200,
    type: TaskResponseDto,
    description: 'Задание успешно обновлено',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.taskService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить задание' })
  @ApiParam({ name: 'id', type: Number, description: 'ID задания' })
  @ApiResponse({
    status: 200,
    description: 'Задание успешно удалено',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.taskService.remove(+id);
  }
}
