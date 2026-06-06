import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Animal } from '../../animals/entities/animal.entity';

export type TransferStatus = 'pending' | 'in_transit' | 'completed' | 'returned';
export type TransferReason = 'experiment_borrow' | 'permanent_transfer' | 'return_to_supplier';

@Entity('animal_transfers')
export class AnimalTransfer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'animal_id' })
  animalId: number;

  @Column({ name: 'from_department', length: 100 })
  fromDepartment: string;

  @Column({ name: 'to_department', length: 100 })
  toDepartment: string;

  @Column({
    type: 'enum',
    enum: ['experiment_borrow', 'permanent_transfer', 'return_to_supplier'],
  })
  reason: TransferReason;

  @Column({ name: 'transfer_date', type: 'date' })
  transferDate: Date;

  @Column({ name: 'expected_return_date', type: 'date', nullable: true })
  expectedReturnDate: Date;

  @Column({ name: 'actual_return_date', type: 'date', nullable: true })
  actualReturnDate: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_transit', 'completed', 'returned'],
    default: 'pending',
  })
  status: TransferStatus;

  @Column({ name: 'handler', length: 100 })
  handler: string;

  @Column({ name: 'approver', length: 100, nullable: true })
  approver: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Animal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;
}
