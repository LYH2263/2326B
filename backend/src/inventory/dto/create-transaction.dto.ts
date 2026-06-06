import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, MaxLength, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ description: '物品ID', example: 1 })
  @IsInt()
  itemId: number;

  @ApiProperty({ description: '事务类型', enum: ['in', 'out', 'adjust'] })
  @IsEnum(['in', 'out', 'adjust'])
  type: string;

  @ApiProperty({ description: '数量（正数），系统自动处理正负号', example: 10 })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional({ description: '事务日期', example: '2026-06-07T10:00:00' })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({ description: '操作人', example: '张三' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  operator?: string;

  @ApiPropertyOptional({ description: '关联实验ID', example: 5 })
  @IsOptional()
  @IsInt()
  experimentId?: number;

  @ApiPropertyOptional({ description: '原因说明', example: '实验项目使用' })
  @IsOptional()
  @IsString()
  reason?: string;
}
