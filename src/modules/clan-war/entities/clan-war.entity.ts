import {Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {ClanWarStatus} from "../enums/clan-war-status.enum";
import {Clan} from "../../clan/entities/clan.entity";
import {StolenItem} from "./stolen-item.entity";

@Entity()
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
        default: ClanWarStatus.IN_PROGRESS
    })
    status: ClanWarStatus;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @ManyToOne(() => Clan, clan => clan.clan_wars)
    clan_1: Clan;

    @ManyToOne(() => Clan, clan => clan.clan_wars)
    clan_2: Clan;

    @OneToMany(() => StolenItem, stolenItem => stolenItem.clan_war)
    stolen_items?: StolenItem[];
}