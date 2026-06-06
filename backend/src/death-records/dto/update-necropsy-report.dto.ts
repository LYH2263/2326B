import { PartialType } from '@nestjs/swagger';
import { CreateNecropsyReportDto } from './create-necropsy-report.dto';

export class UpdateNecropsyReportDto extends PartialType(CreateNecropsyReportDto) {}
