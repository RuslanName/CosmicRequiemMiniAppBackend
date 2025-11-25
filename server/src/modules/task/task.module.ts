import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { UserTask } from './entities/user-task.entity';
import { TaskController } from './task.controller';
import { TaskService } from './services/task.service';
import { UserTaskService } from './services/user-task.service';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, UserTask, User])],
  controllers: [TaskController],
  providers: [TaskService, UserTaskService],
  exports: [TaskService, UserTaskService],
})
export class TaskModule {}
