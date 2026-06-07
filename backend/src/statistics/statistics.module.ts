import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { AnimalsModule } from '../animals/animals.module';
import { HealthModule } from '../health/health.module';
import { ExperimentsModule } from '../experiments/experiments.module';
import { FeedingModule } from '../feeding/feeding.module';
import { Animal } from '../animals/entities/animal.entity';
import { FeedingRecord } from '../feeding/entities/feeding-record.entity';
import { HealthRecord } from '../health/entities/health-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Animal, FeedingRecord, HealthRecord]),
    AnimalsModule,
    HealthModule,
    ExperimentsModule,
    FeedingModule,
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
