# Backend Setup

## Goal

Create the NestJS backend foundation for auth, playlists, uploads, and recently played data.

## Required Technology

- NestJS.
- TypeScript.
- JWT authentication.
- Database-backed persistence.
- Multipart file upload support.

## Environment Variables

- `JWT_SECRET`
- `DATABASE_URL`
- `UPLOADS_DIR`
- `PUBLIC_BACKEND_URL`

## Tasks

- Create NestJS application.
- Add configuration module for environment variables.
- Add database connection.
- Add user ownership pattern for protected resources.
- Add global validation pipe.
- Add error response format.
- Add static serving or public file access for uploaded tracks.
- Add API documentation or endpoint list.

## Acceptance Criteria

- Backend starts with documented environment variables.
- Protected modules can read authenticated user identity.
- Validation errors return clear responses.
- Uploaded audio files can be served back through a public URL.
