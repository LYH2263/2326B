import { IsString, IsOptional, IsEnum, IsDateString, IsInt, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExperimentMilestoneDto {
  @ApiProperty({ description: '实验ID' })
  @IsInt()
  experimentId: number;

  @ApiProperty({ description: '里程碑名称' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: '计划日期' })
  @IsDateString()
  plannedDate: string;

  @ApiPropertyOptional({ description: '实际完成日期' })
  @IsOptional()
  @IsDateString()
  actualDate?: string;

  @ApiPropertyOptional({ description: '状态', enum: ['pending', 'completed', 'overdue'] })
  @IsOptional()
  @IsEnum(['pending', 'completed', 'overdue'])
  status?: string;

  @ApiPropertyOptional({ description: '负责人' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignee?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
