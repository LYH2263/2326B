import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeathRecordsController } from './death-records.controller';
import { NecropsyReportsController } from './necropsy-reports.controller';
import { DeathRecordsService } from './death-records.service';
import { NecropsyReportsService } from './necropsy-reports.service';
import { DeathRecord } from './entities/death-record.entity';
import { NecropsyReport } from './entities/necropsy-report.entity';
import { Animal } from '../animals/entities/animal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeathRecord, NecropsyReport, Animal])],
  controllers: [DeathRecordsController, NecropsyReportsController],
  providers: [DeathRecordsService, NecropsyReportsService],
  exports: [DeathRecordsService, NecropsyReportsService],
})
export class DeathRecordsModule {}
