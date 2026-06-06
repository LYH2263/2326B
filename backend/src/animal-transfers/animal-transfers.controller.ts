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
import { AnimalTransfersService } from './animal-transfers.service';
import { CreateAnimalTransferDto } from './dto/create-animal-transfer.dto';
import { UpdateAnimalTransferDto } from './dto/update-animal-transfer.dto';
import { QueryAnimalTransferDto } from './dto/query-animal-transfer.dto';

@ApiTags('动物转移/借调记录')
@Controller('animal-transfers')
export class AnimalTransfersController {
  constructor(private readonly animalTransfersService: AnimalTransfersService) {}

  @Post()
  @ApiOperation({ summary: '创建动物转移/借调记录' })
  create(@Body() dto: CreateAnimalTransferDto) {
    return this.animalTransfersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询转移记录列表（支持筛选和分页）' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'animalId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'reason', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(@Query() query: QueryAnimalTransferDto) {
    return this.animalTransfersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取转移记录详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.animalTransfersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新转移记录（仅 pending 状态可编辑）' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnimalTransferDto,
  ) {
    return this.animalTransfersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除转移记录' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.animalTransfersService.remove(id);
  }

  @Post(':id/start-transit')
  @ApiOperation({ summary: '发起运输（pending → in_transit）' })
  startTransit(@Param('id', ParseIntPipe) id: number) {
    return this.animalTransfersService.startTransit(id);
  }

  @Post(':id/confirm-delivery')
  @ApiOperation({ summary: '确认送达（in_transit → completed）' })
  confirmDelivery(@Param('id', ParseIntPipe) id: number) {
    return this.animalTransfersService.confirmDelivery(id);
  }

  @Post(':id/confirm-return')
  @ApiOperation({ summary: '确认归还（completed → returned，仅借调类型）' })
  confirmReturn(@Param('id', ParseIntPipe) id: number) {
    return this.animalTransfersService.confirmReturn(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: '获取状态流转时间线' })
  async getTimeline(@Param('id', ParseIntPipe) id: number) {
    const transfer = await this.animalTransfersService.findOne(id);
    return this.animalTransfersService.getStatusTimeline(transfer);
  }
}
