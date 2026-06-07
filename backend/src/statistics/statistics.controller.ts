import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import dayjs from 'dayjs';

@ApiTags('数据统计')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取总览统计数据' })
  getOverview() {
    return this.statisticsService.getOverview();
  }

  @Get('animals')
  @ApiOperation({ summary: '获取动物统计数据' })
  getAnimalStatistics() {
    return this.statisticsService.getAnimalStatistics();
  }

  @Get('experiments')
  @ApiOperation({ summary: '获取实验统计数据' })
  getExperimentStatistics() {
    return this.statisticsService.getExperimentStatistics();
  }

  @Get('feeding')
  @ApiOperation({ summary: '获取饲养统计数据' })
  getFeedingStatistics() {
    return this.statisticsService.getFeedingStatistics();
  }

  @Get('workstation/todo')
  @ApiOperation({ summary: '获取今日待办列表' })
  @ApiQuery({ name: 'date', required: false, description: '日期，格式YYYY-MM-DD，默认今天' })
  getWorkstationTodo(@Query('date') date?: string) {
    const today = date || dayjs().format('YYYY-MM-DD');
    return this.statisticsService.getWorkstationTodo(today);
  }

  @Get('workstation/progress')
  @ApiOperation({ summary: '获取今日工作完成进度' })
  @ApiQuery({ name: 'date', required: false, description: '日期，格式YYYY-MM-DD，默认今天' })
  getWorkstationProgress(@Query('date') date?: string) {
    const today = date || dayjs().format('YYYY-MM-DD');
    return this.statisticsService.getWorkstationProgress(today);
  }

  @Get('workstation/cages')
  @ApiOperation({ summary: '获取笼位列表' })
  getCageList() {
    return this.statisticsService.getCageList();
  }

  @Get('workstation/animals-by-cage')
  @ApiOperation({ summary: '按笼位获取动物列表' })
  @ApiQuery({ name: 'cageNumber', required: true, description: '笼位编号' })
  getAnimalsByCage(@Query('cageNumber') cageNumber: string) {
    return this.statisticsService.getAnimalsByCage(cageNumber);
  }
}
