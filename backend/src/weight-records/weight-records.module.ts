import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeightRecordsService } from './weight-records.service';
import { WeightRecordsController } from './weight-records.controller';
import { WeightRecord } from './entities/weight-record.entity';
import { Animal } from '../animals/entities/animal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeightRecord, Animal])],
  controllers: [WeightRecordsController],
  providers: [WeightRecordsService],
  exports: [WeightRecordsService],
})
export class WeightRecordsModule {}
