import { IsOptional, IsNumber, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAnimalUsageRequestDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;

  @ApiPropertyOptional({ description: '申请人ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  applicantId?: number;

  @ApiPropertyOptional({
    description: '审批状态',
    enum: ['draft', 'submitted', 'approved', 'rejected', 'withdrawn'],
  })
  @IsOptional()
  @IsEnum(['draft', 'submitted', 'approved', 'rejected', 'withdrawn'])
  status?: string;

  @ApiPropertyOptional({ description: '物种' })
  @IsOptional()
  @IsString()
  species?: string;

  @ApiPropertyOptional({ description: '实验项目ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  experimentId?: number;

  @ApiPropertyOptional({ description: '开始日期（申请日期范围）', example: '2025-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期（申请日期范围）', example: '2025-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
