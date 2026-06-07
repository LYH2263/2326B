import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, Brackets } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { AnimalPhoto } from './entities/animal-photo.entity';
import { CreateAnimalPhotoDto } from './dto/create-animal-photo.dto';
import { UpdateAnimalPhotoDto } from './dto/update-animal-photo.dto';
import { QueryAnimalPhotoDto } from './dto/query-animal-photo.dto';

@Injectable()
export class AnimalPhotosService {
  private readonly logger = new Logger(AnimalPhotosService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'animal-photos');
  private readonly thumbnailDir = path.join(process.cwd(), 'uploads', 'animal-photos', 'thumbnails');

  constructor(
    @InjectRepository(AnimalPhoto)
    private readonly photoRepository: Repository<AnimalPhoto>,
  ) {
    this.ensureDirs();
  }

  private ensureDirs() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.thumbnailDir)) {
      fs.mkdirSync(this.thumbnailDir, { recursive: true });
    }
  }

  async uploadPhotos(
    animalId: number,
    files: Express.Multer.File[],
    dto: Partial<CreateAnimalPhotoDto>,
  ): Promise<AnimalPhoto[]> {
    const results: AnimalPhoto[] = [];

    for (const file of files) {
      try {
        const originalFilename = file.originalname;
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const ext = path.extname(originalFilename).toLowerCase();
        const baseName = `${timestamp}-${randomStr}`;
        const fileName = `${baseName}${ext}`;
        const thumbName = `${baseName}_thumb${ext}`;

        const filePath = path.join(this.uploadDir, fileName);
        const thumbPath = path.join(this.thumbnailDir, thumbName);

        fs.writeFileSync(filePath, file.buffer);

        try {
          await sharp(file.buffer)
            .resize(300, 300, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .toFile(thumbPath);
        } catch (sharpError) {
          this.logger.warn(`缩略图生成失败，使用原图: ${sharpError.message}`);
          fs.copyFileSync(filePath, thumbPath);
        }

        const photo = this.photoRepository.create({
          animalId,
          imageUrl: `/uploads/animal-photos/${fileName}`,
          thumbnailUrl: `/uploads/animal-photos/thumbnails/${thumbName}`,
          fileSize: file.size,
          originalFilename,
          shotDate: dto.shotDate ? new Date(dto.shotDate) : null,
          tags: dto.tags || [],
          description: dto.description || '',
          uploader: dto.uploader || '',
        });

        const saved = await this.photoRepository.save(photo);
        results.push(saved);
        this.logger.log(`上传图片成功: ${saved.id} - ${originalFilename}`);
      } catch (error) {
        this.logger.error(`上传图片失败: ${originalFilename} - ${error.message}`);
      }
    }

    return results;
  }

  async findAll(query: QueryAnimalPhotoDto): Promise<{ list: AnimalPhoto[]; total: number }> {
    const {
      page = 1,
      pageSize = 20,
      animalId,
      tags,
      startDate,
      endDate,
      keyword,
    } = query;

    const qb = this.photoRepository.createQueryBuilder('photo');

    if (animalId) {
      qb.andWhere('photo.animalId = :animalId', { animalId });
    }

    if (tags && tags.trim()) {
      const tagList = tags.split(',').filter(t => t.trim());
      if (tagList.length > 0) {
        qb.andWhere(
          new Brackets(qbTag => {
            for (let i = 0; i < tagList.length; i++) {
              qbTag.orWhere(`JSON_CONTAINS(photo.tags, :tag${i})`, { [`tag${i}`]: JSON.stringify(tagList[i]) });
            }
          })
        );
      }
    }

    if (startDate) {
      qb.andWhere('photo.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('photo.createdAt <= :endDate', { endDate: end });
    }

    if (keyword && keyword.trim()) {
      qb.andWhere(
        new Brackets(qbKw => {
          qbKw.where('photo.description LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('photo.originalFilename LIKE :keyword', { keyword: `%${keyword}%` });
        })
      );
    }

    qb.orderBy('photo.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);
    qb.leftJoinAndSelect('photo.animal', 'animal');

    const [list, total] = await qb.getManyAndCount();

    return { list, total };
  }

  async findByAnimalId(animalId: number, page = 1, pageSize = 20): Promise<{ list: AnimalPhoto[]; total: number }> {
    const [list, total] = await this.photoRepository.findAndCount({
      where: { animalId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total };
  }

  async findOne(id: number): Promise<AnimalPhoto> {
    const photo = await this.photoRepository.findOne({
      where: { id },
      relations: ['animal'],
    });
    if (!photo) {
      throw new NotFoundException(`图片 #${id} 不存在`);
    }
    return photo;
  }

  async update(id: number, dto: UpdateAnimalPhotoDto): Promise<AnimalPhoto> {
    const photo = await this.findOne(id);
    const updateData: any = {};
    if (dto.shotDate !== undefined) {
      updateData.shotDate = dto.shotDate ? new Date(dto.shotDate) : null;
    }
    if (dto.tags !== undefined) {
      updateData.tags = dto.tags;
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }
    Object.assign(photo, updateData);
    const updated = await this.photoRepository.save(photo);
    this.logger.log(`更新图片: ${updated.id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const photo = await this.findOne(id);

    const imagePath = path.join(process.cwd(), photo.imageUrl);
    const thumbPath = path.join(process.cwd(), photo.thumbnailUrl);

    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (e) {
      this.logger.warn(`删除原图失败: ${photo.imageUrl} - ${e.message}`);
    }

    try {
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    } catch (e) {
      this.logger.warn(`删除缩略图失败: ${photo.thumbnailUrl} - ${e.message}`);
    }

    await this.photoRepository.remove(photo);
    this.logger.log(`删除图片: ${id}`);
  }

  async getAllTags(): Promise<string[]> {
    const photos = await this.photoRepository.find({ select: ['tags'] });
    const tagSet = new Set<string>();
    for (const photo of photos) {
      if (photo.tags && Array.isArray(photo.tags)) {
        photo.tags.forEach(tag => tagSet.add(tag));
      }
    }
    return Array.from(tagSet).sort();
  }

  async searchByTags(tags: string[], page = 1, pageSize = 20): Promise<{ list: AnimalPhoto[]; total: number }> {
    const qb = this.photoRepository.createQueryBuilder('photo');

    if (tags && tags.length > 0) {
      qb.andWhere(
        new Brackets(qbTag => {
          for (let i = 0; i < tags.length; i++) {
            qbTag.orWhere(`JSON_CONTAINS(photo.tags, :tag${i})`, { [`tag${i}`]: JSON.stringify(tags[i]) });
          }
        })
      );
    }

    qb.orderBy('photo.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);
    qb.leftJoinAndSelect('photo.animal', 'animal');

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }
}
