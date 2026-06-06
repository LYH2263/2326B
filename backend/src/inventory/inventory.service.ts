import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryInventoryItemDto } from './dto/query-inventory-item.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import dayjs from 'dayjs';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepository: Repository<InventoryTransaction>,
  ) {}

  // ========== 物品 CRUD ==========

  async createItem(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    const item = this.itemRepository.create(dto);
    const saved = await this.itemRepository.save(item);
    this.logger.log(`Created inventory item: ${saved.id} - ${saved.name}`);
    return saved;
  }

  async findAllItems(query: QueryInventoryItemDto): Promise<{ list: InventoryItem[]; total: number }> {
    const { page = 1, pageSize = 10, category, keyword, supplier, warningOnly } = query;
    const where: any = {};

    if (category) where.category = category;
    if (supplier) where.supplier = supplier;
    if (keyword) where.name = Like(`%${keyword}%`);

    const qb = this.itemRepository.createQueryBuilder('item');

    if (category) qb.andWhere('item.category = :category', { category });
    if (supplier) qb.andWhere('item.supplier = :supplier', { supplier });
    if (keyword) qb.andWhere('item.name LIKE :keyword', { keyword: `%${keyword}%` });

    if (warningOnly && warningOnly !== 'false') {
      const warningDate = dayjs().add(30, 'day').toDate();
      qb.andWhere(
        '(item.current_quantity <= item.safety_stock OR (item.expiry_date IS NOT NULL AND item.expiry_date <= :warningDate))',
        { warningDate },
      );
    }

    qb.orderBy('item.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return { list, total };
  }

  async findOneItem(id: number): Promise<InventoryItem> {
    const item = await this.itemRepository.findOne({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`库存物品 #${id} 不存在`);
    }
    return item;
  }

  async updateItem(id: number, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const item = await this.findOneItem(id);
    Object.assign(item, dto);
    const updated = await this.itemRepository.save(item);
    this.logger.log(`Updated inventory item: ${updated.id}`);
    return updated;
  }

  async removeItem(id: number): Promise<void> {
    const item = await this.findOneItem(id);
    await this.itemRepository.remove(item);
    this.logger.log(`Removed inventory item: ${id}`);
  }

  // ========== 库存事务 ==========

  async createTransaction(dto: CreateTransactionDto): Promise<InventoryTransaction> {
    const item = await this.findOneItem(dto.itemId);

    let quantity = Math.abs(dto.quantity);
    if (dto.type === 'out') {
      if (item.currentQuantity < quantity) {
        throw new BadRequestException('库存不足，无法出库');
      }
      quantity = -quantity;
    } else if (dto.type === 'adjust') {
      quantity = dto.quantity;
    }

    const transaction = this.transactionRepository.create({
      itemId: dto.itemId,
      type: dto.type,
      quantity,
      transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
      operator: dto.operator,
      experimentId: dto.experimentId,
      reason: dto.reason,
    });

    const savedTx = await this.transactionRepository.save(transaction);

    await this.recalculateStock(dto.itemId);

    this.logger.log(
      `Created inventory transaction: ${savedTx.id} - type: ${dto.type}, item: ${dto.itemId}, qty: ${quantity}`,
    );

    return savedTx;
  }

  async recalculateStock(itemId: number): Promise<void> {
    const result = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.quantity)', 'total')
      .where('tx.item_id = :itemId', { itemId })
      .getRawOne();

    const total = result?.total ? parseFloat(result.total) : 0;

    await this.itemRepository.update(itemId, { currentQuantity: total });
  }

  async findTransactions(
    query: QueryTransactionDto,
  ): Promise<{ list: InventoryTransaction[]; total: number }> {
    const { page = 1, pageSize = 20, itemId, type, startDate, endDate } = query;

    const qb = this.transactionRepository.createQueryBuilder('tx');
    qb.leftJoinAndSelect('tx.item', 'item');

    if (itemId) qb.andWhere('tx.item_id = :itemId', { itemId });
    if (type) qb.andWhere('tx.type = :type', { type });
    if (startDate) qb.andWhere('tx.transaction_date >= :startDate', { startDate: new Date(startDate) });
    if (endDate) qb.andWhere('tx.transaction_date <= :endDate', { endDate: new Date(endDate + ' 23:59:59') });

    qb.orderBy('tx.transaction_date', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return { list, total };
  }

  // ========== 预警查询 ==========

  async getWarnings(): Promise<{
    lowStock: InventoryItem[];
    expiringSoon: InventoryItem[];
    total: number;
  }> {
    const warningDate = dayjs().add(30, 'day').toDate();

    const lowStock = await this.itemRepository
      .createQueryBuilder('item')
      .where('item.current_quantity <= item.safety_stock')
      .orderBy('item.current_quantity', 'ASC')
      .getMany();

    const expiringSoon = await this.itemRepository
      .createQueryBuilder('item')
      .where('item.expiry_date IS NOT NULL')
      .andWhere('item.expiry_date <= :warningDate', { warningDate })
      .orderBy('item.expiry_date', 'ASC')
      .getMany();

    const allIds = new Set([...lowStock.map((i) => i.id), ...expiringSoon.map((i) => i.id)]);

    return {
      lowStock,
      expiringSoon,
      total: allIds.size,
    };
  }

  // ========== 统计汇总 ==========

  async getCategorySummary(): Promise<{ category: string; count: number; totalQty: number }[]> {
    return this.itemRepository
      .createQueryBuilder('item')
      .select('item.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(item.current_quantity)', 'totalQty')
      .groupBy('item.category')
      .getRawMany();
  }

  async getStockTrend(itemId: number, days: number = 30): Promise<{ date: string; quantity: number }[]> {
    const startDate = dayjs().subtract(days, 'day').startOf('day').toDate();

    const transactions = await this.transactionRepository
      .createQueryBuilder('tx')
      .where('tx.item_id = :itemId', { itemId })
      .andWhere('tx.transaction_date >= :startDate', { startDate })
      .orderBy('tx.transaction_date', 'ASC')
      .getMany();

    const result: { date: string; quantity: number }[] = [];
    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    let currentQty = item?.currentQuantity || 0;

    const dailyMap = new Map<string, number>();

    for (let i = days; i >= 0; i--) {
      const dateStr = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      dailyMap.set(dateStr, 0);
    }

    for (const tx of transactions) {
      const dateStr = dayjs(tx.transactionDate).format('YYYY-MM-DD');
      if (dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + parseFloat(tx.quantity as any));
      }
    }

    const dates = Array.from(dailyMap.keys()).sort();
    let runningTotal = currentQty;
    const reverseResult: { date: string; quantity: number }[] = [];

    for (let i = dates.length - 1; i >= 0; i--) {
      reverseResult.unshift({ date: dates[i], quantity: Number(runningTotal.toFixed(2)) });
      runningTotal -= dailyMap.get(dates[i]) || 0;
    }

    return reverseResult;
  }

  async getItemDetailWithTransactions(
    id: number,
    txPage: number = 1,
    txPageSize: number = 20,
  ): Promise<{ item: InventoryItem; transactions: { list: InventoryTransaction[]; total: number } }> {
    const item = await this.findOneItem(id);
    const transactions = await this.findTransactions({
      itemId: id,
      page: txPage,
      pageSize: txPageSize,
    });
    return { item, transactions };
  }
}
