import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { BackupRecord } from './entities/backup-record.entity';
import { AuthHelper } from '../common/auth-helper';
import { User } from '../auth/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([BackupRecord, User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'lab-animal-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [BackupController],
  providers: [BackupService, AuthHelper],
  exports: [BackupService],
})
export class BackupModule {}
