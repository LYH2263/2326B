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
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AnimalPhotosService } from './animal-photos.service';
import { CreateAnimalPhotoDto } from './dto/create-animal-photo.dto';
import { UpdateAnimalPhotoDto } from './dto/update-animal-photo.dto';
import { QueryAnimalPhotoDto } from './dto/query-animal-photo.dto';

const imageFileFilter = (req: any, file: any, callback: any) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
    return callback(new BadRequestException('仅允许上传 jpg/png/webp 格式图片'), false);
  }
  callback(null, true);
};

@ApiTags('动物图片管理')
@Controller('animal-photos')
export class AnimalPhotosController {
  constructor(private readonly animalPhotosService: AnimalPhotosService) {}

  @Post('upload/:animalId')
  @ApiOperation({ summary: '批量上传动物图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
      files: {
        type: 'array',
        items: { type: 'string', format: 'binary' },
      },
      shotDate: { type: 'string', format: 'date' },
      tags: { type: 'string', description: '标签，多个用逗号分隔' },
      description: { type: 'string' },
      uploader: { type: 'string' },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadPhotos(
    @Param('animalId', ParseIntPipe) animalId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的图片');
    }

    const dto: Partial<CreateAnimalPhotoDto> = {
      shotDate: body.shotDate,
      tags: body.tags ? body.tags.split(',').filter((t: string) => t.trim()),
      description: body.description,
      uploader: body.uploader,
    };

    return this.animalPhotosService.uploadPhotos(animalId, files, dto);
  }

  @Get()
  @ApiOperation({ summary: '查询图片列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'animalId', required: false })
  @ApiQuery({ name: 'tags', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  findAll(@Query() query: QueryAnimalPhotoDto) {
    return this.animalPhotosService.findAll(query);
  }

  @Get('animal/:animalId')
  @ApiOperation({ summary: '按动物查询图片列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  findByAnimalId(
    @Param('animalId', ParseIntPipe) animalId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.animalPhotosService.findByAnimalId(animalId, page, pageSize);
  }

  @Get('tags')
  @ApiOperation({ summary: '获取所有标签' })
  getAllTags() {
    return this.animalPhotosService.getAllTags();
  }

  @Get('search/tags')
  @ApiOperation({ summary: '按标签搜索图片' })
  @ApiQuery({ name: 'tags', required: true, description: '标签，多个用逗号分隔' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  searchByTags(
    @Query('tags') tags: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const tagList = tags ? tags.split(',').filter(t => t.trim());
    return this.animalPhotosService.searchByTags(tagList, page, pageSize);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取图片详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.animalPhotosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新图片信息' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnimalPhotoDto: UpdateAnimalPhotoDto,
  ) {
    return this.animalPhotosService.update(id, updateAnimalPhotoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除图片' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.animalPhotosService.remove(id);
  }
}
