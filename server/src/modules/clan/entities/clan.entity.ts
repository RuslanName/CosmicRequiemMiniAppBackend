import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClanStatus } from '../enums/clan-status.enum';
import { User } from '../../user/user.entity';
import { ClanWar } from '../../clan-war/entities/clan-war.entity';

@Entity()
export class Clan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'integer', default: 50 })
  max_members: number;

  @Column({ type: 'varchar' })
  image_path: string;

  @Column({
    type: 'enum',
    enum: ClanStatus,
    default: ClanStatus.ACTIVE,
  })
  status: ClanStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => User, (user) => user.clan)
  members: User[];

  @Column({ type: 'int', nullable: true })
  leader_id: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'leader_id' })
  leader: User;

  @OneToMany(() => ClanWar, (clanWar) => clanWar.clan_1)
  _wars_1?: ClanWar[];

  @OneToMany(() => ClanWar, (clanWar) => clanWar.clan_2)
  _wars_2?: ClanWar[];

  wars: ClanWar[];

  @AfterLoad()
  combineWars() {
    this.wars = [...(this._wars_1 || []), ...(this._wars_2 || [])];
    delete this._wars_1;
    delete this._wars_2;
  }
}
