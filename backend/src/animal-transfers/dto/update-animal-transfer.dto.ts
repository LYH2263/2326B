import { PartialType } from '@nestjs/swagger';
import { CreateAnimalTransferDto } from './create-animal-transfer.dto';

export class UpdateAnimalTransferDto extends PartialType(CreateAnimalTransferDto) {}
