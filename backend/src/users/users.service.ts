import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(query?: { keyword?: string }): Promise<User[]> {
    const where: any = {};
    if (query?.keyword) {
      where.name = Like(`%${query.keyword}%`);
    }
    const users = await this.userRepository.find({
      where,
      order: { createdAt: 'DESC' },
      select: ['id', 'username', 'name', 'role', 'createdAt'],
    });
    return users;
  }

  async findOne(id: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'name', 'role', 'createdAt'],
    });
    return user;
  }
}
