import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty({ description: '物品名称', example: '青霉素' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: '类别', enum: ['drug', 'consumable', 'reagent', 'equipment'] })
  @IsEnum(['drug', 'consumable', 'reagent', 'equipment'])
  category: string;

  @ApiPropertyOptional({ description: '规格', example: '100万单位/瓶' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  specification?: string;

  @ApiProperty({ description: '单位', example: '瓶' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unit: string;

  @ApiProperty({ description: '当前库存数量', example: 50 })
  @IsNumber()
  currentQuantity: number;

  @ApiProperty({ description: '安全库存量', example: 10 })
  @IsNumber()
  safetyStock: number;

  @ApiPropertyOptional({ description: '存储位置', example: 'A区-药品柜-1层' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  storageLocation?: string;

  @ApiPropertyOptional({ description: '有效期截止日期', example: '2027-12-31' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: '供应商', example: '国药集团' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplier?: string;

  @ApiPropertyOptional({ description: '单价', example: 25.5 })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}
