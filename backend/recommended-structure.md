# Recommended Backend Structure

## Current State

The backend is currently a default NestJS starter with a root controller, service, and module. The product requirements already point to these main backend areas:

- Authentication.
- User-owned playlists.
- Uploaded audio tracks.
- Jamendo API integration.
- Recently played history.

Because these areas map cleanly to NestJS feature modules, the backend should be organized by product domain instead of by technical file type.

## Proposed Directory Structure

```txt
src/
  main.ts
  app.module.ts


Done
  config/
    env.validation.ts
    app.config.ts

  common/
    decorators/
      current-user.decorator.ts
    filters/
      http-exception.filter.ts
    guards/
    interceptors/
    pipes/
    types/

  database/
    database.module.ts
    prisma.service.ts

  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/
    guards/
    strategies/

  users/
    users.module.ts
    users.service.ts
    users.repository.ts
    dto/

  tracks/
    tracks.module.ts
    tracks.controller.ts
    tracks.service.ts
    dto/
    storage/

  playlists/
    playlists.module.ts
    playlists.controller.ts
    playlists.service.ts
    dto/

  catalog/
    catalog.module.ts
    catalog.controller.ts
    catalog.service.ts

Done
  jamendo/
    jamendo.module.ts
    jamendo.service.ts
    jamendo.client.ts
    dto/
    mappers/

  recently-played/
    recently-played.module.ts
    recently-played.controller.ts
    recently-played.service.ts
    dto/
```

If Prisma is used for database persistence, add:

```txt
prisma/
  schema.prisma
  migrations/
```

## Module Responsibilities

### App

`AppModule` should only compose application modules. The starter `AppController` and `AppService` can eventually be removed or replaced by a small health check module.

### Config

Owns environment variable loading and validation.

Expected environment variables:

- `JWT_SECRET`
- `DATABASE_URL`
- `UPLOADS_DIR`
- `PUBLIC_BACKEND_URL`
- `JAMENDO_CLIENT_ID`
- `JAMENDO_CLIENT_SECRET`
- `JAMENDO_REDIRECT_URI`
- `JAMENDO_API_BASE_URL`

### Common

Contains cross-cutting infrastructure only:

- Current user decorator.
- Global exception filter.
- Shared guards, interceptors, pipes, and types.

Avoid putting feature-specific DTOs or business logic here.

### Database

Owns the database client and exports it for feature modules.

Recommended default: Prisma, unless the project has a strong reason to use TypeORM.

### Auth

Owns registration, login, password hashing, JWT issuing, JWT validation, and protected route guards.

Endpoints:

- `POST /auth/register`
- `POST /auth/login`

### Users

Owns user persistence and user lookup helpers. Auth should depend on this module instead of directly owning all user database logic.

### Tracks

Owns uploaded track behavior:

- Multipart upload.
- Metadata validation.
- Audio file validation.
- File storage.
- Public playable URL generation.
- User-scoped listing and deletion.

Endpoints:

- `POST /uploaded-tracks`
- `GET /uploaded-tracks`
- `DELETE /uploaded-tracks/:uploadedTrackId`

### Playlists

Owns local playlists, playlist items, ordering, and user ownership checks.

Endpoints:

- `GET /playlists`
- `POST /playlists`
- `GET /playlists/:id`
- `PUT /playlists/:id`
- `DELETE /playlists/:id`
- `POST /playlists/:id/items`
- `DELETE /playlists/:id/items/:playlistItemId`
- `PUT /playlists/:id/items/reorder`

### Catalog

Owns the frontend-facing public music catalog API. The frontend should call catalog routes instead of provider-specific routes.

Suggested app routes:

- `GET /catalog/tracks`
- `GET /catalog/tracks/:id`
- `GET /catalog/tracks/:id/similar`
- `GET /catalog/tracks/:id/file`
- `GET /catalog/albums`
- `GET /catalog/albums/:id/tracks`
- `GET /catalog/artists`
- `GET /catalog/artists/:id/tracks`
- `GET /catalog/autocomplete`
- `GET /catalog/playlists`
- `GET /catalog/playlists/:id/tracks`

### Jamendo

Owns all internal Jamendo API communication and normalization. The rest of the app should not build Jamendo URLs directly.

Responsibilities:

- Typed upstream client.
- Query DTO validation.
- Response normalization.
- Error mapping.
- OAuth token handling if user-specific Jamendo writes are implemented.
- Preserving license and attribution fields.

### Recently Played

Owns user-scoped listening history.

Endpoints:

- `GET /recently-played`
- `POST /recently-played`

## Recommended Build Order

1. Add config support and environment validation.
2. Add database support and the initial data model.
3. Add users and auth.
4. Add global validation and protected route support.
5. Add uploaded tracks.
6. Add Jamendo read-only search and track normalization.
7. Add playlists with support for both uploaded and Jamendo tracks.
8. Add recently played.
9. Add Jamendo OAuth/write support only if the product really needs it.

## First Practical Milestone

Start with the foundation needed by every protected feature:

- `ConfigModule`
- `DatabaseModule`
- `UsersModule`
- `AuthModule`
- Global validation pipe
- JWT guard
- Current user decorator

After that, implement uploaded tracks before playlists. Uploaded tracks are smaller than playlists, but they prove the important pieces: authentication, ownership checks, database writes, file handling, and public media URLs.
