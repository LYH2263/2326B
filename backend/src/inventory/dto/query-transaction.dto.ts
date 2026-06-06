import { IsOptional, IsInt, Min, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTransactionDto {
  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({ description: '物品ID' })
  @IsOptional()
  @IsInt()
  itemId?: number;

  @ApiPropertyOptional({ description: '事务类型', enum: ['in', 'out', 'adjust'] })
  @IsOptional()
  @IsEnum(['in', 'out', 'adjust'])
  type?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
