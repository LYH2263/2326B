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
import { DeathRecordsService } from './death-records.service';
import { CreateDeathRecordDto } from './dto/create-death-record.dto';
import { UpdateDeathRecordDto } from './dto/update-death-record.dto';
import { QueryDeathRecordDto } from './dto/query-death-record.dto';

@ApiTags('死亡记录')
@Controller('death-records')
export class DeathRecordsController {
  constructor(private readonly deathRecordsService: DeathRecordsService) {}

  @Post()
  @ApiOperation({ summary: '登记死亡记录' })
  create(@Body() dto: CreateDeathRecordDto) {
    return this.deathRecordsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询死亡记录列表' })
  findAll(@Query() query: QueryDeathRecordDto) {
    return this.deathRecordsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取死亡记录详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deathRecordsService.findOne(id);
  }

  @Get('animal/:animalId')
  @ApiOperation({ summary: '根据动物ID获取死亡记录' })
  findByAnimalId(@Param('animalId', ParseIntPipe) animalId: number) {
    return this.deathRecordsService.findByAnimalId(animalId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新死亡记录' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeathRecordDto,
  ) {
    return this.deathRecordsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除死亡记录' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deathRecordsService.remove(id);
  }

  @Get('stats/by-cause')
  @ApiOperation({ summary: '按死亡原因统计' })
  countByCauseCategory() {
    return this.deathRecordsService.countByCauseCategory();
  }

  @Get('stats/by-necropsy-status')
  @ApiOperation({ summary: '按尸检状态统计' })
  countByNecropsyStatus() {
    return this.deathRecordsService.countByNecropsyStatus();
  }
}
