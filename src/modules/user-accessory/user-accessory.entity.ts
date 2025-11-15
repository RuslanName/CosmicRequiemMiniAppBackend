import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import {User} from "../user/user.entity";
import {Accessory} from "../accessory/accessory.entity";
import {Currency} from "../../common/enums/currency.enum";
import {Product} from "../product/product.entity";

@Entity()
export class UserAccessory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    name: string;

    @Column({
        type: 'enum',
        enum: Currency
    })
    currency: Currency;

    @Column({ type: 'bigint' })
    price: number;

    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => Product)
    product: Product;

    @ManyToOne(() => Accessory, { nullable: true })
    accessory?: Accessory;

    @CreateDateColumn()
    created_at: Date;
}

