import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Experiment } from '../../experiments/entities/experiment.entity';

@Entity('experiment_milestones')
export class ExperimentMilestone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'experiment_id' })
  experimentId: number;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'planned_date', type: 'date' })
  plannedDate: Date;

  @Column({ name: 'actual_date', type: 'date', nullable: true })
  actualDate: Date | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'overdue'],
    default: 'pending',
  })
  status: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  assignee: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Experiment, (exp) => exp.experimentAnimals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experiment_id' })
  experiment: Experiment;
}
