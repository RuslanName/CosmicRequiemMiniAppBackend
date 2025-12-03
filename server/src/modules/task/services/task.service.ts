import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { TaskResponseDto } from '../dtos/responses/user-task-response.dto';
import { CreateTaskDto } from '../dtos/create-task.dto';
import { UpdateTaskDto } from '../dtos/update-task.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../../common/dtos/paginated-response.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  private transformToTaskResponseDto(task: Task): TaskResponseDto {
    return {
      id: task.id,
      description: task.description,
      type: task.type,
      value: task.value,
      money_reward: task.money_reward,
      created_at: task.created_at,
      updated_at: task.updated_at,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<TaskResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [tasks, total] = await this.taskRepository.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data: tasks.map((task) => this.transformToTaskResponseDto(task)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException(`Задача с ID ${id} не найдена`);
    }

    return this.transformToTaskResponseDto(task);
  }

  async create(createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = this.taskRepository.create(createTaskDto);
    const savedTask = await this.taskRepository.save(task);
    return this.transformToTaskResponseDto(savedTask);
  }

  async update(id: number, updateTaskDto: UpdateTaskDto): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Задача с ID ${id} не найдена`);
    }

    Object.assign(task, updateTaskDto);
    const savedTask = await this.taskRepository.save(task);
    return this.transformToTaskResponseDto(savedTask);
  }

  async remove(id: number): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Задача с ID ${id} не найдена`);
    }

    await this.taskRepository.remove(task);
  }
}
