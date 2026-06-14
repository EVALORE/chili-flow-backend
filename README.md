# Chili Flow Backend

NestJS backend for Chili Flow. It owns user authentication, uploaded audio files,
local playlists, recently played history, and read-only Jamendo catalog access.

## Prerequisites

- Node.js and pnpm.
- PostgreSQL.
- A Jamendo API client id from the Jamendo developer portal.

## Local Setup

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with your local PostgreSQL connection string and Jamendo client id.
The example values are placeholders and do not contain real secrets.

Create the upload storage directory. The default example uses `./uploads`:

```bash
mkdir -p uploads
```

Generate the Prisma client and apply migrations:

```bash
pnpm run prisma:generate
pnpm run prisma:migrate
```

Start the API in watch mode:

```bash
pnpm run start:dev
```

The default local API URL is `http://localhost:3000`.

## Environment Variables

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Allowed values are `development`, `test`, and `production`. Defaults to `development`. |
| `PORT` | No | `3000` | Defaults to `3000`. |
| `JWT_SECRET` | Yes | `replace-with-local-secret` | Use a strong secret outside local development. |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/chili_flow?schema=public` | PostgreSQL connection used by Prisma. |
| `UPLOADS_DIR` | Yes | `./uploads` | Directory where uploaded audio files are stored. |
| `PUBLIC_BACKEND_URL` | Yes | `http://localhost:3000` | Base URL used to build public uploaded file URLs. |
| `FRONTEND_ORIGIN` | No | `http://localhost:5173` | CORS origin for the frontend. Defaults to `http://localhost:5173`. |
| `JAMENDO_CLIENT_ID` | Yes | `replace-with-jamendo-client-id` | Required for Jamendo read API calls. |
| `JAMENDO_API_BASE_URL` | No | `https://api.jamendo.com/v3.0` | Defaults to the Jamendo v3 API URL. |
| `JAMENDO_CLIENT_SECRET` | No | empty | Reserved for future Jamendo OAuth/write actions. |
| `JAMENDO_REDIRECT_URI` | No | empty | Reserved for future Jamendo OAuth/write actions. |

## Database

The backend uses Prisma with PostgreSQL. The schema is in
`prisma/schema.prisma`, and migrations live under `prisma/migrations`.

Useful commands:

```bash
pnpm run prisma:generate
pnpm run prisma:migrate
pnpm run prisma:status
pnpm run prisma:studio
```

## Uploaded Audio Storage

Uploaded files are validated as audio, written under `UPLOADS_DIR`, and served
from `/uploads/*`. API responses expose public URLs built from
`PUBLIC_BACKEND_URL`; raw server file paths are not returned.

For local development with the default `.env.example` values:

- Files are stored in `./uploads`.
- Files are served from `http://localhost:3000/uploads/<stored-file-name>`.

## API Routes

Swagger UI is available at `GET /docs` outside production.

### Health

- `GET /health`

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Current User

- `GET /users/me`

Requires a bearer JWT.

### Uploaded Tracks

- `POST /tracks/upload`
- `GET /tracks`
- `DELETE /tracks/:id`

All uploaded track routes require a bearer JWT. Uploads use multipart form data
with `title`, `artist`, optional `genre`, and `file`.

### Playlists

- `GET /playlists`
- `POST /playlists`
- `GET /playlists/:id`
- `PUT /playlists/:id`
- `DELETE /playlists/:id`
- `POST /playlists/:id/tracks`
- `DELETE /playlists/:id/tracks/:trackId`
- `PUT /playlists/:id/tracks/reorder`

All playlist routes require a bearer JWT and are scoped to the current user.

### Recently Played

- `POST /recently-played`
- `GET /recently-played`

Recently played routes require a bearer JWT and are scoped to the current user.

### Catalog And Jamendo

- `GET /catalog/search/tracks`
- `GET /catalog/tracks/:id`
- `GET /catalog/tracks/:id/similar`
- `GET /catalog/tracks/:id/file`
- `GET /catalog/albums`
- `GET /catalog/albums/:id/tracks`
- `GET /catalog/artists`
- `GET /catalog/artists/:id/tracks`
- `GET /catalog/artists/:id/albums`
- `GET /catalog/autocomplete`
- `GET /catalog/playlists`
- `GET /catalog/playlists/:id/tracks`

Catalog routes are read-only wrappers around Jamendo. The backend injects the
Jamendo `client_id`, normalizes responses for the app, maps upstream errors to
HTTP errors, and does not expose Jamendo secrets.

## Development Commands

```bash
pnpm run build
pnpm run start
pnpm run start:dev
pnpm run start:prod
pnpm run test
pnpm run test:e2e
pnpm run test:cov
pnpm run lint
pnpm run format
```

## Production Notes

- Set `NODE_ENV=production` to disable Swagger UI.
- Use a strong `JWT_SECRET`.
- Configure `PUBLIC_BACKEND_URL` to the deployed backend origin.
- Use persistent storage for `UPLOADS_DIR`.
- Restrict `FRONTEND_ORIGIN` to the deployed frontend origin.
