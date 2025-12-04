import {
  AfterLoad,
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
import { User } from '../../user/user.entity';
import { ClanWar } from '../../clan-war/entities/clan-war.entity';

@Entity()
@Index(['leader_id'])
@Index(['strength'])
@Index(['guards_count'])
@Index(['strength', 'guards_count'])
export class Clan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'integer', default: 50 })
  max_members: number;

  @Column({ type: 'varchar' })
  image_path: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => User, (user) => user.clan)
  members: User[];

  @Column({ type: 'int', nullable: true })
  leader_id: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'leader_id' })
  leader: User;

  @OneToMany(() => ClanWar, (clanWar) => clanWar.clan_1)
  _wars_1?: ClanWar[];

  @OneToMany(() => ClanWar, (clanWar) => clanWar.clan_2)
  _wars_2?: ClanWar[];

  wars: ClanWar[];

  @Column({ type: 'uuid', unique: true, nullable: true })
  referral_link_id?: string;

  @Column({ type: 'bigint', unique: true })
  vk_group_id: number;

  @Column({ type: 'bigint', default: 0 })
  strength: number;

  @Column({ type: 'int', default: 0 })
  guards_count: number;

  @Column({ type: 'int', default: 0 })
  members_count: number;

  @AfterLoad()
  combineWars() {
    this.wars = [...(this._wars_1 || []), ...(this._wars_2 || [])];
    delete this._wars_1;
    delete this._wars_2;
  }
}
