import { IsOptional, IsString, IsDateString, MaxLength, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNecropsyReportDto {
  @ApiPropertyOptional({ description: '尸检日期', example: '2025-12-02' })
  @IsOptional()
  @IsDateString()
  necropsyDate?: string;

  @ApiPropertyOptional({ description: '执行人' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  performedBy?: string;

  @ApiPropertyOptional({ description: '大体观察结果' })
  @IsOptional()
  @IsString()
  grossFindings?: string;

  @ApiPropertyOptional({ description: '组织病理学发现' })
  @IsOptional()
  @IsString()
  histopathologyFindings?: string;

  @ApiPropertyOptional({ description: '最终诊断' })
  @IsOptional()
  @IsString()
  finalDiagnosis?: string;

  @ApiPropertyOptional({ description: '图片URL列表', type: [String] })
  @IsOptional()
  @IsArray()
  imageUrls?: string[];
}
