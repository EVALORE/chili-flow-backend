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
import { PlaylistsController } from '../src/playlists/playlists.controller';
import { PlaylistsService } from '../src/playlists/playlists.service';
import { UploadedTracksController } from '../src/uploaded-tracks/uploaded-tracks.controller';
import { UploadedTracksService } from '../src/uploaded-tracks/uploaded-tracks.service';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { AuthTransportService } from '../src/auth/auth-transport.service';
import { AuthTransport } from '../src/config/auth-transport';
import type { Response } from 'express';
import type { AuthSession } from '../src/auth/auth.service';

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
  const authTransport = {
    issue: jest.fn((_response: Response, session: AuthSession) => session),
    clear: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AuthTransportService, useValue: authTransport },
      ],
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

  it('logs out and clears cookie authentication', async () => {
    await request(app.getHttpServer()).post('/auth/logout').expect(204);

    expect(authTransport.clear).toHaveBeenCalled();
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
        AuthTransportService,
        { provide: UsersService, useValue: usersService },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const values: Record<string, unknown> = {
                'auth.jwtSecret': jwtSecret,
                'auth.transport': AuthTransport.Both,
                'app.frontendOrigin': 'http://localhost:5173',
                'app.frontendOrigins': ['http://localhost:5173'],
                'app.nodeEnv': 'test',
              };
              return values[key];
            }),
            get: jest.fn((key: string) => {
              const values: Record<string, unknown> = {
                'app.frontendOrigins': ['http://localhost:5173'],
              };
              return values[key];
            }),
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

  it('rejects expired bearer tokens', async () => {
    const token = await jwtService.signAsync(
      { sub: user.id, email: user.email },
      { expiresIn: -1 },
    );

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('rejects tokens for deleted users', async () => {
    usersService.findById.mockResolvedValue(null);
    const token = await jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
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

  it('accepts a valid cookie token', async () => {
    usersService.findById.mockResolvedValue(user);
    const token = await jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Cookie', `chili_flow_session=${token}`)
      .expect(200)
      .expect(user);
  });

  it('rejects dual credentials for different users', async () => {
    const cookieToken = await jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });
    const bearerToken = await jwtService.signAsync({
      sub: 'user-2',
      email: 'other@example.com',
    });

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Cookie', `chili_flow_session=${cookieToken}`)
      .set('Authorization', `Bearer ${bearerToken}`)
      .expect(401);

    expect(usersService.findById).not.toHaveBeenCalled();
  });
});

describe('Uploaded track routes (e2e)', () => {
  let app: INestApplication;
  const uploadedTracksService = {
    create: jest.fn(),
    list: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UploadedTracksController],
      providers: [
        { provide: UploadedTracksService, useValue: uploadedTracksService },
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
    uploadedTracksService.create.mockResolvedValue(uploadedTrack);

    await request(app.getHttpServer())
      .post('/uploaded-tracks')
      .field('title', 'Track')
      .field('artist', 'Artist')
      .field('genre', 'Electronic')
      .attach('file', Buffer.from('ID3 valid mp3 bytes'), {
        filename: 'track.mp3',
        contentType: 'audio/mpeg',
      })
      .expect(201)
      .expect(uploadedTrack);

    expect(uploadedTracksService.create).toHaveBeenCalledWith(
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
    uploadedTracksService.create.mockRejectedValue(
      new BadRequestException('Audio File is required'),
    );

    await request(app.getHttpServer())
      .post('/uploaded-tracks')
      .field('title', 'Track')
      .field('artist', 'Artist')
      .expect(400);
  });

  it('rejects non-audio multipart files before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/uploaded-tracks')
      .field('title', 'Track')
      .field('artist', 'Artist')
      .attach('file', Buffer.from('png bytes'), {
        filename: 'cover.png',
        contentType: 'image/png',
      })
      .expect(400);

    expect(uploadedTracksService.create).not.toHaveBeenCalled();
  });

  it('lists uploaded tracks for the authenticated user', async () => {
    const uploadedTracks = [
      {
        id: 'uploaded-1',
        title: 'Track',
        artist: 'Artist',
        genre: null,
        publicUrl: 'http://localhost:3000/uploads/track.mp3',
        duration: null,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    ];
    uploadedTracksService.list.mockResolvedValue(uploadedTracks);

    await request(app.getHttpServer())
      .get('/uploaded-tracks')
      .expect(200)
      .expect(uploadedTracks);

    expect(uploadedTracksService.list).toHaveBeenCalledWith(user.id);
  });

  it('deletes uploaded tracks by uploaded track ID', async () => {
    uploadedTracksService.delete.mockResolvedValue({ deleted: true });

    await request(app.getHttpServer())
      .delete('/uploaded-tracks/uploaded-1')
      .expect(200)
      .expect({ deleted: true });

    expect(uploadedTracksService.delete).toHaveBeenCalledWith(
      user.id,
      'uploaded-1',
    );
  });

  it('does not expose the old upload route', async () => {
    await request(app.getHttpServer()).post('/tracks/upload').expect(404);
  });
});

describe('Playlist item routes (e2e)', () => {
  let app: INestApplication;
  const playlistDetail = {
    id: 'playlist-1',
    ownerId: user.id,
    name: 'Favorites',
    description: null,
    itemCount: 1,
    totalDuration: 120,
    items: [
      {
        id: 'item-1',
        playlistId: 'playlist-1',
        source: 'jamendo',
        sourceId: 'jam-1',
        title: 'Track',
        artist: 'Artist',
        coverUrl: null,
        audioUrl: 'https://audio.test/track.mp3',
        duration: 120,
        position: 0,
        addedAt: '2026-06-01T00:00:00.000Z',
      },
    ],
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  };
  const playlistsService = {
    createItem: jest.fn(),
    removeItem: jest.fn(),
    reorderItems: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PlaylistsController],
      providers: [
        { provide: PlaylistsService, useValue: playlistsService },
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

  it('creates playlist items from a source and source ID', async () => {
    playlistsService.createItem.mockResolvedValue(playlistDetail);

    await request(app.getHttpServer())
      .post('/playlists/playlist-1/items')
      .send({ source: 'jamendo', sourceId: 'jam-1' })
      .expect(201)
      .expect(playlistDetail);

    expect(playlistsService.createItem).toHaveBeenCalledWith(
      user.id,
      'playlist-1',
      { source: 'jamendo', sourceId: 'jam-1' },
    );
  });

  it('deletes playlist items by playlist item ID', async () => {
    playlistsService.removeItem.mockResolvedValue(playlistDetail);

    await request(app.getHttpServer())
      .delete('/playlists/playlist-1/items/item-1')
      .expect(200)
      .expect(playlistDetail);

    expect(playlistsService.removeItem).toHaveBeenCalledWith(
      user.id,
      'playlist-1',
      'item-1',
    );
  });

  it('reorders playlist items using playlist item IDs', async () => {
    playlistsService.reorderItems.mockResolvedValue(playlistDetail);

    await request(app.getHttpServer())
      .put('/playlists/playlist-1/items/reorder')
      .send({ playlistItemIds: ['item-2', 'item-1'] })
      .expect(200)
      .expect(playlistDetail);

    expect(playlistsService.reorderItems).toHaveBeenCalledWith(
      user.id,
      'playlist-1',
      { playlistItemIds: ['item-2', 'item-1'] },
    );
  });

  it('rejects old trackIds reorder payloads before calling the service', async () => {
    await request(app.getHttpServer())
      .put('/playlists/playlist-1/items/reorder')
      .send({ trackIds: ['item-2', 'item-1'] })
      .expect(400);

    expect(playlistsService.reorderItems).not.toHaveBeenCalled();
  });

  it('does not expose the old playlist tracks route', async () => {
    await request(app.getHttpServer())
      .post('/playlists/playlist-1/tracks')
      .send({ source: 'jamendo', sourceId: 'jam-1' })
      .expect(404);
  });
});
