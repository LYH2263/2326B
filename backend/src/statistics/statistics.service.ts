import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { AnimalsService } from '../animals/animals.service';
import { HealthService } from '../health/health.service';
import { ExperimentsService } from '../experiments/experiments.service';
import { FeedingService } from '../feeding/feeding.service';
import { Animal } from '../animals/entities/animal.entity';
import { FeedingRecord } from '../feeding/entities/feeding-record.entity';
import { HealthRecord } from '../health/entities/health-record.entity';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    private readonly animalsService: AnimalsService,
    private readonly healthService: HealthService,
    private readonly experimentsService: ExperimentsService,
    private readonly feedingService: FeedingService,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    @InjectRepository(FeedingRecord)
    private readonly feedingRecordRepository: Repository<FeedingRecord>,
    @InjectRepository(HealthRecord)
    private readonly healthRecordRepository: Repository<HealthRecord>,
  ) {}

  async getOverview() {
    const [animalCount, animalsByStatus, animalsBySpecies, experimentsByStatus, healthByCondition] =
      await Promise.all([
        this.animalsService.count(),
        this.animalsService.countByStatus(),
        this.animalsService.countBySpecies(),
        this.experimentsService.countByStatus(),
        this.healthService.countByCondition(),
      ]);

    this.logger.log('Generated statistics overview');

    return {
      animalCount,
      animalsByStatus,
      animalsBySpecies,
      experimentsByStatus,
      healthByCondition,
    };
  }

  async getAnimalStatistics() {
    const [byStatus, bySpecies] = await Promise.all([
      this.animalsService.countByStatus(),
      this.animalsService.countBySpecies(),
    ]);

    return { byStatus, bySpecies };
  }

  async getExperimentStatistics() {
    const [byStatus, byDepartment] = await Promise.all([
      this.experimentsService.countByStatus(),
      this.experimentsService.countByDepartment(),
    ]);

    return { byStatus, byDepartment };
  }

  async getFeedingStatistics() {
    const dailySummary = await this.feedingService.getDailyFeedingSummary();
    return { dailySummary };
  }

  async getWorkstationTodo(today: string) {
    const aliveAnimals = await this.animalRepository.find({
      where: { status: Not('deceased') as any },
      select: ['id', 'name', 'species', 'breed', 'cageNumber', 'status', 'rfidTag'],
    });

    const todayFeedingRecords = await this.feedingRecordRepository.find({
      where: { feedDate: new Date(today) } as any,
      select: ['animalId'],
    });

    const fedAnimalIds = new Set(todayFeedingRecords.map(r => r.animalId));
    const pendingFeeding = aliveAnimals.filter(a => !fedAnimalIds.has(a.id));

    const todayHealthRecords = await this.healthRecordRepository.find({
      where: { checkDate: new Date(today) } as any,
      select: ['animalId'],
    });

    const checkedAnimalIds = new Set(todayHealthRecords.map(r => r.animalId));
    const pendingHealthCheck = aliveAnimals.filter(a => !checkedAnimalIds.has(a.id));

    const healthWarningAnimals = await this.animalRepository
      .createQueryBuilder('animal')
      .leftJoin(HealthRecord, 'hr', 'hr.animal_id = animal.id')
      .where('animal.status = :status', { status: 'sick' })
      .orWhere(qb => {
        const subQuery = qb.subQuery()
          .select('hr2.animal_id')
          .from(HealthRecord, 'hr2')
          .where('hr2.condition IN (:...conditions)', { conditions: ['abnormal', 'critical'] })
          .andWhere('hr2.check_date >= :date', { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) })
          .getQuery();
        return `animal.id IN ${subQuery}`;
      })
      .select('animal.id', 'id')
      .addSelect('animal.name', 'name')
      .addSelect('animal.species', 'species')
      .addSelect('animal.breed', 'breed')
      .addSelect('animal.cage_number', 'cageNumber')
      .addSelect('animal.status', 'status')
      .addSelect('animal.rfid_tag', 'rfidTag')
      .distinct(true)
      .getRawMany();

    return {
      pendingFeeding: pendingFeeding.map(a => ({
        id: a.id,
        name: a.name,
        species: a.species,
        breed: a.breed,
        cageNumber: a.cageNumber,
        status: a.status,
        rfidTag: a.rfidTag,
      })),
      pendingHealthCheck: pendingHealthCheck.map(a => ({
        id: a.id,
        name: a.name,
        species: a.species,
        breed: a.breed,
        cageNumber: a.cageNumber,
        status: a.status,
        rfidTag: a.rfidTag,
      })),
      healthWarnings: healthWarningAnimals.map(a => ({
        id: a.id,
        name: a.name,
        species: a.species,
        breed: a.breed,
        cageNumber: a.cageNumber,
        status: a.status,
        rfidTag: a.rfidTag,
      })),
    };
  }

  async getWorkstationProgress(today: string) {
    const aliveAnimalsCount = await this.animalRepository.count({
      where: { status: Not('deceased') as any },
    });

    const todayFeedingCount = await this.feedingRecordRepository
      .createQueryBuilder('fr')
      .select('COUNT(DISTINCT fr.animal_id)', 'count')
      .where('fr.feed_date = :date', { date: today })
      .getRawOne();

    const todayHealthCount = await this.healthRecordRepository
      .createQueryBuilder('hr')
      .select('COUNT(DISTINCT hr.animal_id)', 'count')
      .where('hr.check_date = :date', { date: today })
      .getRawOne();

    const fedCount = Number(todayFeedingCount?.count || 0);
    const healthCheckedCount = Number(todayHealthCount?.count || 0);

    const feedingRate = aliveAnimalsCount > 0 ? Math.round((fedCount / aliveAnimalsCount) * 100) : 0;
    const healthRate = aliveAnimalsCount > 0 ? Math.round((healthCheckedCount / aliveAnimalsCount) * 100) : 0;

    const overallRate = Math.round((feedingRate + healthRate) / 2);

    return {
      totalAnimals: aliveAnimalsCount,
      fedCount,
      feedingRate,
      healthCheckedCount,
      healthRate,
      overallRate,
    };
  }

  async getCageList() {
    const result = await this.animalRepository
      .createQueryBuilder('animal')
      .select('animal.cageNumber', 'cageNumber')
      .addSelect('COUNT(*)', 'animalCount')
      .where('animal.cageNumber IS NOT NULL')
      .andWhere('animal.status != :status', { status: 'deceased' })
      .groupBy('animal.cageNumber')
      .orderBy('animal.cageNumber', 'ASC')
      .getRawMany();

    return result.map(r => ({
      cageNumber: r.cageNumber,
      animalCount: Number(r.animalCount),
    }));
  }

  async getAnimalsByCage(cageNumber: string) {
    return this.animalRepository.find({
      where: { cageNumber, status: Not('deceased') as any },
      select: ['id', 'name', 'species', 'breed', 'gender', 'weight', 'cageNumber', 'rfidTag'],
      order: { name: 'ASC' },
    });
  }
}
