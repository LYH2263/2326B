import { PartialType } from '@nestjs/swagger';
import { CreateDeathRecordDto } from './create-death-record.dto';

export class UpdateDeathRecordDto extends PartialType(CreateDeathRecordDto) {}
