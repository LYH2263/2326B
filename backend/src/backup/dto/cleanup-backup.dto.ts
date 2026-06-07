import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CleanupBackupDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days: number;
}
