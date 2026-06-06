import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalTransfersController } from './animal-transfers.controller';
import { AnimalTransfersService } from './animal-transfers.service';
import { AnimalTransfer } from './entities/animal-transfer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnimalTransfer])],
  controllers: [AnimalTransfersController],
  providers: [AnimalTransfersService],
  exports: [AnimalTransfersService],
})
export class AnimalTransfersModule {}
