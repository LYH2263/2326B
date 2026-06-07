import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsArray } from 'class-validator';

export class UpdateAnimalPhotoDto {
  @ApiPropertyOptional({ description: '拍摄日期' })
  @IsOptional()
  @IsDateString()
  shotDate?: string;

  @ApiPropertyOptional({ description: '标签', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;
}
