import { IsString, IsOptional, IsNumber, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ description: '接收人ID', example: 2 })
  @IsNumber()
  receiverId: number;

  @ApiProperty({ description: '消息标题', example: '实验进度提醒' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: '消息内容', example: '请查看最新的实验进度...' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '关联资源类型', example: 'experiment' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  relatedType?: string;

  @ApiPropertyOptional({ description: '关联资源ID', example: 1 })
  @IsOptional()
  @IsNumber()
  relatedId?: number;
}
