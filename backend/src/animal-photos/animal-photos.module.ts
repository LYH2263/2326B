import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalPhotosController } from './animal-photos.controller';
import { AnimalPhotosService } from './animal-photos.service';
import { AnimalPhoto } from './entities/animal-photo.entity';
import { Animal } from '../animals/entities/animal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnimalPhoto, Animal])],
  controllers: [AnimalPhotosController],
  providers: [AnimalPhotosService],
  exports: [AnimalPhotosService],
})
export class AnimalPhotosModule {}
