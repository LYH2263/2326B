import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalUsageRequest } from './entities/animal-usage-request.entity';
import { AnimalUsageRequestsService } from './animal-usage-requests.service';
import { AnimalUsageRequestsController } from './animal-usage-requests.controller';
import { Animal } from '../animals/entities/animal.entity';
import { ExperimentAnimal } from '../experiments/entities/experiment-animal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnimalUsageRequest, Animal, ExperimentAnimal])],
  controllers: [AnimalUsageRequestsController],
  providers: [AnimalUsageRequestsService],
  exports: [AnimalUsageRequestsService],
})
export class AnimalUsageRequestsModule {}
