import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskType } from '../enums/task-type.enum';
import { UserTask } from './user-task.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskType,
  })
  type: TaskType;

  @Column({ type: 'varchar', nullable: true })
  value: string | null;

  @Column({ type: 'bigint', default: 0 })
  money_reward: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => UserTask, (userTask) => userTask.task)
  user_tasks?: UserTask[];
}
