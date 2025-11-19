import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Currency} from "../../common/enums/currency.enum";
import {AccessoryStatus} from "../accessory/enums/accessory-status.enum";
import {Product} from "../product/product.entity";

@Entity()
export class Kit {
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

    @ManyToMany(() => Product)
    @JoinTable({ name: 'kit_products' })
    products: Product[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}