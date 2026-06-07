import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class AuthHelper {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserFromToken(authHeader: string): Promise<User> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('未提供认证信息');
    }
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }
      return user;
    } catch {
      throw new UnauthorizedException('Token无效或已过期');
    }
  }

  async requireAdmin(authHeader: string): Promise<User> {
    const user = await this.getUserFromToken(authHeader);
    if (user.role !== 'admin') {
      throw new ForbiddenException('需要管理员权限');
    }
    return user;
  }

  async getUserIdFromToken(authHeader: string): Promise<number> {
    const user = await this.getUserFromToken(authHeader);
    return user.id;
  }
}
