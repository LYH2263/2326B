import { PartialType } from '@nestjs/swagger';
import { CreateExperimentMilestoneDto } from './create-experiment-milestone.dto';

export class UpdateExperimentMilestoneDto extends PartialType(CreateExperimentMilestoneDto) {}
