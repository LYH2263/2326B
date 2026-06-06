import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  AnimalTransfer,
  TransferStatus,
  TransferReason,
} from './entities/animal-transfer.entity';
import { CreateAnimalTransferDto } from './dto/create-animal-transfer.dto';
import { UpdateAnimalTransferDto } from './dto/update-animal-transfer.dto';
import { QueryAnimalTransferDto } from './dto/query-animal-transfer.dto';

const BORROW_REASONS: TransferReason[] = ['experiment_borrow'];

@Injectable()
export class AnimalTransfersService {
  private readonly logger = new Logger(AnimalTransfersService.name);

  constructor(
    @InjectRepository(AnimalTransfer)
    private readonly transferRepository: Repository<AnimalTransfer>,
  ) {}

  async create(dto: CreateAnimalTransferDto): Promise<AnimalTransfer> {
    if (dto.reason === 'experiment_borrow' && !dto.expectedReturnDate) {
      throw new BadRequestException('借调类型必须填写预计归还日期');
    }
    if (dto.reason !== 'experiment_borrow' && dto.expectedReturnDate) {
      throw new BadRequestException('非借调类型无需填写预计归还日期');
    }

    const transfer = this.transferRepository.create(dto);
    transfer.status = 'pending';
    const saved = await this.transferRepository.save(transfer);
    this.logger.log(`Created animal transfer record: ${saved.id}`);
    return this.findOne(saved.id);
  }

  async findAll(
    query: QueryAnimalTransferDto,
  ): Promise<{ list: AnimalTransfer[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      animalId,
      status,
      reason,
      startDate,
      endDate,
    } = query;

    const where: any = {};

    if (animalId) where.animalId = animalId;
    if (status) where.status = status;
    if (reason) where.reason = reason;
    if (startDate && endDate) {
      where.transferDate = Between(new Date(startDate), new Date(endDate));
    }

    const [list, total] = await this.transferRepository.findAndCount({
      where,
      relations: ['animal'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total };
  }

  async findOne(id: number): Promise<AnimalTransfer> {
    const transfer = await this.transferRepository.findOne({
      where: { id },
      relations: ['animal'],
    });
    if (!transfer) {
      throw new NotFoundException(`转移记录 #${id} 不存在`);
    }
    return transfer;
  }

  async update(
    id: number,
    dto: UpdateAnimalTransferDto,
  ): Promise<AnimalTransfer> {
    const transfer = await this.findOne(id);

    if (transfer.status !== 'pending') {
      throw new BadRequestException('只有待处理状态的记录可以编辑');
    }

    const reason = dto.reason || transfer.reason;
    if (reason === 'experiment_borrow' && !dto.expectedReturnDate && !transfer.expectedReturnDate) {
      throw new BadRequestException('借调类型必须填写预计归还日期');
    }

    Object.assign(transfer, dto);
    const updated = await this.transferRepository.save(transfer);
    this.logger.log(`Updated animal transfer record: ${updated.id}`);
    return this.findOne(updated.id);
  }

  async remove(id: number): Promise<void> {
    const transfer = await this.findOne(id);
    await this.transferRepository.remove(transfer);
    this.logger.log(`Removed animal transfer record: ${id}`);
  }

  async startTransit(id: number): Promise<AnimalTransfer> {
    const transfer = await this.findOne(id);
    if (transfer.status !== 'pending') {
      throw new BadRequestException('只有待处理状态的记录可以发起运输');
    }
    transfer.status = 'in_transit';
    const updated = await this.transferRepository.save(transfer);
    this.logger.log(`Transfer ${id} status changed to in_transit`);
    return this.findOne(updated.id);
  }

  async confirmDelivery(id: number): Promise<AnimalTransfer> {
    const transfer = await this.findOne(id);
    if (transfer.status !== 'in_transit') {
      throw new BadRequestException('只有运输中状态的记录可以确认送达');
    }
    transfer.status = 'completed';
    const updated = await this.transferRepository.save(transfer);
    this.logger.log(`Transfer ${id} status changed to completed`);
    return this.findOne(updated.id);
  }

  async confirmReturn(id: number): Promise<AnimalTransfer> {
    const transfer = await this.findOne(id);
    if (!BORROW_REASONS.includes(transfer.reason)) {
      throw new BadRequestException('只有借调类型的记录才有归还流程');
    }
    if (transfer.status !== 'completed') {
      throw new BadRequestException('只有已完成状态的借调记录可以确认归还');
    }
    transfer.status = 'returned';
    transfer.actualReturnDate = new Date();
    const updated = await this.transferRepository.save(transfer);
    this.logger.log(`Transfer ${id} status changed to returned`);
    return this.findOne(updated.id);
  }

  getStatusTimeline(transfer: AnimalTransfer): Array<{
    status: TransferStatus;
    label: string;
    time: Date | null;
  }> {
    const timeline: Array<{
      status: TransferStatus;
      label: string;
      time: Date | null;
    }> = [
      { status: 'pending', label: '创建记录', time: transfer.createdAt },
      { status: 'in_transit', label: '运输中', time: null },
      { status: 'completed', label: '已送达', time: null },
    ];

    if (BORROW_REASONS.includes(transfer.reason)) {
      timeline.push({ status: 'returned', label: '已归还', time: null });
    }

    const statusOrder: TransferStatus[] = BORROW_REASONS.includes(transfer.reason)
      ? ['pending', 'in_transit', 'completed', 'returned']
      : ['pending', 'in_transit', 'completed'];

    const currentIndex = statusOrder.indexOf(transfer.status);

    for (let i = 0; i <= currentIndex; i++) {
      const status = statusOrder[i];
      if (i === 0) {
        timeline[i].time = transfer.createdAt;
      } else if (i === currentIndex) {
        timeline[i].time = transfer.updatedAt;
      }
    }

    if (transfer.status === 'returned' && transfer.actualReturnDate) {
      const returnedItem = timeline.find((t) => t.status === 'returned');
      if (returnedItem) {
        returnedItem.time = transfer.actualReturnDate;
      }
    }

    return timeline;
  }
}
