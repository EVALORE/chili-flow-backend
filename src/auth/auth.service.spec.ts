import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  const user = {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
  };

  const createService = () => {
    const usersService = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
      toResponse: jest.fn((createdUser: typeof user) => ({
        id: createdUser.id,
        email: createdUser.email,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      })),
    } as unknown as jest.Mocked<UsersService>;

    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    } as unknown as jest.Mocked<JwtService>;

    return {
      jwtService,
      service: new AuthService(usersService, jwtService),
      usersService,
    };
  };

  beforeEach(() => {
    jest.mocked(argon2.hash).mockResolvedValue('hashed-password');
    jest.mocked(argon2.verify).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('registers a new user and returns a JWT response', async () => {
    const { jwtService, service, usersService } = createService();

    usersService.findByEmail.mockResolvedValue(null);
    usersService.createUser.mockResolvedValue(user);

    await expect(
      service.register({ email: 'USER@example.com', password: 'password123' }),
    ).resolves.toEqual({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken: 'signed-token',
    });

    expect(usersService.findByEmail).toHaveBeenCalledWith('USER@example.com');
    expect(argon2.hash).toHaveBeenCalledWith('password123');
    expect(usersService.createUser).toHaveBeenCalledWith({
      email: 'USER@example.com',
      passwordHash: 'hashed-password',
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
    });
  });

  it('rejects duplicate registrations before hashing', async () => {
    const { service, usersService } = createService();

    usersService.findByEmail.mockResolvedValue(user);

    await expect(
      service.register({ email: user.email, password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(argon2.hash).not.toHaveBeenCalled();
    expect(usersService.createUser).not.toHaveBeenCalled();
  });

  it('maps unique constraint races to conflict errors', async () => {
    const { service, usersService } = createService();

    usersService.findByEmail.mockResolvedValue(null);
    usersService.createUser.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.register({ email: user.email, password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with valid credentials', async () => {
    const { service, usersService } = createService();

    usersService.findByEmail.mockResolvedValue(user);

    await expect(
      service.login({ email: user.email, password: 'password123' }),
    ).resolves.toMatchObject({
      user: { id: user.id, email: user.email },
      accessToken: 'signed-token',
    });

    expect(argon2.verify).toHaveBeenCalledWith(
      'hashed-password',
      'password123',
    );
  });

  it('rejects invalid login credentials without revealing which field failed', async () => {
    const { service, usersService } = createService();

    usersService.findByEmail.mockResolvedValueOnce(null);

    await expect(
      service.login({ email: user.email, password: 'password123' }),
    ).rejects.toThrow('Invalid email or password');

    usersService.findByEmail.mockResolvedValueOnce(user);
    jest.mocked(argon2.verify).mockResolvedValueOnce(false);

    await expect(
      service.login({ email: user.email, password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
