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
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AuthHelper } from '../common/auth-helper';

@ApiTags('公告管理')
@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly authHelper: AuthHelper,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建公告（仅管理员）' })
  async create(
    @Headers('authorization') auth: string,
    @Body() createAnnouncementDto: CreateAnnouncementDto,
  ) {
    const user = await this.authHelper.requireAdmin(auth);
    return this.announcementsService.create(createAnnouncementDto, user);
  }

  @Get()
  @ApiOperation({ summary: '查询公告列表（管理端，仅管理员' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  async findAll(
    @Headers('authorization') auth: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    await this.authHelper.requireAdmin(auth);
    return this.announcementsService.findAll({
      page,
      pageSize,
      type,
      status,
      keyword,
    });
  }

  @Get('published')
  @ApiOperation({ summary: '获取已发布公告列表（所有用户）' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'type', required: false })
  findPublished(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('type') type?: string,
  ) {
    return this.announcementsService.findPublished({ page, pageSize, type });
  }

  @Get('latest')
  @ApiOperation({ summary: '获取最新公告（所有用户）' })
  @ApiQuery({ name: 'limit', required: false })
  getLatest(@Query('limit') limit?: number) {
    return this.announcementsService.getLatestPublished(limit || 5);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取公告详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新公告（仅管理员）' })
  async update(
    @Headers('authorization') auth: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    await this.authHelper.requireAdmin(auth);
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除公告（仅管理员）' })
  async remove(
    @Headers('authorization') auth: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.authHelper.requireAdmin(auth);
    await this.announcementsService.remove(id);
  }
}
