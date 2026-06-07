import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource, In } from 'typeorm';
import {
  AnimalUsageRequest,
  RequestStatus,
} from './entities/animal-usage-request.entity';
import { CreateAnimalUsageRequestDto } from './dto/create-animal-usage-request.dto';
import { UpdateAnimalUsageRequestDto } from './dto/update-animal-usage-request.dto';
import { QueryAnimalUsageRequestDto } from './dto/query-animal-usage-request.dto';
import { ApproveRequestDto, RejectRequestDto } from './dto/approve-request.dto';
import { Animal } from '../animals/entities/animal.entity';
import { ExperimentAnimal } from '../experiments/entities/experiment-animal.entity';

@Injectable()
export class AnimalUsageRequestsService {
  private readonly logger = new Logger(AnimalUsageRequestsService.name);

  constructor(
    @InjectRepository(AnimalUsageRequest)
    private readonly requestRepository: Repository<AnimalUsageRequest>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    @InjectRepository(ExperimentAnimal)
    private readonly experimentAnimalRepository: Repository<ExperimentAnimal>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateAnimalUsageRequestDto,
    applicantId: number,
  ): Promise<AnimalUsageRequest> {
    const request = this.requestRepository.create({
      ...dto,
      applicantId,
      requestDate: new Date(),
      status: 'draft',
    });
    const saved = await this.requestRepository.save(request);
    this.logger.log(`Created animal usage request: ${saved.id} by user ${applicantId}`);
    return this.findOne(saved.id);
  }

  async findAll(
    query: QueryAnimalUsageRequestDto,
  ): Promise<{ list: AnimalUsageRequest[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      applicantId,
      status,
      species,
      experimentId,
      startDate,
      endDate,
    } = query;

    const where: any = {};

    if (applicantId) where.applicantId = applicantId;
    if (status) where.status = status;
    if (species) where.species = species;
    if (experimentId) where.experimentId = experimentId;
    if (startDate && endDate) {
      where.requestDate = Between(new Date(startDate), new Date(endDate));
    }

    const [list, total] = await this.requestRepository.findAndCount({
      where,
      relations: ['applicant', 'approver', 'experiment'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total };
  }

  async findOne(id: number): Promise<AnimalUsageRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['applicant', 'approver', 'experiment'],
    });
    if (!request) {
      throw new NotFoundException(`使用申请 #${id} 不存在`);
    }
    return request;
  }

  async update(
    id: number,
    dto: UpdateAnimalUsageRequestDto,
    applicantId: number,
  ): Promise<AnimalUsageRequest> {
    const request = await this.findOne(id);

    if (request.applicantId !== applicantId) {
      throw new BadRequestException('只能编辑自己的申请');
    }
    if (request.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的申请可以编辑');
    }

    Object.assign(request, dto);
    const updated = await this.requestRepository.save(request);
    this.logger.log(`Updated animal usage request: ${updated.id}`);
    return this.findOne(updated.id);
  }

  async remove(id: number, applicantId: number): Promise<void> {
    const request = await this.findOne(id);

    if (request.applicantId !== applicantId) {
      throw new BadRequestException('只能删除自己的申请');
    }
    if (request.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的申请可以删除');
    }

    await this.requestRepository.remove(request);
    this.logger.log(`Removed animal usage request: ${id}`);
  }

  async submit(id: number, applicantId: number): Promise<AnimalUsageRequest> {
    const request = await this.findOne(id);

    if (request.applicantId !== applicantId) {
      throw new BadRequestException('只能提交自己的申请');
    }
    if (request.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的申请可以提交');
    }

    request.status = 'submitted';
    const updated = await this.requestRepository.save(request);
    this.logger.log(`Submitted animal usage request: ${id}`);
    return this.findOne(updated.id);
  }

  async withdraw(id: number, applicantId: number): Promise<AnimalUsageRequest> {
    const request = await this.findOne(id);

    if (request.applicantId !== applicantId) {
      throw new BadRequestException('只能撤回自己的申请');
    }
    if (!['submitted', 'approved'].includes(request.status)) {
      throw new BadRequestException('只有已提交或已通过的申请可以撤回');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      request.status = 'withdrawn';

      if (request.allocationResult && request.allocationResult.animalIds) {
        const animalIds = request.allocationResult.animalIds as number[];
        await queryRunner.manager.update(
          Animal,
          { id: In(animalIds) },
          { status: 'healthy' },
        );
        await queryRunner.manager.delete(ExperimentAnimal, {
          experimentId: request.experimentId,
          animalId: In(animalIds),
        });
      }

      const updated = await queryRunner.manager.save(request);
      await queryRunner.commitTransaction();
      this.logger.log(`Withdrawn animal usage request: ${id}`);
      return this.findOne(updated.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async approve(
    id: number,
    dto: ApproveRequestDto,
    approverId: number,
  ): Promise<AnimalUsageRequest> {
    const request = await this.findOne(id);

    if (request.status !== 'submitted') {
      throw new BadRequestException('只有待审批状态的申请可以审批');
    }
    if (dto.animalIds.length !== request.quantity) {
      throw new BadRequestException(
        `分配的动物数量(${dto.animalIds.length})与申请数量(${request.quantity})不一致`,
      );
    }

    const animals = await this.animalRepository.find({
      where: { id: In(dto.animalIds) },
    });

    if (animals.length !== dto.animalIds.length) {
      throw new BadRequestException('存在无效的动物ID');
    }

    for (const animal of animals) {
      if (animal.status === 'deceased') {
        throw new BadRequestException(`动物 #${animal.id} (${animal.name}) 已死亡，无法分配`);
      }
      if (animal.status === 'in_experiment') {
        throw new BadRequestException(`动物 #${animal.id} (${animal.name}) 已在实验中，无法重复分配`);
      }
      if (request.species && animal.species !== request.species) {
        throw new BadRequestException(
          `动物 #${animal.id} (${animal.name}) 物种不匹配`,
        );
      }
      if (
        request.genderRequirement !== 'any' &&
        animal.gender !== request.genderRequirement
      ) {
        throw new BadRequestException(
          `动物 #${animal.id} (${animal.name}) 性别不匹配`,
        );
      }
      if (request.minWeight && Number(animal.weight) < Number(request.minWeight)) {
        throw new BadRequestException(
          `动物 #${animal.id} (${animal.name}) 体重低于最小值`,
        );
      }
      if (request.maxWeight && Number(animal.weight) > Number(request.maxWeight)) {
        throw new BadRequestException(
          `动物 #${animal.id} (${animal.name}) 体重高于最大值`,
        );
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      request.status = 'approved';
      request.approverId = approverId;
      request.approvalTime = new Date();
      request.approvalComment = dto.approvalComment || null;
      request.allocationResult = {
        animalIds: dto.animalIds,
        animals: animals.map((a) => ({
          id: a.id,
          name: a.name,
          species: a.species,
          gender: a.gender,
          weight: a.weight,
          cageNumber: a.cageNumber,
        })),
      };

      await queryRunner.manager.update(
        Animal,
        { id: In(dto.animalIds) },
        { status: 'in_experiment' },
      );

      if (request.experimentId) {
        for (const animalId of dto.animalIds) {
          const experimentAnimal = queryRunner.manager.create(ExperimentAnimal, {
            experimentId: request.experimentId,
            animalId,
            joinDate: new Date(),
          });
          await queryRunner.manager.save(experimentAnimal);
        }
      }

      const updated = await queryRunner.manager.save(request);
      await queryRunner.commitTransaction();
      this.logger.log(`Approved animal usage request: ${id}`);
      return this.findOne(updated.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reject(
    id: number,
    dto: RejectRequestDto,
    approverId: number,
  ): Promise<AnimalUsageRequest> {
    const request = await this.findOne(id);

    if (request.status !== 'submitted') {
      throw new BadRequestException('只有待审批状态的申请可以审批');
    }

    request.status = 'rejected';
    request.approverId = approverId;
    request.approvalTime = new Date();
    request.approvalComment = dto.approvalComment;

    const updated = await this.requestRepository.save(request);
    this.logger.log(`Rejected animal usage request: ${id}`);
    return this.findOne(updated.id);
  }

  async getAvailableAnimals(requestId: number): Promise<Animal[]> {
    const request = await this.findOne(requestId);

    const where: any = {
      species: request.species,
    };

    where.status = 'healthy';

    if (request.genderRequirement !== 'any') {
      where.gender = request.genderRequirement;
    }

    const animals = await this.animalRepository.find({
      where,
      order: { id: 'ASC' },
    });

    const filtered = animals.filter((animal) => {
      if (request.minWeight && Number(animal.weight) < Number(request.minWeight)) {
        return false;
      }
      if (request.maxWeight && Number(animal.weight) > Number(request.maxWeight)) {
        return false;
      }
      if (request.strain && animal.breed && animal.breed !== request.strain) {
        return false;
      }
      return true;
    });

    return filtered;
  }

  getStatusTimeline(
    request: AnimalUsageRequest,
  ): Array<{
    status: string;
    label: string;
    time: Date | null;
  }> {
    const timeline: Array<{
      status: string;
      label: string;
      time: Date | null;
    }> = [
      { status: 'draft', label: '创建草稿', time: request.createdAt },
      { status: 'submitted', label: '提交申请', time: null },
    ];

    if (request.status === 'approved' || request.status === 'rejected') {
      timeline.push({
        status: request.status,
        label: request.status === 'approved' ? '审批通过' : '审批拒绝',
        time: request.approvalTime,
      });
    } else {
      timeline.push({ status: 'pending_approval', label: '待审批', time: null });
    }

    if (request.status === 'withdrawn') {
      timeline.push({ status: 'withdrawn', label: '已撤回', time: request.updatedAt });
    }

    return timeline;
  }
}
