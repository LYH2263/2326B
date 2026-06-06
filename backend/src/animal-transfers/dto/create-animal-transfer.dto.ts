import {
  IsNumber,
  IsEnum,
  IsString,
  IsDateString,
  IsOptional,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransferReason } from '../entities/animal-transfer.entity';

export class CreateAnimalTransferDto {
  @ApiProperty({ description: '动物ID' })
  @IsNumber()
  animalId: number;

  @ApiProperty({ description: '转出方（部门/实验室名称）' })
  @IsString()
  @MaxLength(100)
  fromDepartment: string;

  @ApiProperty({ description: '接收方（部门/实验室名称）' })
  @IsString()
  @MaxLength(100)
  toDepartment: string;

  @ApiProperty({
    description: '转移原因',
    enum: ['experiment_borrow', 'permanent_transfer', 'return_to_supplier'],
  })
  @IsEnum(['experiment_borrow', 'permanent_transfer', 'return_to_supplier'])
  reason: TransferReason;

  @ApiProperty({ description: '转移日期', example: '2025-12-01' })
  @IsDateString()
  transferDate: string;

  @ApiPropertyOptional({ description: '预计归还日期（借调时使用）', example: '2025-12-15' })
  @IsOptional()
  @ValidateIf((o: CreateAnimalTransferDto) => o.reason === 'experiment_borrow')
  @IsDateString()
  expectedReturnDate?: string;

  @ApiProperty({ description: '经办人' })
  @IsString()
  @MaxLength(100)
  handler: string;

  @ApiPropertyOptional({ description: '审批人' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  approver?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
