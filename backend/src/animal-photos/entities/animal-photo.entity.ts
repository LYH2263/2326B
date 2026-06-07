import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Animal } from '../../animals/entities/animal.entity';

@Entity('animal_photos')
export class AnimalPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'animal_id' })
  animalId: number;

  @ManyToOne(() => Animal, (animal) => animal.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;

  @Column({ name: 'image_url', length: 500 })
  imageUrl: string;

  @Column({ name: 'thumbnail_url', length: 500 })
  thumbnailUrl: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'original_filename', length: 255 })
  originalFilename: string;

  @Column({ name: 'shot_date', type: 'date', nullable: true })
  shotDate: Date;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'uploader', length: 100, nullable: true })
  uploader: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
