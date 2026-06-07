import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
  ) {}

  async create(
    createAnnouncementDto: CreateAnnouncementDto,
    publisher: User,
  ): Promise<Announcement> {
    const announcement = this.announcementRepository.create({
      ...createAnnouncementDto,
      publisherId: publisher.id,
      publishTime:
        createAnnouncementDto.status === 'published' ? new Date() : null,
    });
    const saved = await this.announcementRepository.save(announcement);
    this.logger.log(`Created announcement: ${saved.id} - ${saved.title}`);
    return saved;
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    type?: string;
    status?: string;
    keyword?: string;
  }): Promise<{ list: Announcement[]; total: number }> {
    const { page = 1, pageSize = 10, type, status, keyword } = query;

    const qb = this.announcementRepository
      .createQueryBuilder('announcement')
      .leftJoinAndSelect('announcement.publisher', 'publisher');

    if (type) qb.andWhere('announcement.type = :type', { type });
    if (status) qb.andWhere('announcement.status = :status', { status });
    if (keyword) {
      qb.andWhere('announcement.title LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    qb.orderBy('announcement.isPinned', 'DESC');
    qb.addOrderBy('announcement.publishTime', 'DESC');
    qb.addOrderBy('announcement.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return { list, total };
  }

  async findPublished(query: {
    page?: number;
    pageSize?: number;
    type?: string;
  }): Promise<{ list: Announcement[]; total: number }> {
    const { page = 1, pageSize = 10, type } = query;

    const qb = this.announcementRepository
      .createQueryBuilder('announcement')
      .leftJoinAndSelect('announcement.publisher', 'publisher')
      .where('announcement.status = :status', { status: 'published' });

    if (type) qb.andWhere('announcement.type = :type', { type });

    qb.orderBy('announcement.isPinned', 'DESC');
    qb.addOrderBy('announcement.publishTime', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return { list, total };
  }

  async getLatestPublished(limit: number = 5): Promise<Announcement[]> {
    return this.announcementRepository.find({
      where: { status: 'published' },
      relations: ['publisher'],
      order: {
        isPinned: 'DESC',
        publishTime: 'DESC',
      },
      take: limit,
    });
  }

  async findOne(id: number): Promise<Announcement> {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
      relations: ['publisher'],
    });
    if (!announcement) {
      throw new NotFoundException(`公告 #${id} 不存在`);
    }
    return announcement;
  }

  async update(
    id: number,
    updateAnnouncementDto: UpdateAnnouncementDto,
  ): Promise<Announcement> {
    const announcement = await this.findOne(id);
    const wasDraft = announcement.status === 'draft';
    Object.assign(announcement, updateAnnouncementDto);

    if (
      wasDraft &&
      updateAnnouncementDto.status === 'published' &&
      !announcement.publishTime
    ) {
      announcement.publishTime = new Date();
    }

    const updated = await this.announcementRepository.save(announcement);
    this.logger.log(`Updated announcement: ${updated.id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const announcement = await this.findOne(id);
    await this.announcementRepository.remove(announcement);
    this.logger.log(`Removed announcement: ${id}`);
  }
}
