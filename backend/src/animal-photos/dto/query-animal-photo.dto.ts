import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAnimalPhotoDto {
  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;

  @ApiPropertyOptional({ description: '动物ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  animalId?: number;

  @ApiPropertyOptional({ description: '标签，多个用逗号分隔' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: '关键词（搜索描述和文件名）' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
