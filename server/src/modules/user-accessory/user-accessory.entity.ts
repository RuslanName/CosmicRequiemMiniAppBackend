import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ItemTemplate } from '../item-template/item-template.entity';
import { UserAccessoryStatus } from './enums/user-accessory-status.enum';

@Entity()
export class UserAccessory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: UserAccessoryStatus,
    default: UserAccessoryStatus.UNEQUIPPED,
  })
  status: UserAccessoryStatus;

  @ManyToOne(() => User, (user) => user.accessories, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => ItemTemplate, { onDelete: 'RESTRICT' })
  item_template: ItemTemplate;

  @CreateDateColumn()
  created_at: Date;
}
