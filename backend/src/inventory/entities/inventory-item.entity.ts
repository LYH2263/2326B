import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { InventoryTransaction } from './inventory-transaction.entity';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({
    type: 'enum',
    enum: ['drug', 'consumable', 'reagent', 'equipment'],
  })
  category: string;

  @Column({ length: 200, nullable: true })
  specification: string;

  @Column({ length: 20 })
  unit: string;

  @Column({ name: 'current_quantity', type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentQuantity: number;

  @Column({ name: 'safety_stock', type: 'decimal', precision: 12, scale: 2, default: 0 })
  safetyStock: number;

  @Column({ name: 'storage_location', length: 200, nullable: true })
  storageLocation: string;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ length: 200, nullable: true })
  supplier: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPrice: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => InventoryTransaction, (tx) => tx.item)
  transactions: InventoryTransaction[];
}
