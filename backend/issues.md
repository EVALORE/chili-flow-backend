# Backend Issues And Sub-Issues

Use these as GitHub/Jira issues. The top-level items can be parent issues or epics. The "Sub-issues" sections can be created as separate linked issues.

## Recommended Order

1. `[backend] Project foundation` - Done
2. `[backend] Database and data model` - Done
3. `[backend] Auth and users` - Done
4. `[backend] Uploaded tracks` - Done
5. `[backend] Jamendo read API` - Done
6. `[backend] Playlists` - Done
7. `[backend] Recently played` - Done
8. `[backend] Testing, docs, and production hardening` - Not Started

---

## name: [backend] Project foundation - Done

### Goal

Prepare the NestJS backend foundation used by every feature module.

### Tasks

- Keep `AppModule` focused on composing feature modules.
- Configure global environment loading.
- Configure global request validation.
- Add common backend infrastructure for reusable decorators, guards, filters, and types.
- Add a health endpoint for basic backend checks.
- Configure CORS for the frontend application.
- Add static serving support for uploaded audio files.

### Acceptance Criteria

- Backend starts with validated environment configuration.
- Invalid request DTO fields are rejected.
- Unknown DTO fields are stripped.
- Frontend can call backend APIs from the configured origin.
- Uploaded files can be served through stable public URLs.

### Sub-issues

#### name: [backend] Config and environment validation - Done

Goal

Load and validate all required backend environment variables.

Tasks

- Validate `NODE_ENV`.
- Validate `PORT`.
- Validate `JWT_SECRET`.
- Validate `DATABASE_URL`.
- Validate `UPLOADS_DIR`.
- Validate `PUBLIC_BACKEND_URL`.
- Validate `JAMENDO_CLIENT_ID`.
- Validate `JAMENDO_CLIENT_SECRET` as optional until Jamendo OAuth is implemented.
- Validate `JAMENDO_REDIRECT_URI` as optional until Jamendo OAuth is implemented.
- Validate `JAMENDO_API_BASE_URL`.
- Expose typed config values through `ConfigService`.

Acceptance Criteria

- App fails fast when required environment variables are missing.
- Optional Jamendo OAuth variables do not block read-only Jamendo features.
- Defaults are used only for safe local development values.

#### name: [backend] Common API infrastructure - Done

Goal

Add reusable backend helpers shared across modules.

Tasks

- Add `common/decorators/current-user.decorator.ts`.
- Add a global HTTP exception filter.
- Add shared auth/user request types.
- Add shared pagination query DTO helpers if needed.
- Add shared ownership error helpers if needed.

Acceptance Criteria

- Protected controllers can access the authenticated user consistently.
- API errors return a consistent response shape.
- Feature modules do not duplicate common request/user types.

#### name: [backend] Health check endpoint - Done

Goal

Expose a minimal endpoint to verify the API is running.

Tasks

- Add `GET /health`.
- Return service status and app environment.
- Do not expose secrets or internal config values.

Acceptance Criteria

- `GET /health` returns `200`.
- The response can be used by local development and deployment checks.

---

## name: [backend] Database and data model - Done

### Goal

Add database persistence for users, uploaded tracks, playlists, playlist tracks, and recently played history.

### Tasks

- Add Prisma or the chosen ORM.
- Create `DatabaseModule`.
- Add database service provider.
- Create initial schema.
- Add migrations.
- Add seed data only if useful for local development.

### Acceptance Criteria

- Backend can connect to the configured database.
- Migrations create all required tables.
- Feature modules access the database through the database module.

### Sub-issues

#### name: [backend] Add database module - Done

Goal

Provide one shared database client for the NestJS application.

Tasks

- Add `src/database/database.module.ts`.
- Add `src/database/prisma.service.ts` or equivalent.
- Connect on app startup.
- Close the connection on app shutdown.
- Export the database service to feature modules.

Acceptance Criteria

- App starts only when the database connection is valid.
- Feature modules can inject the database service.

#### name: [backend] Create initial schema - Done

Goal

Create the database tables needed by the backend features.

Tasks

- Add `User` model with email, password hash, created date, and updated date.
- Add `UploadedTrack` model with owner, metadata, file path, public URL, duration if available, created date, and updated date.
- Add `Playlist` model with owner, name, description, created date, and updated date.
- Add `PlaylistTrack` model with playlist, source, source ID, display metadata, ordering, and added date.
- Add `RecentlyPlayed` model with owner, source, source ID, display metadata, and played date.
- Add indexes for user ownership and common list queries.

Acceptance Criteria

- Migrations can be applied from a clean database.
- User-scoped queries can be implemented efficiently.
- Playlist order can be preserved.

---

## name: [backend] Auth and users - Done

### Goal

Allow users to register, log in, and access protected backend resources with JWT.

### Tasks

- Create `UsersModule`.
- Create `AuthModule`.
- Register users with email and password.
- Hash passwords before storage.
- Reject duplicate emails.
- Validate login credentials.
- Return JWT after successful login.
- Return basic user profile without password.
- Add JWT guard for protected endpoints.
- Add current-user extraction for controllers.

### Acceptance Criteria

- Duplicate emails are rejected.
- Invalid credentials are rejected.
- JWT is required for protected endpoints.
- Password hashes are never returned by the API.

### Sub-issues

#### name: [backend] Users module - Done

Goal

Own user persistence and user lookup helpers.

Tasks

- Add `src/users/users.module.ts`.
- Add `src/users/users.service.ts`.
- Add `src/users/users.repository.ts` if following repository pattern.
- Add user response DTO.
- Add lookup by ID.
- Add lookup by email.
- Add create user method.
- Ensure password hash is excluded from public responses.

Acceptance Criteria

- Auth can create and look up users through `UsersModule`.
- API responses never include password hashes.

#### name: [backend] Register endpoint - Done

Goal

Create a new user account.

Tasks

- Add `POST /auth/register`.
- Validate email.
- Validate password length.
- Hash password with a secure hashing library.
- Reject duplicate email.
- Return user profile and JWT.

Acceptance Criteria

- Valid registration creates a user.
- Duplicate email returns a conflict error.
- Password is stored only as a hash.

#### name: [backend] Login endpoint - Done

Goal

Authenticate an existing user.

Tasks

- Add `POST /auth/login`.
- Validate email and password.
- Compare submitted password with stored hash.
- Return JWT and basic user profile.
- Reject invalid credentials with a safe error.

Acceptance Criteria

- Valid credentials return a JWT.
- Invalid credentials do not reveal whether the email exists.
- Returned user object does not include password hash.

#### name: [backend] JWT protection - Done

Goal

Protect private backend routes.

Tasks

- Add JWT strategy or token verification service.
- Add `JwtAuthGuard`.
- Add `CurrentUser` decorator.
- Apply guard to protected feature endpoints as those modules are added.
- Add tests for missing, invalid, and valid tokens under testing/hardening.

Acceptance Criteria

- Protected routes reject missing tokens.
- Protected routes reject invalid tokens.
- Protected controllers receive the current user.

---

## name: [backend] Uploaded tracks - Done

### Goal

Allow authenticated users to upload, list, play, and delete their own audio tracks.

### Tasks

- Create `TracksModule`.
- Accept multipart/form-data upload.
- Validate required metadata.
- Validate audio file presence and type.
- Store audio files on the server.
- Store track metadata in the database.
- Return public playable URL.
- List tracks uploaded by the authenticated user.
- Delete uploaded track metadata.
- Delete uploaded file from storage.
- Prevent access to another user's uploaded tracks.

### Acceptance Criteria

- Uploaded tracks appear in Library.
- Uploaded tracks can be played by the global player.
- Users can delete only their own uploaded tracks.
- Invalid uploads return validation errors.

### Sub-issues

#### name: [backend] Track upload endpoint - Done

Goal

Upload one audio file with track metadata.

Tasks

- Add `POST /tracks/upload`.
- Require authentication.
- Accept fields `title`, `artist`, `genre`, and `file`.
- Validate file exists.
- Validate file MIME type.
- Generate a safe stored file name.
- Save file under `UPLOADS_DIR`.
- Save metadata and owner ID in the database.
- Return normalized uploaded track response.

Acceptance Criteria

- Valid upload returns created track metadata.
- Missing file returns validation error.
- Missing required metadata returns validation error.
- Non-audio files are rejected.

#### name: [backend] Uploaded track listing - Done

Goal

Return tracks uploaded by the authenticated user.

Tasks

- Add `GET /tracks`.
- Require authentication.
- Query only current user's tracks.
- Return track ID, title, artist, genre, duration if available, `publicUrl`, and created date.
- Sort newest first by default.

Acceptance Criteria

- User sees only their own uploaded tracks.
- Response has enough data for Library and player UI.

#### name: [backend] Uploaded track deletion - Done

Goal

Delete a user's uploaded track and its stored file.

Tasks

- Add `DELETE /tracks/:id`.
- Require authentication.
- Verify the track belongs to the current user.
- Delete database metadata.
- Delete stored audio file.
- Do not break playlists that previously referenced the track without a clear product decision.

Acceptance Criteria

- User can delete their own track.
- User cannot delete another user's track.
- Stored file is removed after deletion.

#### name: [backend] Public uploaded media URLs - Done

Goal

Make uploaded audio files playable by the frontend.

Tasks

- Configure static serving for uploaded files.
- Generate public URLs using `PUBLIC_BACKEND_URL`.
- Avoid exposing local filesystem paths.
- Keep URLs stable after API restart.

Acceptance Criteria

- Uploaded track response contains a playable `publicUrl`.
- API never returns raw server file paths.

---

## name: [backend] Jamendo read API - Done

### Goal

Expose app-focused Jamendo routes for search, browsing, artist pages, album pages, playlists, and playback.

### Tasks

- Keep all Jamendo communication inside `JamendoModule`.
- Complete the typed Jamendo client.
- Automatically add `client_id` and `format=json`.
- Normalize Jamendo responses into app-friendly objects.
- Preserve license and attribution fields.
- Map Jamendo API errors into backend HTTP errors.
- Add timeout handling.
- Add query DTO validation.
- Add rate-limit protection or caching for search/browse endpoints if needed.

### Acceptance Criteria

- Backend can search Jamendo tracks and return playable track objects.
- Backend can fetch a track by ID.
- Backend can fetch similar tracks.
- Backend can fetch artist tracks and albums.
- Backend can fetch album tracks.
- Backend never exposes Jamendo `client_secret`.
- Backend maps Jamendo errors into clear API errors.
- Backend respects download and ZIP allowed flags.

### Sub-issues

#### name: [backend] Jamendo client hardening - Done

Goal

Make the upstream Jamendo client reliable and safe to reuse.

Tasks

- Keep `client_id` and `format=json` injection in one place.
- Add request timeout handling.
- Add support for GET file redirect endpoints.
- Add support for POST only when OAuth/write features are needed.
- Map Jamendo response codes `0`, `3`, `4`, `5`, `6`, `7`, `12`, and `13`.
- Preserve `headers.warnings` in logs or response metadata.
- Add tests for URL construction and error mapping.

Acceptance Criteria

- Jamendo failures return controlled backend errors.
- Upstream response parsing is tested.
- The frontend never needs to know Jamendo client credentials.

#### name: [backend] Search Jamendo tracks - Done

Goal

Search Jamendo tracks for the app search UI.

Tasks

- Keep or complete `GET /jamendo/search/tracks`.
- Validate `search`, `limit`, and `offset`.
- Include music info when needed.
- Return `count` and normalized track results.
- Preserve license URL, share URL, and download permission.

Acceptance Criteria

- Search returns playable normalized track objects.
- Invalid query params return validation errors.
- Limit cannot exceed Jamendo's documented maximum.

#### name: [backend] Jamendo track details - Done

Goal

Load one Jamendo track and similar tracks.

Tasks

- Keep or complete `GET /jamendo/tracks/:id`.
- Keep or complete `GET /jamendo/tracks/:id/similar`.
- Return `404` or a clear empty response when a track is missing.
- Normalize all returned tracks.

Acceptance Criteria

- Track detail page can load one track by ID.
- Similar tracks list can be shown by the frontend.

#### name: [backend] Jamendo track file redirect - Done

Goal

Provide a backend route for Jamendo track file playback or download redirects.

Tasks

- Add `GET /jamendo/tracks/:id/file`.
- Call Jamendo `/tracks/file`.
- Redirect to the upstream file URL when allowed.
- Return a clear error for unavailable files.
- Respect `audiodownload_allowed`.

Acceptance Criteria

- Frontend can request a track file through the backend route.
- Backend does not offer downloads when Jamendo disallows them.

#### name: [backend] Jamendo albums - Done

Goal

Support album browsing and album detail pages.

Tasks

- Add `GET /jamendo/albums`.
- Add `GET /jamendo/albums/:id/tracks`.
- Validate pagination and filters.
- Normalize album cover, title, release date, artist, track count, and tracks.
- Handle singles or missing album images gracefully.

Acceptance Criteria

- Album list can be rendered by the frontend.
- Album page can render tracks for one album.

#### name: [backend] Jamendo artists - Done

Goal

Support artist detail pages with tracks and albums.

Tasks

- Add `GET /jamendo/artists`.
- Add `GET /jamendo/artists/:id/tracks`.
- Add artist albums support using Jamendo artist album data.
- Normalize artist ID, name, photo, biography if available, album count, tracks, and albums.
- Add fallback values for missing artist images or biography.

Acceptance Criteria

- Artist page can load by route ID.
- Artist page can show popular tracks.
- Artist page can show albums with cover, title, release date, and track count.

#### name: [backend] Jamendo autocomplete - Done

Goal

Return autocomplete suggestions for search input.

Tasks

- Add `GET /jamendo/autocomplete`.
- Validate `prefix`.
- Return grouped or normalized suggestions for tracks, albums, artists, and tags.
- Limit response size for fast UI usage.

Acceptance Criteria

- Search UI can request suggestions while typing.
- Empty or invalid prefix returns a validation error or empty result consistently.

#### name: [backend] Jamendo public playlists - Done

Goal

Expose public Jamendo playlists and playlist tracks.

Tasks

- Add `GET /jamendo/playlists`.
- Add `GET /jamendo/playlists/:id/tracks`.
- Normalize playlist name, image if available, author, track count, and tracks.
- Preserve license and attribution data for returned tracks.

Acceptance Criteria

- Frontend can browse public Jamendo playlists.
- Frontend can open one playlist and play tracks.

---

## name: [backend] Playlists - Done

### Goal

Store and manage user-owned playlists with both Jamendo tracks and uploaded tracks.

### Tasks

- Create `PlaylistsModule`.
- Create playlist with name and optional description.
- Validate playlist name as required.
- Return playlists with track count and total duration.
- Update playlist name and description.
- Add Jamendo tracks to playlists.
- Add uploaded tracks to playlists.
- Remove tracks from playlists.
- Reorder tracks.
- Delete playlists.
- Scope every operation to the authenticated user.

### Acceptance Criteria

- Users can only access their own playlists.
- Playlist track order is preserved after reload.
- Playlists return enough data for Library display.
- Deleting a playlist does not delete uploaded track files.

### Sub-issues

#### name: [backend] Playlist CRUD - Done

Goal

Create, list, view, update, and delete user playlists.

Tasks

- Add `GET /playlists`.
- Add `POST /playlists`.
- Add `GET /playlists/:id`.
- Add `PUT /playlists/:id`.
- Add `DELETE /playlists/:id`.
- Require authentication on every route.
- Validate create and update DTOs.
- Scope all queries to current user.

Acceptance Criteria

- User can manage only their own playlists.
- Playlist list includes track count and total duration.
- Playlist detail includes ordered tracks.

#### name: [backend] Add tracks to playlist - Done

Goal

Allow users to add Jamendo or uploaded tracks to a playlist.

Tasks

- Add `POST /playlists/:id/tracks`.
- Accept track source as `jamendo` or `uploaded`.
- Validate required source ID.
- For uploaded tracks, verify ownership.
- For Jamendo tracks, store enough normalized metadata for display and playback.
- Append new tracks to the end of the playlist order.

Acceptance Criteria

- User can add uploaded tracks they own.
- User cannot add another user's uploaded track.
- User can add Jamendo tracks using normalized metadata.
- Track order remains stable.

#### name: [backend] Remove playlist tracks - Done

Goal

Remove tracks from a playlist without deleting the source track.

Tasks

- Add `DELETE /playlists/:id/tracks/:trackId`.
- Require playlist ownership.
- Delete only the playlist item.
- Recalculate or compact order if needed.

Acceptance Criteria

- Removed track no longer appears in the playlist.
- Uploaded track file remains available outside the playlist.
- Other users' playlists cannot be changed.

#### name: [backend] Reorder playlist tracks - Done

Goal

Persist manual playlist track order.

Tasks

- Add `PUT /playlists/:id/tracks/reorder`.
- Accept ordered playlist track IDs.
- Validate every submitted item belongs to the playlist.
- Update order in one transaction.
- Return updated playlist detail.

Acceptance Criteria

- Reordered tracks stay in the same order after reload.
- Invalid track IDs are rejected.
- Partial reorder failures do not corrupt order.

---

## name: [backend] Recently played - Done

### Goal

Save and show user listening history.

### Tasks

- Create `RecentlyPlayedModule`.
- Save a history item when playback starts.
- Store track source as `jamendo` or `uploaded`.
- Store enough track data for display.
- Store played date and time.
- Return history newest first.
- Add date filtering.
- Scope history to the authenticated user.

### Acceptance Criteria

- Recently played list is user-specific.
- Playback creates a history item.
- Date filtering works.
- Clicking a history item starts playback.

### Sub-issues

#### name: [backend] Save recently played item - Done

Goal

Record a playback event for the current user.

Tasks

- Add `POST /recently-played`.
- Require authentication.
- Validate track source.
- Validate source ID.
- Store title, artist, cover URL if available, audio URL if needed, and duration.
- Store played timestamp.
- Optionally de-duplicate repeated plays if the product wants that behavior.

Acceptance Criteria

- Starting playback can create a history item.
- Invalid source values are rejected.
- History item belongs only to the authenticated user.

#### name: [backend] List recently played items - Done

Goal

Return user listening history for the frontend.

Tasks

- Add `GET /recently-played`.
- Require authentication.
- Return newest first.
- Add pagination or limit.
- Add date filtering.
- Return enough data to render and play each item.

Acceptance Criteria

- User sees only their own history.
- Date filtering returns the expected range.
- Returned items can be passed to the global player.

---

## name: [backend] Jamendo OAuth and user actions - Not Started

### Goal

Support user-specific Jamendo write actions only if the product needs Jamendo library updates.

### Tasks

- Add OAuth authorization URL generation.
- Add OAuth callback handling.
- Exchange authorization code for access and refresh tokens.
- Store tokens server-side.
- Protect or encrypt refresh tokens.
- Refresh expired access tokens.
- Add authenticated routes for Jamendo user actions.
- Never expose `JAMENDO_CLIENT_SECRET` to the frontend.

### Acceptance Criteria

- User can connect a Jamendo account.
- Expired access tokens are refreshed automatically.
- Refresh token rotation is handled.
- Write actions fail clearly when the user has not connected Jamendo.

### Sub-issues

#### name: [backend] Jamendo OAuth connection - Not Started

Goal

Connect a local user account to a Jamendo account.

Tasks

- Add route to generate Jamendo authorize URL.
- Add OAuth callback route.
- Validate OAuth `state`.
- Exchange authorization code for tokens.
- Store token expiry.
- Store refresh token securely.

Acceptance Criteria

- User can complete Jamendo OAuth flow.
- Invalid state is rejected.
- Tokens are not returned to the frontend.

#### name: [backend] Jamendo user write actions - Not Started

Goal

Allow connected users to update Jamendo music data from the app.

Tasks

- Add `GET /jamendo/me`.
- Add `GET /jamendo/me/tracks`.
- Add `POST /jamendo/me/fan`.
- Add `POST /jamendo/me/favorite`.
- Add `POST /jamendo/me/like`.
- Add `POST /jamendo/me/dislike`.
- Add `POST /jamendo/me/myalbum`.
- Refresh access token before protected Jamendo calls when needed.

Acceptance Criteria

- Connected users can call supported Jamendo write endpoints.
- Users without Jamendo connection receive a clear error.
- Insufficient scope errors are mapped clearly.

---

## name: [backend] Testing, docs, and production hardening - Not Started

### Goal

Make the backend reliable enough for feature integration and deployment.

### Tasks

- Add unit tests for services and mappers.
- Add e2e tests for main API routes.
- Add tests for auth guards and ownership checks.
- Add tests for Jamendo URL construction and error mapping.
- Add tests for upload validation.
- Add API documentation for environment variables and endpoints.
- Add request logging if needed.
- Add rate limiting for public-heavy routes.
- Add safe error handling for production.

### Acceptance Criteria

- `pnpm run test` passes.
- `pnpm run test:e2e` passes.
- Main user flows are covered by tests.
- README or backend docs explain how to run the backend locally.

### Sub-issues

#### name: [backend] API test coverage - Not Started

Goal

Cover important backend behavior with automated tests.

Tasks

- Test auth register and login.
- Test protected route access.
- Test upload validation.
- Test playlist ownership checks.
- Test playlist ordering.
- Test recently played filtering.
- Test Jamendo mapper behavior.
- Test Jamendo client error mapping.

Acceptance Criteria

- Tests cover success and failure paths for core features.
- Tests can run locally with one command.

#### name: [backend] Backend documentation - In Progress

Goal

Document how to configure, run, and integrate with the backend.

Tasks

- Replace default NestJS README content with project-specific instructions.
- Document required environment variables.
- Document local database setup.
- Document upload storage setup.
- Document available API routes.
- Document Jamendo setup.
- Add example `.env` values without secrets.

Acceptance Criteria

- A new developer can run the backend locally using the docs.
- Docs do not include real secrets.

#### name: [backend] Swagger OpenAPI setup - Not Started

Goal

Expose interactive API documentation for local development and frontend integration.

Tasks

- Install `@nestjs/swagger`.
- Configure Swagger in `main.ts`.
- Add `/docs` route.
- Add API tags for feature modules.
- Add DTO decorators for request and response examples.
- Add JWT bearer auth support.
- Hide or disable Swagger in production if needed.

Acceptance Criteria

- `GET /docs` opens Swagger UI locally.
- Auth endpoints and Jamendo endpoints are documented.
- Protected endpoints show bearer token authentication.

#### name: [backend] Rate limiting and caching - Not Started

Goal

Protect the backend and reduce unnecessary Jamendo API calls.

Tasks

- Add rate limiting to public search/browse endpoints.
- Add short-lived caching for Jamendo search and browse responses if needed.
- Do not cache user-specific private data.
- Keep cache keys based on normalized query params.

Acceptance Criteria

- Repeated public Jamendo requests do not overload the upstream API.
- User-specific responses are not cached globally.

#### name: [backend] Production error handling - Not Started

Goal

Return safe and consistent API errors.

Tasks

- Add global exception filter if not already added.
- Avoid leaking stack traces in production.
- Preserve useful validation error details.
- Log upstream failures with enough context to debug.
- Avoid logging secrets or tokens.

Acceptance Criteria

- Production errors are safe for frontend display.
- Logs contain useful debugging context without secrets.
