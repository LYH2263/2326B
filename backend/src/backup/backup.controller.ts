import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Headers,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { BackupService } from './backup.service';
import { QueryBackupDto } from './dto/query-backup.dto';
import { RestoreBackupDto } from './dto/restore-backup.dto';
import { CleanupBackupDto } from './dto/cleanup-backup.dto';
import { AuthHelper } from '../common/auth-helper';
import * as fs from 'fs';

@ApiTags('数据备份与恢复')
@Controller('backup')
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly authHelper: AuthHelper,
  ) {}

  @Post('create')
  @ApiOperation({ summary: '触发数据库备份' })
  async createBackup(@Headers('authorization') authHeader: string) {
    await this.authHelper.requireAdmin(authHeader);
    return this.backupService.createBackup('manual');
  }

  @Get('records')
  @ApiOperation({ summary: '查询备份记录列表' })
  async findAll(@Query() query: QueryBackupDto) {
    return this.backupService.findAll(query);
  }

  @Get('records/:id')
  @ApiOperation({ summary: '获取备份记录详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.backupService.findOne(id);
  }

  @Get('download/:id')
  @ApiOperation({ summary: '下载备份文件' })
  async downloadBackup(
    @Headers('authorization') authHeader: string,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    await this.authHelper.getUserFromToken(authHeader);
    const { filePath, fileName } = await this.backupService.downloadBackup(id);

    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('备份文件不存在');
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Post('restore/:id')
  @ApiOperation({ summary: '从备份文件恢复数据（仅限admin，需二次确认）' })
  async restoreBackup(
    @Headers('authorization') authHeader: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RestoreBackupDto,
  ) {
    await this.authHelper.requireAdmin(authHeader);
    return this.backupService.restoreBackup(id, dto.confirmText);
  }

  @Post('cleanup')
  @ApiOperation({ summary: '清理超过N天的旧备份' })
  async cleanupOldBackups(
    @Headers('authorization') authHeader: string,
    @Body() dto: CleanupBackupDto,
  ) {
    await this.authHelper.requireAdmin(authHeader);
    return this.backupService.cleanupOldBackups(dto.days);
  }

  @Delete('records/:id')
  @ApiOperation({ summary: '删除指定备份记录及文件' })
  async deleteBackup(
    @Headers('authorization') authHeader: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.authHelper.requireAdmin(authHeader);
    await this.backupService.deleteBackup(id);
    return { message: '删除成功' };
  }

  @Get('status')
  @ApiOperation({ summary: '获取备份状态和配置' })
  getStatus() {
    return this.backupService.getBackupStatus();
  }

  @Post('auto-backup/config')
  @ApiOperation({ summary: '设置自动备份配置' })
  async setAutoBackupConfig(
    @Headers('authorization') authHeader: string,
    @Body() config: { enabled: boolean; hour?: number; minute?: number },
  ) {
    await this.authHelper.requireAdmin(authHeader);
    return this.backupService.setAutoBackupConfig(
      config.enabled,
      config.hour,
      config.minute,
    );
  }
}
