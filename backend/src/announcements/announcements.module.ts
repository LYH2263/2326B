import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { Announcement } from './entities/announcement.entity';
import { User } from '../auth/entities/user.entity';
import { AuthHelper } from '../common/auth-helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement, User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'lab-animal-jwt-secret-2026',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, AuthHelper],
})
export class AnnouncementsModule {}
