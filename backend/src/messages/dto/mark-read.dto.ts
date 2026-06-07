import { IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkReadDto {
  @ApiProperty({ description: '消息ID列表', example: [1, 2, 3] })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
