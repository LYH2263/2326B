import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { DeathRecord } from './death-record.entity';

@Entity('necropsy_reports')
export class NecropsyReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'death_record_id' })
  deathRecordId: number;

  @Column({ name: 'necropsy_date', type: 'date' })
  necropsyDate: Date;

  @Column({ name: 'performed_by', length: 100, nullable: true })
  performedBy: string;

  @Column({ name: 'gross_findings', type: 'text', nullable: true })
  grossFindings: string;

  @Column({ name: 'histopathology_findings', type: 'text', nullable: true })
  histopathologyFindings: string;

  @Column({ type: 'text', nullable: true })
  finalDiagnosis: string;

  @Column({ name: 'image_urls', type: 'json', nullable: true })
  imageUrls: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => DeathRecord, (record) => record.necropsyReport, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'death_record_id' })
  deathRecord: DeathRecord;
}
