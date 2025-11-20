import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Currency } from '../../common/enums/currency.enum';
import { ShopItemStatus } from '../shop-item/enums/shop-item-status.enum';
import { ItemTemplate } from '../item-template/item-template.entity';

@Entity()
export class Kit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({
    type: 'enum',
    enum: Currency,
  })
  currency: Currency;

  @Column({ type: 'bigint' })
  price: number;

  @Column({ type: 'varchar' })
  image_path: string;

  @Column({
    type: 'enum',
    enum: ShopItemStatus,
    default: ShopItemStatus.IN_STOCK,
  })
  status: ShopItemStatus;

  @ManyToMany(() => ItemTemplate)
  @JoinTable({ name: 'kit_item_templates' })
  item_templates: ItemTemplate[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
