import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, MaxLength, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateAnimalPhotoDto {
  @ApiProperty({ description: '动物ID' })
  animalId: number;

  @ApiPropertyOptional({ description: '拍摄日期', example: '2025-06-15' })
  @IsOptional()
  @IsDateString()
  shotDate?: string;

  @ApiPropertyOptional({ description: '标签', type: [String], example: ['术前', '皮肤异常'] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '上传人' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  uploader?: string;
}
