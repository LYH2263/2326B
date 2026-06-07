import { IsNumber, IsOptional, IsString, IsDateString, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWeightRecordDto {
  @ApiProperty({ description: '动物ID' })
  @IsNumber()
  animalId: number;

  @ApiProperty({ description: '称重日期', example: '2025-12-01' })
  @IsDateString()
  weighDate: string;

  @ApiPropertyOptional({ description: '称重时间', example: '09:30:00' })
  @IsOptional()
  @IsString()
  weighTime?: string;

  @ApiProperty({ description: '体重(g)', example: 25.5 })
  @IsNumber()
  weight: number;

  @ApiPropertyOptional({ description: '称重者' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  weigher?: string;

  @ApiPropertyOptional({ description: '设备编号' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceNo?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BatchWeightItemDto {
  @ApiProperty({ description: '动物ID' })
  @IsNumber()
  animalId: number;

  @ApiProperty({ description: '体重(g)' })
  @IsNumber()
  weight: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BatchCreateWeightRecordDto {
  @ApiProperty({ description: '称重日期', example: '2025-12-01' })
  @IsDateString()
  weighDate: string;

  @ApiPropertyOptional({ description: '称重时间', example: '09:30:00' })
  @IsOptional()
  @IsString()
  weighTime?: string;

  @ApiPropertyOptional({ description: '称重者' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  weigher?: string;

  @ApiPropertyOptional({ description: '设备编号' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceNo?: string;

  @ApiProperty({ description: '称重数据列表', type: [BatchWeightItemDto] })
  @IsNotEmpty({ message: '称重数据列表不能为空' })
  items: BatchWeightItemDto[];
}
