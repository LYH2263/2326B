import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { WeightRecord } from './entities/weight-record.entity';
import { Animal } from '../animals/entities/animal.entity';
import { CreateWeightRecordDto, BatchCreateWeightRecordDto } from './dto/create-weight-record.dto';
import { UpdateWeightRecordDto } from './dto/update-weight-record.dto';
import { QueryWeightRecordDto } from './dto/query-weight-record.dto';

@Injectable()
export class WeightRecordsService {
  private readonly logger = new Logger(WeightRecordsService.name);

  constructor(
    @InjectRepository(WeightRecord)
    private readonly weightRecordRepository: Repository<WeightRecord>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
  ) {}

  async create(dto: CreateWeightRecordDto): Promise<WeightRecord> {
    const animal = await this.animalRepository.findOne({ where: { id: dto.animalId } });
    if (!animal) {
      throw new NotFoundException(`动物 #${dto.animalId} 不存在`);
    }

    const record = this.weightRecordRepository.create(dto);
    const saved = await this.weightRecordRepository.save(record);

    animal.weight = dto.weight;
    await this.animalRepository.save(animal);

    this.logger.log(`Created weight record: ${saved.id} for animal ${saved.animalId}`);
    return saved;
  }

  async batchCreate(dto: BatchCreateWeightRecordDto): Promise<WeightRecord[]> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('称重数据列表不能为空');
    }

    const animalIds = dto.items.map(item => item.animalId);
    const animals = await this.animalRepository.find({
      where: { id: In(animalIds) },
    });

    if (animals.length !== animalIds.length) {
      const foundIds = animals.map(a => a.id);
      const missingIds = animalIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`以下动物不存在: ${missingIds.join(', ')}`);
    }

    const records: WeightRecord[] = [];
    const animalMap = new Map(animals.map(a => [a.id, a]));

    for (const item of dto.items) {
      const record = this.weightRecordRepository.create({
        animalId: item.animalId,
        weighDate: dto.weighDate,
        weighTime: dto.weighTime,
        weight: item.weight,
        weigher: dto.weigher,
        deviceNo: dto.deviceNo,
        notes: item.notes,
      });
      records.push(record);

      const animal = animalMap.get(item.animalId);
      if (animal) {
        animal.weight = item.weight;
      }
    }

    const savedRecords = await this.weightRecordRepository.save(records);
    await this.animalRepository.save(animals);

    this.logger.log(`Batch created ${savedRecords.length} weight records`);
    return savedRecords;
  }

  async findAll(query: QueryWeightRecordDto): Promise<{ list: WeightRecord[]; total: number }> {
    const { page = 1, pageSize = 10, animalId, cageNumber, species, startDate, endDate, weigher } = query;

    const queryBuilder = this.weightRecordRepository
      .createQueryBuilder('wr')
      .leftJoinAndSelect('wr.animal', 'animal')
      .where('1=1');

    if (animalId) {
      queryBuilder.andWhere('wr.animalId = :animalId', { animalId });
    }

    if (cageNumber) {
      queryBuilder.andWhere('animal.cageNumber = :cageNumber', { cageNumber });
    }

    if (species) {
      queryBuilder.andWhere('animal.species = :species', { species });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('wr.weighDate BETWEEN :startDate AND :endDate', { startDate, endDate });
    } else if (startDate) {
      queryBuilder.andWhere('wr.weighDate >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('wr.weighDate <= :endDate', { endDate });
    }

    if (weigher) {
      queryBuilder.andWhere('wr.weigher LIKE :weigher', { weigher: `%${weigher}%` });
    }

    queryBuilder
      .orderBy('wr.weighDate', 'DESC')
      .addOrderBy('wr.weighTime', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();

    return { list, total };
  }

  async findOne(id: number): Promise<WeightRecord> {
    const record = await this.weightRecordRepository.findOne({
      where: { id },
      relations: ['animal'],
    });
    if (!record) {
      throw new NotFoundException(`称重记录 #${id} 不存在`);
    }
    return record;
  }

  async update(id: number, dto: UpdateWeightRecordDto): Promise<WeightRecord> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    const updated = await this.weightRecordRepository.save(record);

    if (dto.weight !== undefined && dto.animalId === record.animalId) {
      const animal = await this.animalRepository.findOne({ where: { id: record.animalId } });
      if (animal) {
        animal.weight = dto.weight;
        await this.animalRepository.save(animal);
      }
    }

    this.logger.log(`Updated weight record: ${updated.id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const record = await this.findOne(id);
    await this.weightRecordRepository.remove(record);
    this.logger.log(`Removed weight record: ${id}`);
  }

  async getGrowthRate(animalId: number): Promise<any> {
    const records = await this.weightRecordRepository.find({
      where: { animalId },
      order: { weighDate: 'DESC', weighTime: 'DESC' },
      take: 2,
    });

    if (records.length === 0) {
      throw new NotFoundException(`动物 #${animalId} 暂无称重记录`);
    }

    const latest = records[0];
    const previous = records[1];

    if (!previous) {
      return {
        animalId,
        latestWeight: Number(latest.weight),
        latestDate: latest.weighDate,
        previousWeight: null,
        previousDate: null,
        weightChange: 0,
        growthRate: 0,
        daysBetween: 0,
        dailyGrowthRate: 0,
      };
    }

    const weightChange = Number(latest.weight) - Number(previous.weight);
    const growthRate = (weightChange / Number(previous.weight)) * 100;

    const latestDate = new Date(latest.weighDate);
    const previousDate = new Date(previous.weighDate);
    const daysBetween = Math.ceil(
      (latestDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const dailyGrowthRate = daysBetween > 0 ? growthRate / daysBetween : growthRate;

    return {
      animalId,
      latestWeight: Number(latest.weight),
      latestDate: latest.weighDate,
      previousWeight: Number(previous.weight),
      previousDate: previous.weighDate,
      weightChange: Number(weightChange.toFixed(2)),
      growthRate: Number(growthRate.toFixed(2)),
      daysBetween,
      dailyGrowthRate: Number(dailyGrowthRate.toFixed(4)),
    };
  }

  async getGroupStatistics(params: { cageNumber?: string; species?: string; breed?: string }): Promise<any> {
    const { cageNumber, species, breed } = params;

    if (!cageNumber && !species) {
      throw new BadRequestException('请指定笼位或物种');
    }

    const animalQueryBuilder = this.animalRepository.createQueryBuilder('animal');
    if (cageNumber) {
      animalQueryBuilder.andWhere('animal.cageNumber = :cageNumber', { cageNumber });
    }
    if (species) {
      animalQueryBuilder.andWhere('animal.species = :species', { species });
    }
    if (breed) {
      animalQueryBuilder.andWhere('animal.breed = :breed', { breed });
    }

    const animals = await animalQueryBuilder.getMany();

    if (animals.length === 0) {
      return {
        count: 0,
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        median: 0,
        q1: 0,
        q3: 0,
        iqr: 0,
        lowerFence: 0,
        upperFence: 0,
        outliers: [],
        distribution: [],
        weights: [],
      };
    }

    const animalIds = animals.map(a => a.id);

    const latestWeights: { animalId: number; weight: number; weighDate: Date }[] = [];

    for (const animal of animals) {
      const latestRecord = await this.weightRecordRepository.findOne({
        where: { animalId: animal.id },
        order: { weighDate: 'DESC', weighTime: 'DESC' },
      });

      if (latestRecord) {
        latestWeights.push({
          animalId: animal.id,
          weight: Number(latestRecord.weight),
          weighDate: latestRecord.weighDate,
        });
      } else if (animal.weight) {
        latestWeights.push({
          animalId: animal.id,
          weight: Number(animal.weight),
          weighDate: animal.updatedAt,
        });
      }
    }

    const weights = latestWeights.map(w => w.weight).sort((a, b) => a - b);

    if (weights.length === 0) {
      return {
        count: 0,
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        median: 0,
        q1: 0,
        q3: 0,
        iqr: 0,
        lowerFence: 0,
        upperFence: 0,
        outliers: [],
        distribution: [],
        weights: latestWeights,
      };
    }

    const n = weights.length;
    const sum = weights.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    const variance = weights.reduce((acc, w) => acc + Math.pow(w - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const min = weights[0];
    const max = weights[n - 1];

    const median = this.percentile(weights, 50);
    const q1 = this.percentile(weights, 25);
    const q3 = this.percentile(weights, 75);
    const iqr = q3 - q1;

    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    const outliers = latestWeights.filter(w => w.weight < lowerFence || w.weight > upperFence);

    const range = max - min;
    const binCount = Math.min(10, Math.max(5, Math.ceil(Math.sqrt(n))));
    const binSize = range / binCount || 1;
    const distribution: { binStart: number; binEnd: number; label: string; count: number; percentage: number }[] = [];

    for (let i = 0; i < binCount; i++) {
      const binStart = Number((min + i * binSize).toFixed(2));
      const binEnd = Number((min + (i + 1) * binSize).toFixed(2));
      const count = weights.filter(w => w >= binStart && (i === binCount - 1 ? w <= binEnd : w < binEnd)).length;
      distribution.push({
        binStart,
        binEnd,
        label: `${binStart}-${binEnd}`,
        count,
        percentage: Number(((count / n) * 100).toFixed(1)),
      });
    }

    return {
      count: n,
      mean: Number(mean.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2)),
      min,
      max,
      median: Number(median.toFixed(2)),
      q1: Number(q1.toFixed(2)),
      q3: Number(q3.toFixed(2)),
      iqr: Number(iqr.toFixed(2)),
      lowerFence: Number(lowerFence.toFixed(2)),
      upperFence: Number(upperFence.toFixed(2)),
      outliers,
      distribution,
      weights: latestWeights,
    };
  }

  private percentile(sortedData: number[], p: number): number {
    const index = (p / 100) * (sortedData.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) {
      return sortedData[lower];
    }
    const fraction = index - lower;
    return sortedData[lower] + fraction * (sortedData[upper] - sortedData[lower]);
  }

  async getAnimalsByCage(cageNumber?: string): Promise<any[]> {
    const queryBuilder = this.animalRepository
      .createQueryBuilder('animal')
      .where('animal.status != :status', { status: 'deceased' });

    if (cageNumber) {
      queryBuilder.andWhere('animal.cageNumber = :cageNumber', { cageNumber });
    }

    const animals = await queryBuilder
      .orderBy('animal.cageNumber', 'ASC')
      .addOrderBy('animal.id', 'ASC')
      .getMany();

    const result: any[] = [];
    for (const animal of animals) {
      const latestRecord = await this.weightRecordRepository.findOne({
        where: { animalId: animal.id },
        order: { weighDate: 'DESC', weighTime: 'DESC' },
      });

      result.push({
        ...animal,
        lastWeight: latestRecord ? Number(latestRecord.weight) : null,
        lastWeighDate: latestRecord ? latestRecord.weighDate : null,
      });
    }

    return result;
  }

  async getCageList(): Promise<string[]> {
    const result = await this.animalRepository
      .createQueryBuilder('animal')
      .select('DISTINCT animal.cageNumber', 'cageNumber')
      .where('animal.cageNumber IS NOT NULL')
      .andWhere('animal.cageNumber != ""')
      .andWhere('animal.status != :status', { status: 'deceased' })
      .orderBy('animal.cageNumber', 'ASC')
      .getRawMany();

    return result.map((r) => r.cageNumber);
  }
}
