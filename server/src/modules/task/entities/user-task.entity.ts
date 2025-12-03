import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { Task } from './task.entity';
import { UserTaskStatus } from '../enums/user-task-status.enum';

@Entity()
@Index(['user_id'])
@Index(['user_id', 'task_id'])
export class UserTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({
    type: 'enum',
    enum: UserTaskStatus,
    default: UserTaskStatus.IN_PROGRESS,
  })
  status: UserTaskStatus;

  @Column({ type: 'int' })
  user_id: number;

  @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  task_id: number;

  @ManyToOne(() => Task, (task) => task.user_tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
