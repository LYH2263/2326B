import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Animal } from '../../animals/entities/animal.entity';
import { NecropsyReport } from './necropsy-report.entity';

@Entity('death_records')
export class DeathRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'animal_id' })
  animalId: number;

  @Column({ name: 'death_datetime', type: 'datetime' })
  deathDatetime: Date;

  @Column({
    name: 'cause_category',
    type: 'enum',
    enum: ['natural', 'experiment_termination', 'accidental', 'euthanasia'],
  })
  causeCategory: string;

  @Column({ name: 'cause_description', type: 'text', nullable: true })
  causeDescription: string;

  @Column({ name: 'found_by', length: 100, nullable: true })
  foundBy: string;

  @Column({ name: 'confirming_vet', length: 100, nullable: true })
  confirmingVet: string;

  @Column({
    name: 'disposal_method',
    type: 'enum',
    enum: ['necropsy', 'incineration', 'cryopreservation'],
  })
  disposalMethod: string;

  @Column({
    name: 'necropsy_status',
    type: 'enum',
    enum: ['not_needed', 'pending', 'completed'],
    default: 'not_needed',
  })
  necropsyStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Animal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;

  @OneToOne(() => NecropsyReport, (report) => report.deathRecord, {
    cascade: true,
  })
  necropsyReport: NecropsyReport;
}
