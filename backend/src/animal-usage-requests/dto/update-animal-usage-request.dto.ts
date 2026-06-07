import { PartialType } from '@nestjs/swagger';
import { CreateAnimalUsageRequestDto } from './create-animal-usage-request.dto';

export class UpdateAnimalUsageRequestDto extends PartialType(
  CreateAnimalUsageRequestDto,
) {}
