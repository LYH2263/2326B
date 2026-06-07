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

@Entity('weight_records')
export class WeightRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'animal_id' })
  animalId: number;

  @Column({ name: 'weigh_date', type: 'date' })
  weighDate: Date;

  @Column({ name: 'weigh_time', type: 'time', nullable: true })
  weighTime: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  weight: number;

  @Column({ name: 'weigher', length: 100, nullable: true })
  weigher: string;

  @Column({ name: 'device_no', length: 100, nullable: true })
  deviceNo: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Animal, (animal) => animal.weightRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;
}
