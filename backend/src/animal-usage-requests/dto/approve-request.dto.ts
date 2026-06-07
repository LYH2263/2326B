import {
  IsArray,
  IsString,
  IsOptional,
  ArrayNotEmpty,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveRequestDto {
  @ApiProperty({ description: '分配的动物ID列表' })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  animalIds: number[];

  @ApiPropertyOptional({ description: '审批意见' })
  @IsOptional()
  @IsString()
  approvalComment?: string;
}

export class RejectRequestDto {
  @ApiProperty({ description: '拒绝原因' })
  @IsString()
  approvalComment: string;
}
