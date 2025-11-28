import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Kit } from '../kit/kit.entity';

@Entity()
@Unique(['user', 'kit'])
export class UserKit {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Kit, { onDelete: 'CASCADE' })
  kit: Kit;

  @CreateDateColumn()
  created_at: Date;
}
