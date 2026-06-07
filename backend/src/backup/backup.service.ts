import { Injectable, Logger, OnModuleInit, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BackupRecord } from './entities/backup-record.entity';
import { QueryBackupDto } from './dto/query-backup.dto';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;
  private autoBackupEnabled: boolean = true;
  private autoBackupHour: number = 2;
  private autoBackupMinute: number = 0;
  private lastAutoBackupDate: string = '';
  private backupInProgress: boolean = false;

  constructor(
    @InjectRepository(BackupRecord)
    private readonly backupRepository: Repository<BackupRecord>,
  ) {
    this.backupDir = path.join(process.cwd(), 'uploads', 'backup');
    this.ensureBackupDir();
  }

  onModuleInit() {
    this.logger.log('Backup service initialized');
    this.startAutoBackupScheduler();
  }

  private ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.logger.log(`Backup directory created: ${this.backupDir}`);
    }
  }

  private getDbConfig() {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'root123456',
      database: process.env.DB_DATABASE || 'lab_animal_db',
    };
  }

  private startAutoBackupScheduler() {
    const checkInterval = 60 * 1000;
    setInterval(() => {
      if (!this.autoBackupEnabled || this.backupInProgress) return;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      if (now.getHours() === this.autoBackupHour &&
          now.getMinutes() === this.autoBackupMinute &&
          this.lastAutoBackupDate !== todayStr) {
        this.lastAutoBackupDate = todayStr;
        this.logger.log('Triggering scheduled auto backup');
        this.createBackup('auto').catch((err) => {
          this.logger.error('Auto backup failed', err);
        });
      }
    }, checkInterval);

    this.logger.log(`Auto backup scheduler started (daily at ${this.autoBackupHour}:${String(this.autoBackupMinute).padStart(2, '0')})`);
  }

  async createBackup(backupType: 'auto' | 'manual' = 'manual'): Promise<BackupRecord> {
    if (this.backupInProgress) {
      throw new BadRequestException('已有备份任务正在进行中，请稍候再试');
    }

    this.backupInProgress = true;
    const startTime = Date.now();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `backup_${backupType}_${timestamp}.sql`;
    const filePath = path.join(this.backupDir, fileName);

    const record = this.backupRepository.create({
      fileName,
      filePath,
      fileSize: 0,
      backupType,
      status: 'running',
      remark: backupType === 'auto' ? '定时自动备份' : '手动备份',
    });
    const savedRecord = await this.backupRepository.save(record);

    const dbConfig = this.getDbConfig();

    this.performBackup(savedRecord.id, filePath, dbConfig, startTime)
      .then(() => {
        this.backupInProgress = false;
      })
      .catch((err) => {
        this.backupInProgress = false;
        this.logger.error('Backup failed', err);
      });

    return savedRecord;
  }

  private async performBackup(
    recordId: number,
    filePath: string,
    dbConfig: any,
    startTime: number,
  ): Promise<void> {
    try {
      const mysqldumpCmd = this.findMysqldumpCommand();

      await new Promise<void>((resolve, reject) => {
        const args = [
          `-h${dbConfig.host}`,
          `-P${dbConfig.port}`,
          `-u${dbConfig.username}`,
          `--databases`,
          dbConfig.database,
          `--result-file=${filePath}`,
        ];

        if (dbConfig.password) {
          args.unshift(`-p${dbConfig.password}`);
        }

        const child = spawn(mysqldumpCmd, args, {
          env: { ...process.env },
          shell: true,
        });

        let errorOutput = '';
        child.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`mysqldump exited with code ${code}: ${errorOutput}`));
          }
        });

        child.on('error', (err) => {
          reject(err);
        });
      });

      const fileSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
      const duration = Date.now() - startTime;

      await this.backupRepository.update(recordId, {
        status: 'success',
        fileSize,
        durationMs: duration,
      });

      this.logger.log(`Backup completed: ${filePath} (${fileSize} bytes, ${duration}ms)`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      await this.backupRepository.update(recordId, {
        status: 'failed',
        durationMs: duration,
        remark: `备份失败: ${error.message}`,
      });

      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }

      throw error;
    }
  }

  private findMysqldumpCommand(): string {
    if (process.env.MYSQLDUMP_PATH) {
      return process.env.MYSQLDUMP_PATH;
    }
    return 'mysqldump';
  }

  private findMysqlCommand(): string {
    if (process.env.MYSQL_PATH) {
      return process.env.MYSQL_PATH;
    }
    return 'mysql';
  }

  async findAll(query: QueryBackupDto) {
    const { page, pageSize, keyword, backupType, status } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (keyword) {
      where.fileName = Like(`%${keyword}%`);
    }
    if (backupType) {
      where.backupType = backupType;
    }
    if (status) {
      where.status = status;
    }

    const [list, total] = await this.backupRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number): Promise<BackupRecord> {
    const record = await this.backupRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('备份记录不存在');
    }
    return record;
  }

  async downloadBackup(id: number): Promise<{ filePath: string; fileName: string }> {
    const record = await this.findOne(id);

    if (!fs.existsSync(record.filePath)) {
      throw new NotFoundException('备份文件不存在');
    }

    return {
      filePath: record.filePath,
      fileName: record.fileName,
    };
  }

  async restoreBackup(id: number, confirmText: string): Promise<BackupRecord> {
    if (confirmText !== '确认恢复') {
      throw new BadRequestException('确认文本不正确，请输入"确认恢复"');
    }

    const record = await this.findOne(id);

    if (!fs.existsSync(record.filePath)) {
      throw new BadRequestException('备份文件不存在，无法恢复');
    }

    if (this.backupInProgress) {
      throw new BadRequestException('有任务正在进行中，请稍候再试');
    }

    this.backupInProgress = true;
    const dbConfig = this.getDbConfig();

    try {
      const mysqlCmd = this.findMysqlCommand();

      await new Promise<void>((resolve, reject) => {
        const args = [
          `-h${dbConfig.host}`,
          `-P${dbConfig.port}`,
          `-u${dbConfig.username}`,
          dbConfig.database,
        ];

        if (dbConfig.password) {
          args.unshift(`-p${dbConfig.password}`);
        }

        const child = spawn(mysqlCmd, args, {
          env: { ...process.env },
          shell: true,
        });

        const fileStream = fs.createReadStream(record.filePath);
        fileStream.pipe(child.stdin);

        let errorOutput = '';
        child.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`mysql restore exited with code ${code}: ${errorOutput}`));
          }
        });

        child.on('error', (err) => {
          reject(err);
        });
      });

      this.logger.log(`Backup restored successfully from: ${record.fileName}`);
      return record;
    } catch (error: any) {
      throw new BadRequestException(`恢复失败: ${error.message}`);
    } finally {
      this.backupInProgress = false;
    }
  }

  async cleanupOldBackups(days: number): Promise<{ deletedCount: number; deletedRecords: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const oldRecords = await this.backupRepository
      .createQueryBuilder('backup')
      .where('backup.created_at < :cutoffDate', { cutoffDate })
      .andWhere('backup.status = :status', { status: 'success' })
      .getMany();

    let deletedFiles = 0;
    for (const record of oldRecords) {
      try {
        if (fs.existsSync(record.filePath)) {
          fs.unlinkSync(record.filePath);
          deletedFiles++;
        }
      } catch (err) {
        this.logger.error(`Failed to delete backup file: ${record.filePath}`, err);
      }
    }

    const result = await this.backupRepository
      .createQueryBuilder()
      .delete()
      .from(BackupRecord)
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Cleanup completed: deleted ${deletedFiles} files, ${result.affected} records older than ${days} days`);

    return {
      deletedCount: deletedFiles,
      deletedRecords: result.affected || 0,
    };
  }

  async deleteBackup(id: number): Promise<void> {
    const record = await this.findOne(id);

    if (fs.existsSync(record.filePath)) {
      try {
        fs.unlinkSync(record.filePath);
      } catch (err) {
        this.logger.error(`Failed to delete backup file: ${record.filePath}`, err);
      }
    }

    await this.backupRepository.delete(id);
  }

  getBackupStatus() {
    return {
      backupInProgress: this.backupInProgress,
      autoBackupEnabled: this.autoBackupEnabled,
      autoBackupTime: `${String(this.autoBackupHour).padStart(2, '0')}:${String(this.autoBackupMinute).padStart(2, '0')}`,
      backupDir: this.backupDir,
    };
  }

  setAutoBackupConfig(enabled: boolean, hour?: number, minute?: number) {
    this.autoBackupEnabled = enabled;
    if (hour !== undefined) {
      this.autoBackupHour = hour;
    }
    if (minute !== undefined) {
      this.autoBackupMinute = minute;
    }
    return this.getBackupStatus();
  }

  isBackupInProgress(): boolean {
    return this.backupInProgress;
  }
}
