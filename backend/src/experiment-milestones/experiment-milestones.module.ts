import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExperimentMilestone } from './entities/experiment-milestone.entity';
import { Experiment } from '../experiments/entities/experiment.entity';
import { ExperimentMilestonesService } from './experiment-milestones.service';
import { ExperimentMilestonesController } from './experiment-milestones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExperimentMilestone, Experiment])],
  controllers: [ExperimentMilestonesController],
  providers: [ExperimentMilestonesService],
  exports: [ExperimentMilestonesService],
})
export class ExperimentMilestonesModule {}
