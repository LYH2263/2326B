import { IsNumber, IsOptional, IsEnum, IsString, IsDateString, MaxLength, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateNecropsyReportDto } from './create-necropsy-report.dto';

export class CreateDeathRecordDto {
  @ApiProperty({ description: '动物ID' })
  @IsNumber()
  animalId: number;

  @ApiProperty({ description: '死亡日期时间', example: '2025-12-01T10:30:00' })
  @IsDateString()
  deathDatetime: string;

  @ApiProperty({
    description: '死亡原因分类',
    enum: ['natural', 'experiment_termination', 'accidental', 'euthanasia'],
  })
  @IsEnum(['natural', 'experiment_termination', 'accidental', 'euthanasia'])
  causeCategory: string;

  @ApiPropertyOptional({ description: '详细死亡原因描述' })
  @IsOptional()
  @IsString()
  causeDescription?: string;

  @ApiPropertyOptional({ description: '发现人' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  foundBy?: string;

  @ApiPropertyOptional({ description: '确认兽医' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  confirmingVet?: string;

  @ApiProperty({
    description: '处置方式',
    enum: ['necropsy', 'incineration', 'cryopreservation'],
  })
  @IsEnum(['necropsy', 'incineration', 'cryopreservation'])
  disposalMethod: string;

  @ApiPropertyOptional({
    description: '尸检状态',
    enum: ['not_needed', 'pending', 'completed'],
  })
  @IsOptional()
  @IsEnum(['not_needed', 'pending', 'completed'])
  necropsyStatus?: string;

  @ApiPropertyOptional({ description: '尸检报告', type: CreateNecropsyReportDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateNecropsyReportDto)
  necropsyReport?: CreateNecropsyReportDto;
}
