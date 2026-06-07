import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('backup_records')
export class BackupRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'file_path', length: 500 })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint', default: 0 })
  fileSize: number;

  @Column({
    name: 'backup_type',
    type: 'enum',
    enum: ['auto', 'manual'],
    default: 'manual',
  })
  backupType: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['success', 'failed', 'running'],
    default: 'running',
  })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'duration_ms', type: 'bigint', default: 0 })
  durationMs: number;

  @Column({ type: 'text', nullable: true })
  remark: string;
}
