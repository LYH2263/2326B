import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAnimalPhotoDto {
  @ApiPropertyOptional({ description: '页码' })
  page?: number;

  @ApiPropertyOptional({ description: '每页数量' })
  pageSize?: number;

  @ApiPropertyOptional({ description: '动物ID' })
  animalId?: number;

  @ApiPropertyOptional({ description: '标签，多个用逗号分隔' })
  tags?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  endDate?: string;

  @ApiPropertyOptional({ description: '关键词（搜索描述和文件名）' })
  keyword?: string;
}
