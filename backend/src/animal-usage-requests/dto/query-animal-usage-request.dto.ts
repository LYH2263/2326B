import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAnimalUsageRequestDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  page?: number;

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  pageSize?: number;

  @ApiPropertyOptional({ description: '申请人ID' })
  applicantId?: number;

  @ApiPropertyOptional({
    description: '审批状态',
    enum: ['draft', 'submitted', 'approved', 'rejected', 'withdrawn'],
  })
  status?: string;

  @ApiPropertyOptional({ description: '物种' })
  species?: string;

  @ApiPropertyOptional({ description: '实验项目ID' })
  experimentId?: number;

  @ApiPropertyOptional({ description: '开始日期（申请日期范围）', example: '2025-01-01' })
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期（申请日期范围）', example: '2025-12-31' })
  endDate?: string;
}
