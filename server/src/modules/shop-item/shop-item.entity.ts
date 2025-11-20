import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Currency } from '../../common/enums/currency.enum';
import { ShopItemStatus } from './enums/shop-item-status.enum';
import { ItemTemplate } from '../item-template/item-template.entity';

@Entity()
export class ShopItem {
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

  @Column({ type: 'int' })
  item_template_id: number;

  @ManyToOne(() => ItemTemplate)
  item_template: ItemTemplate;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
