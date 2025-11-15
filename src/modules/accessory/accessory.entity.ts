import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Currency} from "../../common/enums/currency.enum";
import {AccessoryStatus} from "./enums/accessory-status.enum";
import {Product} from "../product/product.entity";

@Entity()
export class Accessory {
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

    @Column({
        type: 'enum',
        enum: AccessoryStatus,
        default: AccessoryStatus.IN_STOCK
    })
    status: AccessoryStatus;

    @ManyToOne(() => Product)
    product: Product;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}