import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Experiment } from '../../experiments/entities/experiment.entity';

export type RequestStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'withdrawn';
export type GenderRequirement = 'male' | 'female' | 'any';

@Entity('animal_usage_requests')
export class AnimalUsageRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'applicant_id' })
  applicantId: number;

  @Column({ name: 'request_date', type: 'date' })
  requestDate: Date;

  @Column({ name: 'experiment_id', type: 'int', nullable: true })
  experimentId: number | null;

  @Column({ length: 50 })
  species: string;

  @Column({ length: 50, nullable: true })
  strain: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({
    type: 'enum',
    enum: ['male', 'female', 'any'],
    default: 'any',
  })
  genderRequirement: GenderRequirement;

  @Column({ name: 'min_weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  minWeight: number | null;

  @Column({ name: 'max_weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxWeight: number | null;

  @Column({ name: 'purpose', type: 'text' })
  purpose: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ['draft', 'submitted', 'approved', 'rejected', 'withdrawn'],
    default: 'draft',
  })
  status: RequestStatus;

  @Column({ name: 'approver_id', type: 'int', nullable: true })
  approverId: number | null;

  @Column({ name: 'approval_time', type: 'datetime', nullable: true })
  approvalTime: Date | null;

  @Column({ name: 'approval_comment', type: 'text', nullable: true })
  approvalComment: string | null;

  @Column({ name: 'allocation_result', type: 'json', nullable: true })
  allocationResult: any | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approver_id' })
  approver: User | null;

  @ManyToOne(() => Experiment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'experiment_id' })
  experiment: Experiment | null;
}
