import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsEnum } from 'class-validator';

export class QueryExperimentMilestoneDto {
  @ApiPropertyOptional({ description: '实验ID' })
  @IsOptional()
  @IsInt()
  experimentId?: number;

  @ApiPropertyOptional({ description: '状态', enum: ['pending', 'completed', 'overdue'] })
  @IsOptional()
  @IsEnum(['pending', 'completed', 'overdue'])
  status?: string;

  @ApiPropertyOptional({ description: '负责人' })
  @IsOptional()
  @IsString()
  assignee?: string;
}
