import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserStatus } from './enums/user-status.enum';
import { Clan } from '../clan/entities/clan.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserBoost } from '../user-boost/user-boost.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', unique: true })
  vk_id: number;

  @Column({ type: 'varchar' })
  first_name: string;

  @Column({ type: 'varchar', nullable: true })
  last_name?: string | null;

  @Column({ type: 'integer' })
  sex: number;

  @Column({ type: 'varchar' })
  avatar_url: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  birthday_date: string | null;

  @Column({ type: 'bigint', default: 0 })
  money: number;

  @Column({ type: 'timestamp', nullable: true })
  shield_end_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_shield_purchase_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_training_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_contract_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_attack_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  clan_leave_time?: Date;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.WAITING,
  })
  status: UserStatus;

  @CreateDateColumn()
  registered_at: Date;

  @Column({ type: 'timestamp' })
  last_login_at: Date;

  @Column({ type: 'int', nullable: true })
  clan_id: number | null;

  @ManyToOne(() => Clan, (clan) => clan.members)
  @JoinColumn({ name: 'clan_id' })
  clan?: Clan;

  @OneToMany(() => UserGuard, (userGuard) => userGuard.user)
  guards?: UserGuard[];

  @OneToMany(() => UserBoost, (userBoost) => userBoost.user)
  boosts?: UserBoost[];

  @OneToMany(() => UserAccessory, (userAccessory) => userAccessory.user)
  accessories?: UserAccessory[];

  @ManyToOne(() => User, (user) => user.referrals, { nullable: true })
  referrer?: User;

  @OneToMany(() => User, (user) => user.referrer)
  referrals?: User[];

  @Column({ type: 'uuid', unique: true, nullable: true })
  referral_link_id?: string;
}
