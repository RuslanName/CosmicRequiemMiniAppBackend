import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ItemTemplate } from '../item-template/item-template.entity';
import { UserAccessoryStatus } from './enums/user-accessory-status.enum';

@Entity()
@Index(['user_id'])
export class UserAccessory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: UserAccessoryStatus,
    default: UserAccessoryStatus.UNEQUIPPED,
  })
  status: UserAccessoryStatus;

  @Column({ type: 'int' })
  user_id: number;

  @ManyToOne(() => User, (user) => user.accessories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ItemTemplate, { onDelete: 'RESTRICT' })
  item_template: ItemTemplate;

  @CreateDateColumn()
  created_at: Date;
}
