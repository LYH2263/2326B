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
import { ExperimentMilestonesService } from './experiment-milestones.service';
import { CreateExperimentMilestoneDto } from './dto/create-experiment-milestone.dto';
import { UpdateExperimentMilestoneDto } from './dto/update-experiment-milestone.dto';
import { QueryExperimentMilestoneDto } from './dto/query-experiment-milestone.dto';

@ApiTags('实验里程碑')
@Controller('experiment-milestones')
export class ExperimentMilestonesController {
  constructor(
    private readonly milestonesService: ExperimentMilestonesService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建里程碑' })
  create(@Body() dto: CreateExperimentMilestoneDto) {
    return this.milestonesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询里程碑列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'experimentId', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('experimentId') experimentId?: number,
    @Query('status') status?: string,
    @Query('assignee') assignee?: string,
  ) {
    const query: QueryExperimentMilestoneDto & { page?: number; pageSize?: number } = {
      page,
      pageSize,
      experimentId: experimentId ? Number(experimentId) : undefined,
      status,
      assignee,
    };
    return this.milestonesService.findAll(query);
  }

  @Get('experiment/:experimentId')
  @ApiOperation({ summary: '根据实验ID获取里程碑列表' })
  findByExperimentId(@Param('experimentId', ParseIntPipe) experimentId: number) {
    return this.milestonesService.findByExperimentId(experimentId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取里程碑详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.milestonesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新里程碑' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExperimentMilestoneDto,
  ) {
    return this.milestonesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除里程碑' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.milestonesService.remove(id);
  }

  @Get('gantt/data')
  @ApiOperation({ summary: '获取甘特图数据' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getGanttData(
    @Query('status') status?: string,
    @Query('department') department?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.milestonesService.getGanttData({
      status,
      department,
      startDate,
      endDate,
    });
  }
}
