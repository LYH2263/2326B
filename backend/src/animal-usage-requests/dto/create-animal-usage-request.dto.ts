import {
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  MaxLength,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenderRequirement } from '../entities/animal-usage-request.entity';

export class CreateAnimalUsageRequestDto {
  @ApiPropertyOptional({ description: '实验项目ID（可选，已有实验可关联）' })
  @IsOptional()
  @IsNumber()
  experimentId?: number;

  @ApiProperty({ description: '申请动物物种' })
  @IsString()
  @MaxLength(50)
  species: string;

  @ApiPropertyOptional({ description: '品系' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  strain?: string;

  @ApiProperty({ description: '申请数量' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: '性别要求',
    enum: ['male', 'female', 'any'],
    default: 'any',
  })
  @IsEnum(['male', 'female', 'any'])
  genderRequirement: GenderRequirement;

  @ApiPropertyOptional({ description: '最小体重(g)' })
  @IsOptional()
  @IsNumber()
  minWeight?: number;

  @ApiPropertyOptional({ description: '最大体重(g)' })
  @IsOptional()
  @IsNumber()
  maxWeight?: number;

  @ApiProperty({ description: '使用目的描述' })
  @IsString()
  purpose: string;

  @ApiProperty({ description: '预计开始日期', example: '2025-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: '预计结束日期', example: '2025-06-30' })
  @IsDateString()
  endDate: string;
}
