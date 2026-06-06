import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInventoryItemDto {
  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({ description: '类别', enum: ['drug', 'consumable', 'reagent', 'equipment'] })
  @IsOptional()
  @IsEnum(['drug', 'consumable', 'reagent', 'equipment'])
  category?: string;

  @ApiPropertyOptional({ description: '搜索关键词（名称）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '供应商' })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({ description: '是否仅显示预警（低于安全库存或即将过期）' })
  @IsOptional()
  warningOnly?: boolean | string;
}
