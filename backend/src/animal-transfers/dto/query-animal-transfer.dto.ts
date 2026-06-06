import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAnimalTransferDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  page?: number;

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  pageSize?: number;

  @ApiPropertyOptional({ description: '动物ID' })
  animalId?: number;

  @ApiPropertyOptional({
    description: '状态',
    enum: ['pending', 'in_transit', 'completed', 'returned'],
  })
  status?: string;

  @ApiPropertyOptional({
    description: '转移原因',
    enum: ['experiment_borrow', 'permanent_transfer', 'return_to_supplier'],
  })
  reason?: string;

  @ApiPropertyOptional({ description: '开始日期（转移日期范围）', example: '2025-12-01' })
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期（转移日期范围）', example: '2025-12-31' })
  endDate?: string;
}
