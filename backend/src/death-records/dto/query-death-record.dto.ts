import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryDeathRecordDto {
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

  @ApiPropertyOptional({ description: '死亡原因分类' })
  @IsOptional()
  @IsEnum(['natural', 'experiment_termination', 'accidental', 'euthanasia'])
  causeCategory?: string;

  @ApiPropertyOptional({ description: '处置方式' })
  @IsOptional()
  @IsEnum(['necropsy', 'incineration', 'cryopreservation'])
  disposalMethod?: string;

  @ApiPropertyOptional({ description: '尸检状态' })
  @IsOptional()
  @IsEnum(['not_needed', 'pending', 'completed'])
  necropsyStatus?: string;
}
