import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { ClanApplicationStatus } from "../enums/clan-application.enum";
import { User } from "../../user/user.entity";
import { Clan } from "./clan.entity";

@Entity()
export class ClanApplication {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => Clan)
    clan: Clan;

    @Column({
        type: 'enum',
        enum: ClanApplicationStatus,
        default: ClanApplicationStatus.PENDING
    })
    status: ClanApplicationStatus;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

