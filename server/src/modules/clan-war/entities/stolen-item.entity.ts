import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
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

  @Column({ type: 'int' })
  clan_war_id: number;

  @ManyToOne(() => ClanWar, clanWar => clanWar.stolen_items)
  @JoinColumn({ name: 'clan_war_id' })
  clan_war: ClanWar;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

