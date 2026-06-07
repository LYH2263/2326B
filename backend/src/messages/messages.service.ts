import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async send(createMessageDto: CreateMessageDto, sender: User): Promise<Message> {
    const receiver = await this.userRepository.findOne({
      where: { id: createMessageDto.receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('接收人不存在');
    }

    const message = this.messageRepository.create({
      ...createMessageDto,
      senderId: sender.id,
      sendTime: new Date(),
    });
    const saved = await this.messageRepository.save(message);
    this.logger.log(`Message sent: ${saved.id} from ${sender.id} to ${createMessageDto.receiverId}`);
    return saved;
  }

  async getInbox(
    userId: number,
    query: {
      page?: number;
      pageSize?: number;
      isRead?: boolean;
      keyword?: string;
    },
  ): Promise<{ list: Message[]; total: number }> {
    const { page = 1, pageSize = 10, isRead, keyword } = query;

    const qb = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.receiverId = :userId', { userId });

    if (isRead !== undefined) {
      qb.andWhere('message.isRead = :isRead', { isRead });
    }
    if (keyword) {
      qb.andWhere('message.title LIKE :keyword', { keyword: `%${keyword}%` });
    }

    qb.orderBy('message.sendTime', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return { list, total };
  }

  async getOutbox(
    userId: number,
    query: {
      page?: number;
      pageSize?: number;
      keyword?: string;
    },
  ): Promise<{ list: Message[]; total: number }> {
    const { page = 1, pageSize = 10, keyword } = query;

    const qb = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where('message.senderId = :userId', { userId });

    if (keyword) {
      qb.andWhere('message.title LIKE :keyword', { keyword: `%${keyword}%` });
    }

    qb.orderBy('message.sendTime', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return { list, total };
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.messageRepository.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });
  }

  async findOne(id: number, userId: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver'],
    });
    if (!message) {
      throw new NotFoundException(`消息 #${id} 不存在`);
    }
    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new ForbiddenException('无权查看此消息');
    }
    return message;
  }

  async markAsRead(id: number, userId: number): Promise<Message> {
    const message = await this.findOne(id, userId);
    if (message.receiverId !== userId) {
      throw new ForbiddenException('只能标记收件箱消息为已读');
    }
    if (!message.isRead) {
      message.isRead = true;
      await this.messageRepository.save(message);
    }
    return message;
  }

  async batchMarkAsRead(ids: number[], userId: number): Promise<number> {
    const messages = await this.messageRepository.find({
      where: {
        id: In(ids),
        receiverId: userId,
        isRead: false,
      },
    });

    if (messages.length === 0) return 0;

    messages.forEach((msg) => { msg.isRead = true; });
    await this.messageRepository.save(messages);
    this.logger.log(`Batch marked ${messages.length} messages as read for user ${userId}`);
    return messages.length;
  }
}
