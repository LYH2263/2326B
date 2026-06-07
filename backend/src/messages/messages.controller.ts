import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Headers,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { AuthHelper } from '../common/auth-helper';

@ApiTags('站内信')
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly authHelper: AuthHelper,
  ) {}

  @Post()
  @ApiOperation({ summary: '发送站内信' })
  async send(
    @Headers('authorization') auth: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    const user = await this.authHelper.getUserFromToken(auth);
    return this.messagesService.send(createMessageDto, user);
  }

  @Get('inbox')
  @ApiOperation({ summary: '收件箱' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'isRead', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  async getInbox(
    @Headers('authorization') auth: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('isRead') isRead?: string,
    @Query('keyword') keyword?: string,
  ) {
    const userId = await this.authHelper.getUserIdFromToken(auth);
    return this.messagesService.getInbox(userId, {
      page,
      pageSize,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      keyword,
    });
  }

  @Get('outbox')
  @ApiOperation({ summary: '发件箱' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  async getOutbox(
    @Headers('authorization') auth: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
  ) {
    const userId = await this.authHelper.getUserIdFromToken(auth);
    return this.messagesService.getOutbox(userId, { page, pageSize, keyword });
  }

  @Get('unread-count')
  @ApiOperation({ summary: '未读消息数量' })
  async getUnreadCount(@Headers('authorization') auth: string) {
    const userId = await this.authHelper.getUserIdFromToken(auth);
    const count = await this.messagesService.getUnreadCount(userId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取消息详情' })
  async findOne(
    @Headers('authorization') auth: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = await this.authHelper.getUserIdFromToken(auth);
    return this.messagesService.findOne(id, userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '标记消息为已读' })
  async markAsRead(
    @Headers('authorization') auth: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = await this.authHelper.getUserIdFromToken(auth);
    return this.messagesService.markAsRead(id, userId);
  }

  @Post('batch-read')
  @ApiOperation({ summary: '批量标记已读' })
  async batchMarkAsRead(
    @Headers('authorization') auth: string,
    @Body() markReadDto: MarkReadDto,
  ) {
    const userId = await this.authHelper.getUserIdFromToken(auth);
    const updated = await this.messagesService.batchMarkAsRead(markReadDto.ids, userId);
    return { updated };
  }
}
