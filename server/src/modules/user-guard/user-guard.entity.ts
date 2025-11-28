import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class UserGuard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'bigint', default: 0 })
  strength: number;

  @Column({ type: 'boolean', default: false })
  is_first: boolean;

  @Column({ type: 'int' })
  user_id: number;

  @ManyToOne(() => User, (user) => user.guards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', nullable: true })
  guard_as_user_id: number | null;

  @OneToOne(() => User, (user) => user.user_as_guard, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'guard_as_user_id' })
  guard_as_user?: User | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
