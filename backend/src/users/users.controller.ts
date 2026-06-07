import { Controller, Get, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthHelper } from '../common/auth-helper';

@ApiTags('用户管理')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authHelper: AuthHelper,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'keyword', required: false })
  async findAll(
    @Headers('authorization') auth: string,
    @Query('keyword') keyword?: string,
  ) {
    await this.authHelper.getUserFromToken(auth);
    return this.usersService.findAll({ keyword });
  }
}
