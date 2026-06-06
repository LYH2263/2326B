import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryInventoryItemDto } from './dto/query-inventory-item.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@ApiTags('库存管理')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ========== 物品 CRUD ==========

  @Post('items')
  @ApiOperation({ summary: '添加库存物品' })
  createItem(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(dto);
  }

  @Get('items')
  @ApiOperation({ summary: '查询库存物品列表' })
  findAllItems(@Query() query: QueryInventoryItemDto) {
    return this.inventoryService.findAllItems(query);
  }

  @Get('items/warnings')
  @ApiOperation({ summary: '获取库存预警列表' })
  getWarnings() {
    return this.inventoryService.getWarnings();
  }

  @Get('items/category-summary')
  @ApiOperation({ summary: '按类别统计汇总' })
  getCategorySummary() {
    return this.inventoryService.getCategorySummary();
  }

  @Get('items/:id')
  @ApiOperation({ summary: '获取物品详情' })
  findOneItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findOneItem(id);
  }

  @Get('items/:id/detail')
  @ApiOperation({ summary: '获取物品详情（含流水）' })
  @ApiQuery({ name: 'txPage', required: false })
  @ApiQuery({ name: 'txPageSize', required: false })
  getItemDetailWithTransactions(
    @Param('id', ParseIntPipe) id: number,
    @Query('txPage') txPage?: number,
    @Query('txPageSize') txPageSize?: number,
  ) {
    return this.inventoryService.getItemDetailWithTransactions(id, txPage, txPageSize);
  }

  @Get('items/:id/trend')
  @ApiOperation({ summary: '获取物品库存变化趋势' })
  @ApiQuery({ name: 'days', required: false, description: '天数，默认30天' })
  getStockTrend(
    @Param('id', ParseIntPipe) id: number,
    @Query('days') days?: number,
  ) {
    return this.inventoryService.getStockTrend(id, days);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: '更新物品信息' })
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: '删除物品' })
  removeItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.removeItem(id);
  }

  // ========== 出入库事务 ==========

  @Post('transactions')
  @ApiOperation({ summary: '创建库存事务（入库/出库/盘点调整）' })
  createTransaction(@Body() dto: CreateTransactionDto) {
    return this.inventoryService.createTransaction(dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: '查询库存事务列表' })
  findTransactions(@Query() query: QueryTransactionDto) {
    return this.inventoryService.findTransactions(query);
  }
}
