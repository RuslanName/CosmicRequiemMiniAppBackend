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

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<TaskResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .select([
        'task.id',
        'task.description',
        'task.type',
        'task.value',
        'task.money_reward',
      ])
      .orderBy('task.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [tasks, total] = await queryBuilder.getManyAndCount();

    return {
      data: tasks.map((task) => ({
        id: task.id,
        description: task.description,
        type: task.type,
        value: task.value,
        money_reward: task.money_reward,
      })),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<TaskResponseDto> {
    const task = await this.taskRepository
      .createQueryBuilder('task')
      .select([
        'task.id',
        'task.description',
        'task.type',
        'task.value',
        'task.money_reward',
      ])
      .where('task.id = :id', { id })
      .getOne();

    if (!task) {
      throw new NotFoundException(`Задача с ID ${id} не найдена`);
    }

    return {
      id: task.id,
      description: task.description,
      type: task.type,
      value: task.value,
      money_reward: task.money_reward,
    };
  }

  async create(createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = this.taskRepository.create(createTaskDto);
    const savedTask = await this.taskRepository.save(task);
    return {
      id: savedTask.id,
      description: savedTask.description,
      type: savedTask.type,
      value: savedTask.value,
      money_reward: savedTask.money_reward,
    };
  }

  async update(
    id: number,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Задача с ID ${id} не найдена`);
    }

    Object.assign(task, updateTaskDto);
    const savedTask = await this.taskRepository.save(task);
    return {
      id: savedTask.id,
      description: savedTask.description,
      type: savedTask.type,
      value: savedTask.value,
      money_reward: savedTask.money_reward,
    };
  }

  async remove(id: number): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Задача с ID ${id} не найдена`);
    }

    await this.taskRepository.remove(task);
  }
}
