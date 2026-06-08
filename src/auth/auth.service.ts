import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { UserModel } from '../../prisma/generated/models';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = this._normalizeEmail(dto.email);

    const existingUser = await this.usersService.findByEmail(email);

    if (!existingUser) {
      throw new UnauthorizedException('Email is already registered');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.usersService.createUser({
      email,
      passwordHash,
    });

    return this._buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const email = this._normalizeEmail(dto.email);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordIsValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this._buildAuthResponse(user);
  }

  private _normalizeEmail(email: string) {
    return email.toLowerCase().trim();
  }

  private async _buildAuthResponse(user: UserModel): Promise<AuthResponseDto> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      user: this.usersService.toResponse(user),
      accessToken,
    };
  }
}
