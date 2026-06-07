import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({ description: '公告标题', example: '系统维护通知' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: '公告内容（富文本）', example: '<p>系统将于本周六进行维护...</p>' })
  @IsString()
  content: string;

  @ApiProperty({ description: '公告类型', enum: ['notice', 'warning', 'update'] })
  @IsEnum(['notice', 'warning', 'update'])
  type: string;

  @ApiPropertyOptional({ description: '是否置顶', example: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiProperty({ description: '状态', enum: ['draft', 'published', 'archived'] })
  @IsEnum(['draft', 'published', 'archived'])
  status: string;
}
