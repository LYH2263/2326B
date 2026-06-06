import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DeathRecord } from './entities/death-record.entity';
import { NecropsyReport } from './entities/necropsy-report.entity';
import { Animal } from '../animals/entities/animal.entity';
import { CreateDeathRecordDto } from './dto/create-death-record.dto';
import { UpdateDeathRecordDto } from './dto/update-death-record.dto';
import { QueryDeathRecordDto } from './dto/query-death-record.dto';

@Injectable()
export class DeathRecordsService {
  private readonly logger = new Logger(DeathRecordsService.name);

  constructor(
    @InjectRepository(DeathRecord)
    private readonly deathRecordRepository: Repository<DeathRecord>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateDeathRecordDto): Promise<DeathRecord> {
    const animal = await this.animalRepository.findOne({
      where: { id: dto.animalId },
    });
    if (!animal) {
      throw new NotFoundException(`动物 #${dto.animalId} 不存在`);
    }
    if (animal.status === 'deceased') {
      throw new BadRequestException(`动物 #${dto.animalId} 已登记死亡，无法重复登记`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const deathRecord = queryRunner.manager.create(DeathRecord, {
        ...dto,
        necropsyStatus: dto.necropsyStatus || (dto.disposalMethod === 'necropsy' ? 'pending' : 'not_needed'),
      });

      if (dto.necropsyReport) {
        const necropsyReport = queryRunner.manager.create(NecropsyReport, dto.necropsyReport);
        deathRecord.necropsyReport = necropsyReport;
        deathRecord.necropsyStatus = 'completed';
      }

      const savedRecord = await queryRunner.manager.save(DeathRecord, deathRecord);

      await queryRunner.manager.update(Animal, dto.animalId, {
        status: 'deceased',
      });

      await queryRunner.commitTransaction();

      this.logger.log(`Created death record: ${savedRecord.id} for animal ${savedRecord.animalId}`);

      return this.findOne(savedRecord.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: QueryDeathRecordDto): Promise<{ list: DeathRecord[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      animalId,
      causeCategory,
      disposalMethod,
      necropsyStatus,
    } = query;

    const where: any = {};

    if (animalId) where.animalId = animalId;
    if (causeCategory) where.causeCategory = causeCategory;
    if (disposalMethod) where.disposalMethod = disposalMethod;
    if (necropsyStatus) where.necropsyStatus = necropsyStatus;

    const [list, total] = await this.deathRecordRepository.findAndCount({
      where,
      relations: ['animal', 'necropsyReport'],
      order: { deathDatetime: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total };
  }

  async findOne(id: number): Promise<DeathRecord> {
    const record = await this.deathRecordRepository.findOne({
      where: { id },
      relations: ['animal', 'necropsyReport'],
    });
    if (!record) {
      throw new NotFoundException(`死亡记录 #${id} 不存在`);
    }
    return record;
  }

  async findByAnimalId(animalId: number): Promise<DeathRecord | null> {
    return this.deathRecordRepository.findOne({
      where: { animalId },
      relations: ['animal', 'necropsyReport'],
      order: { deathDatetime: 'DESC' },
    });
  }

  async update(id: number, dto: UpdateDeathRecordDto): Promise<DeathRecord> {
    const record = await this.findOne(id);

    const { necropsyReport, ...restDto } = dto;

    Object.assign(record, restDto);

    if (necropsyReport && record.necropsyReport) {
      Object.assign(record.necropsyReport, necropsyReport);
    }

    const updated = await this.deathRecordRepository.save(record);
    this.logger.log(`Updated death record: ${updated.id}`);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const record = await this.findOne(id);
    await this.deathRecordRepository.remove(record);
    this.logger.log(`Removed death record: ${id}`);
  }

  async countByCauseCategory(): Promise<{ causeCategory: string; count: number }[]> {
    return this.deathRecordRepository
      .createQueryBuilder('dr')
      .select('dr.causeCategory', 'causeCategory')
      .addSelect('COUNT(*)', 'count')
      .groupBy('dr.causeCategory')
      .getRawMany();
  }

  async countByNecropsyStatus(): Promise<{ necropsyStatus: string; count: number }[]> {
    return this.deathRecordRepository
      .createQueryBuilder('dr')
      .select('dr.necropsyStatus', 'necropsyStatus')
      .addSelect('COUNT(*)', 'count')
      .groupBy('dr.necropsyStatus')
      .getRawMany();
  }
}
