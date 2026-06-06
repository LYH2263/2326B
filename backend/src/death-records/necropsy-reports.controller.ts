import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { NecropsyReportsService } from './necropsy-reports.service';
import { CreateNecropsyReportDto } from './dto/create-necropsy-report.dto';
import { UpdateNecropsyReportDto } from './dto/update-necropsy-report.dto';

const imageFileFilter = (req: any, file: any, callback: any) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return callback(new BadRequestException('只允许上传图片文件'), false);
  }
  callback(null, true);
};

const editFileName = (req: any, file: any, callback: any) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(16)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

@ApiTags('尸检报告')
@Controller('necropsy-reports')
export class NecropsyReportsController {
  constructor(private readonly necropsyReportsService: NecropsyReportsService) {}

  @Post('death-record/:deathRecordId')
  @ApiOperation({ summary: '创建尸检报告' })
  create(
    @Param('deathRecordId', ParseIntPipe) deathRecordId: number,
    @Body() dto: CreateNecropsyReportDto,
  ) {
    return this.necropsyReportsService.create(deathRecordId, dto);
  }

  @Get()
  @ApiOperation({ summary: '查询尸检报告列表' })
  findAll() {
    return this.necropsyReportsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取尸检报告详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.necropsyReportsService.findOne(id);
  }

  @Get('death-record/:deathRecordId')
  @ApiOperation({ summary: '根据死亡记录ID获取尸检报告' })
  findByDeathRecordId(@Param('deathRecordId', ParseIntPipe) deathRecordId: number) {
    return this.necropsyReportsService.findByDeathRecordId(deathRecordId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新尸检报告' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNecropsyReportDto,
  ) {
    return this.necropsyReportsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除尸检报告' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.necropsyReportsService.remove(id);
  }

  @Post(':id/upload-image')
  @ApiOperation({ summary: '上传尸检图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/necropsy',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }
    const imageUrl = `/uploads/necropsy/${file.filename}`;
    return this.necropsyReportsService.addImage(id, imageUrl);
  }

  @Delete(':id/images')
  @ApiOperation({ summary: '删除尸检图片' })
  removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Body('imageUrl') imageUrl: string,
  ) {
    return this.necropsyReportsService.removeImage(id, imageUrl);
  }
}
