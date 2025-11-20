import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ShopItem } from '../shop-item/shop-item.entity';
import { Currency } from '../../common/enums/currency.enum';
import { ItemTemplate } from '../item-template/item-template.entity';
import { UserAccessoryStatus } from './enums/user-accessory-status.enum';

@Entity()
export class UserAccessory {
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

  @Column({
    type: 'enum',
    enum: UserAccessoryStatus,
    default: UserAccessoryStatus.UNEQUIPPED,
  })
  status: UserAccessoryStatus;

  @ManyToOne(() => User, (user) => user.accessories)
  user: User;

  @ManyToOne(() => ItemTemplate)
  item_template: ItemTemplate;

  @ManyToOne(() => ShopItem, { nullable: true })
  shop_item?: ShopItem;

  @CreateDateColumn()
  created_at: Date;
}
