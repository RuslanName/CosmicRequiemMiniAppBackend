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
import { ClanApplicationStatus } from '../enums/clan-application.enum';
import { User } from '../../user/user.entity';
import { Clan } from './clan.entity';

@Entity()
@Index(['user_id'])
@Index(['clan_id'])
@Index(['user_id', 'clan_id', 'status'])
export class ClanApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  clan_id: number;

  @ManyToOne(() => Clan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clan_id' })
  clan: Clan;

  @Column({
    type: 'enum',
    enum: ClanApplicationStatus,
    default: ClanApplicationStatus.PENDING,
  })
  status: ClanApplicationStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
