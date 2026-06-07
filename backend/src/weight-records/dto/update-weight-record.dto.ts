import { PartialType } from '@nestjs/swagger';
import { CreateWeightRecordDto } from './create-weight-record.dto';

export class UpdateWeightRecordDto extends PartialType(CreateWeightRecordDto) {}
