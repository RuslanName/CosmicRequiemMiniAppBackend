import {Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {UserStatus} from "./enums/user-status.enum";
import {Clan} from "../clan/entities/clan.entity";
import {UserRole} from "./enums/user-role.enum";
import {UserGuard} from "../user-guard/user-guard.entity";

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

    @Column({ type: 'varchar', nullable: true })
    nickname_color?: string;

    @Column({ type: 'varchar', nullable: true })
    nickname_icon?: string;

    @Column({ type: 'varchar', nullable: true })
    avatar_frame?: string;

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
        enum: UserRole,
        default: UserRole.USER
    })
    role: UserRole;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.WAITING
    })
    status: UserStatus;

    @CreateDateColumn()
    registered_at: Date;

    @Column({ type: 'timestamp' })
    last_login_at: Date;

    @ManyToOne(() => Clan, clan => clan.members)
    clan?: Clan;

    @OneToMany(() => UserGuard, userGuard => userGuard.user)
    guards?: UserGuard[];
}