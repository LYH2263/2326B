import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ExperimentMilestone } from './entities/experiment-milestone.entity';
import { Experiment } from '../experiments/entities/experiment.entity';
import { CreateExperimentMilestoneDto } from './dto/create-experiment-milestone.dto';
import { UpdateExperimentMilestoneDto } from './dto/update-experiment-milestone.dto';
import { QueryExperimentMilestoneDto } from './dto/query-experiment-milestone.dto';

@Injectable()
export class ExperimentMilestonesService {
  private readonly logger = new Logger(ExperimentMilestonesService.name);

  constructor(
    @InjectRepository(ExperimentMilestone)
    private readonly milestoneRepository: Repository<ExperimentMilestone>,
    @InjectRepository(Experiment)
    private readonly experimentRepository: Repository<Experiment>,
  ) {}

  async create(dto: CreateExperimentMilestoneDto): Promise<ExperimentMilestone> {
    const milestone = this.milestoneRepository.create(dto);
    const saved = await this.milestoneRepository.save(milestone);
    this.logger.log(`Created milestone: ${saved.id} - ${saved.name}`);
    return saved;
  }

  async findAll(
    query: QueryExperimentMilestoneDto & { page?: number; pageSize?: number },
  ): Promise<{ list: ExperimentMilestone[]; total: number }> {
    const { page = 1, pageSize = 20, ...filters } = query;
    const where: any = {};

    if (filters.experimentId) where.experimentId = filters.experimentId;
    if (filters.status) where.status = filters.status;
    if (filters.assignee) where.assignee = filters.assignee;

    const [list, total] = await this.milestoneRepository.findAndCount({
      where,
      order: { plannedDate: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total };
  }

  async findByExperimentId(experimentId: number): Promise<ExperimentMilestone[]> {
    return this.milestoneRepository.find({
      where: { experimentId },
      order: { plannedDate: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ExperimentMilestone> {
    const milestone = await this.milestoneRepository.findOne({ where: { id } });
    if (!milestone) {
      throw new NotFoundException(`里程碑 #${id} 不存在`);
    }
    return milestone;
  }

  async update(
    id: number,
    dto: UpdateExperimentMilestoneDto,
  ): Promise<ExperimentMilestone> {
    const milestone = await this.findOne(id);
    Object.assign(milestone, dto);
    const updated = await this.milestoneRepository.save(milestone);
    this.logger.log(`Updated milestone: ${updated.id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const milestone = await this.findOne(id);
    await this.milestoneRepository.remove(milestone);
    this.logger.log(`Removed milestone: ${id}`);
  }

  async updateOverdueStatuses(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueMilestones = await this.milestoneRepository
      .createQueryBuilder('m')
      .where('m.status = :status', { status: 'pending' })
      .andWhere('m.planned_date < :today', { today })
      .getMany();

    for (const milestone of overdueMilestones) {
      milestone.status = 'overdue';
      await this.milestoneRepository.save(milestone);
    }

    if (overdueMilestones.length > 0) {
      this.logger.log(`Updated ${overdueMilestones.length} milestones to overdue`);
    }
  }

  async getGanttData(filters?: {
    status?: string;
    department?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    experiments: any[];
    timeRange: { start: Date; end: Date };
    departments: string[];
  }> {
    await this.updateOverdueStatuses();

    const expWhere: any = {};
    if (filters?.status) {
      expWhere.status = filters.status;
    }
    if (filters?.department) {
      expWhere.department = filters.department;
    }

    const experiments = await this.experimentRepository.find({
      where: expWhere,
      order: { startDate: 'ASC' },
    });

    const expIds = experiments.map((e) => e.id);
    const allMilestones =
      expIds.length > 0
        ? await this.milestoneRepository.find({
            where: { experimentId: In(expIds) },
            order: { plannedDate: 'ASC' },
          })
        : [];

    const milestonesByExp: Record<number, ExperimentMilestone[]> = {};
    for (const m of allMilestones) {
      if (!milestonesByExp[m.experimentId]) {
        milestonesByExp[m.experimentId] = [];
      }
      milestonesByExp[m.experimentId].push(m);
    }

    const departments = Array.from(
      new Set(experiments.map((e) => e.department).filter(Boolean) as string[]),
    );

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    const ganttExperiments = experiments.map((exp) => {
      const milestones = milestonesByExp[exp.id] || [];
      const totalMilestones = milestones.length;
      const completedMilestones = milestones.filter(
        (m) => m.status === 'completed',
      ).length;
      const progressPercent =
        totalMilestones > 0
          ? Math.round((completedMilestones / totalMilestones) * 100)
          : 0;

      if (exp.startDate && (!minDate || exp.startDate < minDate)) {
        minDate = new Date(exp.startDate);
      }
      if (exp.endDate && (!maxDate || exp.endDate > maxDate)) {
        maxDate = new Date(exp.endDate);
      }

      for (const m of milestones) {
        if (m.plannedDate && (!minDate || m.plannedDate < minDate)) {
          minDate = new Date(m.plannedDate);
        }
        if (m.actualDate && (!maxDate || m.actualDate > maxDate)) {
          maxDate = new Date(m.actualDate);
        }
      }

      return {
        id: exp.id,
        name: exp.name,
        projectCode: exp.projectCode,
        status: exp.status,
        researcher: exp.researcher,
        department: exp.department,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
        progressPercent,
        totalMilestones,
        completedMilestones,
        milestones: milestones.map((m) => ({
          id: m.id,
          name: m.name,
          plannedDate: m.plannedDate,
          actualDate: m.actualDate,
          status: m.status,
          assignee: m.assignee,
        })),
      };
    });

    if (filters?.startDate) {
      const filterStart = new Date(filters.startDate);
      if (!minDate || filterStart.getTime() < (minDate as Date).getTime()) {
        minDate = filterStart;
      }
    }
    if (filters?.endDate) {
      const filterEnd = new Date(filters.endDate);
      if (!maxDate || filterEnd.getTime() > (maxDate as Date).getTime()) {
        maxDate = filterEnd;
      }
    }

    if (!minDate) minDate = new Date();
    if (!maxDate) maxDate = new Date();

    const padStart = new Date(minDate);
    padStart.setDate(padStart.getDate() - 7);
    const padEnd = new Date(maxDate);
    padEnd.setDate(padEnd.getDate() + 7);

    return {
      experiments: ganttExperiments,
      timeRange: { start: padStart, end: padEnd },
      departments,
    };
  }
}
