import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NecropsyReport } from './entities/necropsy-report.entity';
import { DeathRecord } from './entities/death-record.entity';
import { CreateNecropsyReportDto } from './dto/create-necropsy-report.dto';
import { UpdateNecropsyReportDto } from './dto/update-necropsy-report.dto';

@Injectable()
export class NecropsyReportsService {
  private readonly logger = new Logger(NecropsyReportsService.name);

  constructor(
    @InjectRepository(NecropsyReport)
    private readonly necropsyReportRepository: Repository<NecropsyReport>,
    @InjectRepository(DeathRecord)
    private readonly deathRecordRepository: Repository<DeathRecord>,
  ) {}

  async create(deathRecordId: number, dto: CreateNecropsyReportDto): Promise<NecropsyReport> {
    const deathRecord = await this.deathRecordRepository.findOne({
      where: { id: deathRecordId },
    });
    if (!deathRecord) {
      throw new NotFoundException(`死亡记录 #${deathRecordId} 不存在`);
    }

    const report = this.necropsyReportRepository.create({
      ...dto,
      deathRecordId,
    });

    const saved = await this.necropsyReportRepository.save(report);

    deathRecord.necropsyStatus = 'completed';
    await this.deathRecordRepository.save(deathRecord);

    this.logger.log(`Created necropsy report: ${saved.id} for death record ${deathRecordId}`);
    return this.findOne(saved.id);
  }

  async findAll(deathRecordId?: number): Promise<NecropsyReport[]> {
    const where: any = {};
    if (deathRecordId) where.deathRecordId = deathRecordId;

    return this.necropsyReportRepository.find({
      where,
      relations: ['deathRecord', 'deathRecord.animal'],
      order: { necropsyDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<NecropsyReport> {
    const report = await this.necropsyReportRepository.findOne({
      where: { id },
      relations: ['deathRecord', 'deathRecord.animal'],
    });
    if (!report) {
      throw new NotFoundException(`尸检报告 #${id} 不存在`);
    }
    return report;
  }

  async findByDeathRecordId(deathRecordId: number): Promise<NecropsyReport | null> {
    return this.necropsyReportRepository.findOne({
      where: { deathRecordId },
      relations: ['deathRecord', 'deathRecord.animal'],
    });
  }

  async update(id: number, dto: UpdateNecropsyReportDto): Promise<NecropsyReport> {
    const report = await this.findOne(id);
    Object.assign(report, dto);
    const updated = await this.necropsyReportRepository.save(report);
    this.logger.log(`Updated necropsy report: ${updated.id}`);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const report = await this.findOne(id);

    const deathRecord = await this.deathRecordRepository.findOne({
      where: { id: report.deathRecordId },
    });
    if (deathRecord) {
      deathRecord.necropsyStatus = 'pending';
      await this.deathRecordRepository.save(deathRecord);
    }

    await this.necropsyReportRepository.remove(report);
    this.logger.log(`Removed necropsy report: ${id}`);
  }

  async addImage(id: number, imageUrl: string): Promise<NecropsyReport> {
    const report = await this.findOne(id);
    if (!report.imageUrls) {
      report.imageUrls = [];
    }
    report.imageUrls.push(imageUrl);
    const updated = await this.necropsyReportRepository.save(report);
    this.logger.log(`Added image to necropsy report: ${id}`);
    return this.findOne(updated.id);
  }

  async removeImage(id: number, imageUrl: string): Promise<NecropsyReport> {
    const report = await this.findOne(id);
    if (report.imageUrls) {
      report.imageUrls = report.imageUrls.filter((url) => url !== imageUrl);
    }
    const updated = await this.necropsyReportRepository.save(report);
    this.logger.log(`Removed image from necropsy report: ${id}`);
    return this.findOne(updated.id);
  }
}
