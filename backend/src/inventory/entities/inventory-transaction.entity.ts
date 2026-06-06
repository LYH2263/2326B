import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InventoryItem } from './inventory-item.entity';

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'item_id' })
  itemId: number;

  @Column({
    type: 'enum',
    enum: ['in', 'out', 'adjust'],
  })
  type: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  quantity: number;

  @Column({ name: 'transaction_date', type: 'datetime' })
  transactionDate: Date;

  @Column({ length: 100, nullable: true })
  operator: string;

  @Column({ name: 'experiment_id', nullable: true })
  experimentId: number;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => InventoryItem, (item) => item.transactions)
  @JoinColumn({ name: 'item_id' })
  item: InventoryItem;
}
