import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTask } from '../entities/user-task.entity';
import { Task } from '../entities/task.entity';
import { User } from '../../user/user.entity';
import { TaskType } from '../enums/task-type.enum';
import { UserTaskStatus } from '../enums/user-task-status.enum';

@Injectable()
export class UserTaskService {
  constructor(
    @InjectRepository(UserTask)
    private readonly userTaskRepository: Repository<UserTask>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async initializeTasksForUser(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const tasks = await this.taskRepository.find();

    for (const task of tasks) {
      const existingUserTask = await this.userTaskRepository.findOne({
        where: { user_id: userId, task_id: task.id },
      });

      if (!existingUserTask) {
        const userTask = this.userTaskRepository.create({
          user_id: userId,
          task_id: task.id,
          progress: 0,
          status: UserTaskStatus.IN_PROGRESS,
        });
        await this.userTaskRepository.save(userTask);
      }
    }
  }

  async updateTaskProgress(
    userId: number,
    taskType: TaskType,
    increment: number = 1,
  ): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { type: taskType },
    });

    if (!task) {
      return;
    }

    let userTask = await this.userTaskRepository.findOne({
      where: {
        user_id: userId,
        task_id: task.id,
      },
      relations: ['user', 'task'],
    });

    if (!userTask) {
      userTask = this.userTaskRepository.create({
        user_id: userId,
        task_id: task.id,
        progress: 0,
        status: UserTaskStatus.IN_PROGRESS,
      });
    }

    if (userTask.status === UserTaskStatus.COMPLETED) {
      return;
    }

    userTask.progress += increment;

    let requiredValue = 1;
    const taskTypeStr = String(task.type);
    if (task.type === TaskType.COMMUNITY_SUBSCRIBE || taskTypeStr === 'community_subscribe') {
      requiredValue = 1;
    } else if (task.value) {
      const parsedValue = parseInt(task.value, 10);
      requiredValue = isNaN(parsedValue) ? 1 : parsedValue;
    }

    if (userTask.progress >= requiredValue) {
      userTask.status = UserTaskStatus.COMPLETED;
      userTask.progress = requiredValue;

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (user) {
        user.money = Number(user.money) + Number(task.money_reward);
        await this.userRepository.save(user);
      }
    }

    await this.userTaskRepository.save(userTask);
  }

  async getUserTasks(userId: number): Promise<UserTask[]> {
    return this.userTaskRepository.find({
      where: { user_id: userId },
      relations: ['task'],
      order: { created_at: 'DESC' },
    });
  }

  async updateTaskProgressByTaskId(
    userId: number,
    taskId: number,
    increment: number = 1,
  ): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    let userTask = await this.userTaskRepository.findOne({
      where: {
        user_id: userId,
        task_id: task.id,
      },
      relations: ['user', 'task'],
    });

    if (!userTask) {
      userTask = this.userTaskRepository.create({
        user_id: userId,
        task_id: task.id,
        progress: 0,
        status: UserTaskStatus.IN_PROGRESS,
      });
    }

    if (userTask.status === UserTaskStatus.COMPLETED) {
      return;
    }

    userTask.progress += increment;

    let requiredValue = 1;
    const taskTypeStr = String(task.type);
    if (task.type === TaskType.COMMUNITY_SUBSCRIBE || taskTypeStr === 'community_subscribe') {
      requiredValue = 1;
    } else if (task.value) {
      const parsedValue = parseInt(task.value, 10);
      requiredValue = isNaN(parsedValue) ? 1 : parsedValue;
    }

    if (userTask.progress >= requiredValue) {
      userTask.status = UserTaskStatus.COMPLETED;
      userTask.progress = requiredValue;

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (user) {
        user.money = Number(user.money) + Number(task.money_reward);
        await this.userRepository.save(user);
      }
    }

    await this.userTaskRepository.save(userTask);
  }
}
