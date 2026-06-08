import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserModel } from '../../prisma/generated/models';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email.toLowerCase().trim());
  }

  createUser(data: { email: string; passwordHash: string }) {
    return this.usersRepository.create({
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
    });
  }

  toResponse(user: UserModel): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
