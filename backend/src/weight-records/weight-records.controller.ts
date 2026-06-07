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
import { WeightRecordsService } from './weight-records.service';
import { CreateWeightRecordDto, BatchCreateWeightRecordDto } from './dto/create-weight-record.dto';
import { UpdateWeightRecordDto } from './dto/update-weight-record.dto';
import { QueryWeightRecordDto } from './dto/query-weight-record.dto';

@ApiTags('称重记录')
@Controller('weight-records')
export class WeightRecordsController {
  constructor(private readonly weightRecordsService: WeightRecordsService) {}

  @Post()
  @ApiOperation({ summary: '添加称重记录' })
  create(@Body() dto: CreateWeightRecordDto) {
    return this.weightRecordsService.create(dto);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量添加称重记录' })
  batchCreate(@Body() dto: BatchCreateWeightRecordDto) {
    return this.weightRecordsService.batchCreate(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询称重记录列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'animalId', required: false })
  @ApiQuery({ name: 'cageNumber', required: false })
  @ApiQuery({ name: 'species', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'weigher', required: false })
  findAll(@Query() query: QueryWeightRecordDto) {
    return this.weightRecordsService.findAll(query);
  }

  @Get('cages')
  @ApiOperation({ summary: '获取所有笼位列表' })
  getCageList() {
    return this.weightRecordsService.getCageList();
  }

  @Get('animals-by-cage')
  @ApiOperation({ summary: '按笼位获取动物列表（含最近体重）' })
  @ApiQuery({ name: 'cageNumber', required: false })
  getAnimalsByCage(@Query('cageNumber') cageNumber?: string) {
    return this.weightRecordsService.getAnimalsByCage(cageNumber);
  }

  @Get('growth-rate/:animalId')
  @ApiOperation({ summary: '获取指定动物的体重增长率' })
  getGrowthRate(@Param('animalId', ParseIntPipe) animalId: number) {
    return this.weightRecordsService.getGrowthRate(animalId);
  }

  @Get('statistics/group')
  @ApiOperation({ summary: '获取群体体重统计' })
  @ApiQuery({ name: 'cageNumber', required: false })
  @ApiQuery({ name: 'species', required: false })
  @ApiQuery({ name: 'breed', required: false })
  getGroupStatistics(
    @Query('cageNumber') cageNumber?: string,
    @Query('species') species?: string,
    @Query('breed') breed?: string,
  ) {
    return this.weightRecordsService.getGroupStatistics({ cageNumber, species, breed });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取称重记录详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.weightRecordsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新称重记录' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWeightRecordDto,
  ) {
    return this.weightRecordsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除称重记录' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.weightRecordsService.remove(id);
  }
}
