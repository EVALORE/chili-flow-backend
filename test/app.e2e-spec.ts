import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { TracksController } from '../src/tracks/tracks.controller';
import { TracksService } from '../src/tracks/tracks.service';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { ConfigService } from '@nestjs/config';

const user = {
  id: 'user-1',
  email: 'user@example.com',
};

const authResponse = {
  user: {
    ...user,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  accessToken: 'access-token',
};

function configureApp(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
}

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = user;
    return true;
  }
}

describe('Auth routes (e2e)', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers with valid input and strips unknown request fields', async () => {
    authService.register.mockResolvedValue(authResponse);

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'password123',
        ignored: true,
      })
      .expect(201);

    expect(response.body).toEqual(authResponse);
    expect(authService.register).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it('rejects invalid register DTOs before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);

    expect(authService.register).not.toHaveBeenCalled();
  });

  it('logs in with valid input', async () => {
    authService.login.mockResolvedValue(authResponse);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(201)
      .expect(authResponse);

    expect(authService.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });
});

describe('Protected user routes (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const jwtSecret = 'test-secret';
  const usersService = {
    findById: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: jwtSecret }),
      ],
      controllers: [UsersController],
      providers: [
        JwtAuthGuard,
        JwtStrategy,
        { provide: UsersService, useValue: usersService },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue(jwtSecret),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    jwtService = moduleFixture.get(JwtService);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects missing bearer tokens', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);

    expect(usersService.findById).not.toHaveBeenCalled();
  });

  it('rejects invalid bearer tokens', async () => {
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('returns the authenticated user for a valid token', async () => {
    usersService.findById.mockResolvedValue(user);
    const token = await jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(user);

    expect(usersService.findById).toHaveBeenCalledWith(user.id);
  });
});

describe('Uploaded track routes (e2e)', () => {
  let app: INestApplication;
  const tracksService = {
    upload: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TracksController],
      providers: [
        { provide: TracksService, useValue: tracksService },
        { provide: JwtAuthGuard, useClass: TestAuthGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('uploads valid multipart audio requests', async () => {
    const uploadedTrack = {
      id: 'track-1',
      title: 'Track',
      artist: 'Artist',
      genre: 'Electronic',
      publicUrl: 'http://localhost:3000/uploads/track.mp3',
      duration: null,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    };
    tracksService.upload.mockResolvedValue(uploadedTrack);

    await request(app.getHttpServer())
      .post('/tracks/upload')
      .field('title', 'Track')
      .field('artist', 'Artist')
      .field('genre', 'Electronic')
      .attach('file', Buffer.from('ID3 valid mp3 bytes'), {
        filename: 'track.mp3',
        contentType: 'audio/mpeg',
      })
      .expect(201)
      .expect(uploadedTrack);

    expect(tracksService.upload).toHaveBeenCalledWith(
      user.id,
      {
        title: 'Track',
        artist: 'Artist',
        genre: 'Electronic',
      },
      expect.objectContaining({
        originalname: 'track.mp3',
        mimetype: 'audio/mpeg',
      }),
    );
  });

  it('rejects missing file uploads through the service validation path', async () => {
    tracksService.upload.mockRejectedValue(
      new BadRequestException('Audio File is required'),
    );

    await request(app.getHttpServer())
      .post('/tracks/upload')
      .field('title', 'Track')
      .field('artist', 'Artist')
      .expect(400);
  });

  it('rejects non-audio multipart files before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/tracks/upload')
      .field('title', 'Track')
      .field('artist', 'Artist')
      .attach('file', Buffer.from('png bytes'), {
        filename: 'cover.png',
        contentType: 'image/png',
      })
      .expect(400);

    expect(tracksService.upload).not.toHaveBeenCalled();
  });
});
