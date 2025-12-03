import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClanWarStatus } from '../enums/clan-war-status.enum';
import { Clan } from '../../clan/entities/clan.entity';
import { StolenItem } from './stolen-item.entity';

@Entity()
@Index(['clan_1_id'])
@Index(['clan_2_id'])
@Index(['status'])
@Index(['end_time', 'status'])
export class ClanWar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  start_time: Date;

  @Column({ type: 'timestamp' })
  end_time: Date;

  @Column({
    type: 'enum',
    enum: ClanWarStatus,
    default: ClanWarStatus.IN_PROGRESS,
  })
  status: ClanWarStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'int' })
  clan_1_id: number;

  @ManyToOne(() => Clan, (clan) => clan.wars, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clan_1_id' })
  clan_1: Clan;

  @Column({ type: 'int' })
  clan_2_id: number;

  @ManyToOne(() => Clan, (clan) => clan.wars, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clan_2_id' })
  clan_2: Clan;

  @OneToMany(() => StolenItem, (stolenItem) => stolenItem.clan_war)
  stolen_items?: StolenItem[];
}
