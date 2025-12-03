import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserStatus } from './enums/user-status.enum';
import { Clan } from '../clan/entities/clan.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserBoost } from '../user-boost/user-boost.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';
import { UserTask } from '../task/entities/user-task.entity';

@Entity()
@Index(['clan_id'])
@Index(['status'])
@Index(['referrerId'])
@Index(['strength'])
@Index(['guards_count'])
@Index(['referrals_count'])
@Index(['strength', 'guards_count'])
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

  @Column({ type: 'varchar', nullable: true })
  image_path: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  birthday_date: string | null;

  @Column({ type: 'bigint', default: 0 })
  money: number;

  @Column({ type: 'bigint', default: 0 })
  strength: number;

  @Column({ type: 'int', default: 0 })
  guards_count: number;

  @Column({ type: 'int', default: 0 })
  referrals_count: number;

  @Column({ type: 'timestamp', nullable: true })
  last_training_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_contract_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_attack_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  clan_leave_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  adv_disable_end_time?: Date;

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

  @ManyToOne(() => Clan, (clan) => clan.members, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clan_id' })
  clan?: Clan;

  @OneToMany(() => UserGuard, (userGuard) => userGuard.user)
  guards?: UserGuard[];

  @OneToMany(() => UserBoost, (userBoost) => userBoost.user)
  boosts?: UserBoost[];

  @OneToMany(() => UserAccessory, (userAccessory) => userAccessory.user)
  accessories?: UserAccessory[];

  @OneToMany(() => UserTask, (userTask) => userTask.user)
  tasks?: UserTask[];

  @Column({ type: 'int', nullable: true })
  referrerId: number | null;

  @ManyToOne(() => User, (user) => user.referrals, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'referrerId' })
  referrer?: User;

  @OneToMany(() => User, (user) => user.referrer)
  referrals?: User[];

  @Column({ type: 'uuid', unique: true, nullable: true })
  referral_link_id?: string;

  @Column({ type: 'int', nullable: true })
  user_as_guard_id: number | null;

  @OneToOne(() => UserGuard, (guard) => guard.guard_as_user, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  @JoinColumn({ name: 'user_as_guard_id' })
  user_as_guard?: UserGuard | null;
}
