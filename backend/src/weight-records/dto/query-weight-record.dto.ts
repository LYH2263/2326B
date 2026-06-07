import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryWeightRecordDto {
  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量' })
  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @ApiPropertyOptional({ description: '动物ID' })
  @IsOptional()
  @IsNumber()
  animalId?: number;

  @ApiPropertyOptional({ description: '笼位号' })
  @IsOptional()
  @IsString()
  cageNumber?: string;

  @ApiPropertyOptional({ description: '物种' })
  @IsOptional()
  @IsString()
  species?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '称重者' })
  @IsOptional()
  @IsString()
  weigher?: string;
}
