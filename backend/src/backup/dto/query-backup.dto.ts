import { IsOptional, IsInt, Min, IsString, IsEnum, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryBackupDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(['auto', 'manual'])
  backupType?: string;

  @IsOptional()
  @IsIn(['success', 'failed', 'running'])
  status?: string;
}
