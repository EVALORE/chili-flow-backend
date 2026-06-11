import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  imports: [DatabaseModule],
  providers: [UsersRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
