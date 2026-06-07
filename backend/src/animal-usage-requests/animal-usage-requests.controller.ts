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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnimalUsageRequestsService } from './animal-usage-requests.service';
import { CreateAnimalUsageRequestDto } from './dto/create-animal-usage-request.dto';
import { UpdateAnimalUsageRequestDto } from './dto/update-animal-usage-request.dto';
import { QueryAnimalUsageRequestDto } from './dto/query-animal-usage-request.dto';
import { ApproveRequestDto, RejectRequestDto } from './dto/approve-request.dto';

@ApiTags('动物使用申请')
@Controller('animal-usage-requests')
export class AnimalUsageRequestsController {
  constructor(
    private readonly animalUsageRequestsService: AnimalUsageRequestsService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建动物使用申请（草稿）' })
  create(@Body() dto: CreateAnimalUsageRequestDto, @Request() req: any) {
    const applicantId = req.user?.id || 1;
    return this.animalUsageRequestsService.create(dto, applicantId);
  }

  @Get()
  @ApiOperation({ summary: '查询申请列表（支持筛选和分页）' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'applicantId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'species', required: false })
  @ApiQuery({ name: 'experimentId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(@Query() query: QueryAnimalUsageRequestDto) {
    return this.animalUsageRequestsService.findAll(query);
  }

  @Get('mine')
  @ApiOperation({ summary: '获取我的申请列表' })
  findMyRequests(@Query() query: QueryAnimalUsageRequestDto, @Request() req: any) {
    const applicantId = req.user?.id || 1;
    return this.animalUsageRequestsService.findAll({
      ...query,
      applicantId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取申请详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.animalUsageRequestsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新申请（仅草稿状态可编辑）' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnimalUsageRequestDto,
    @Request() req: any,
  ) {
    const applicantId = req.user?.id || 1;
    return this.animalUsageRequestsService.update(id, dto, applicantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除申请（仅草稿状态）' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const applicantId = req.user?.id || 1;
    return this.animalUsageRequestsService.remove(id, applicantId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交申请（draft → submitted）' })
  submit(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const applicantId = req.user?.id || 1;
    return this.animalUsageRequestsService.submit(id, applicantId);
  }

  @Post(':id/withdraw')
  @ApiOperation({ summary: '撤回申请（submitted/approved → withdrawn）' })
  withdraw(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const applicantId = req.user?.id || 1;
    return this.animalUsageRequestsService.withdraw(id, applicantId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '审批通过（submitted → approved，分配动物）' })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveRequestDto,
    @Request() req: any,
  ) {
    const approverId = req.user?.id || 1;
    return this.animalUsageRequestsService.approve(id, dto, approverId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '审批拒绝（submitted → rejected）' })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectRequestDto,
    @Request() req: any,
  ) {
    const approverId = req.user?.id || 1;
    return this.animalUsageRequestsService.reject(id, dto, approverId);
  }

  @Get(':id/available-animals')
  @ApiOperation({ summary: '获取可分配的动物列表' })
  getAvailableAnimals(@Param('id', ParseIntPipe) id: number) {
    return this.animalUsageRequestsService.getAvailableAnimals(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: '获取状态流转时间线' })
  async getTimeline(@Param('id', ParseIntPipe) id: number) {
    const request = await this.animalUsageRequestsService.findOne(id);
    return this.animalUsageRequestsService.getStatusTimeline(request);
  }
}
