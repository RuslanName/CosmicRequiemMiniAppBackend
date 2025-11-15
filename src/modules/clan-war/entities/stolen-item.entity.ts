import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/user.entity';
import { StolenItemType } from '../enums/stolen-item-type.enum';
import { ClanWar } from './clan-war.entity';

@Entity()
export class StolenItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: StolenItemType,
  })
  type: StolenItemType;

  @Column({ type: 'varchar' })
  value: string;

  @ManyToOne(() => User)
  thief: User;

  @ManyToOne(() => User)
  victim: User;

  @ManyToOne(() => ClanWar, clanWar => clanWar.stolen_items)
  clan_war: ClanWar;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

