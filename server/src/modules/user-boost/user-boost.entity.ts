import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { UserBoostType } from './enums/user-boost-type.enum';
import { UserBoostStatus } from './enums/user-boost-status.enum';

@Entity()
export class UserBoost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: UserBoostType,
  })
  type: UserBoostType;

  @Column({
    type: 'enum',
    enum: UserBoostStatus,
    default: UserBoostStatus.ACTIVE,
  })
  status: UserBoostStatus;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  created_at: Date;
}
