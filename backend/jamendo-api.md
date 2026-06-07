# Jamendo API Integration

## Goal

Add a backend integration for the Jamendo API v3.0 so the app can search, browse, stream, and optionally update a user's Jamendo music library.

Official docs:

- https://developer.jamendo.com/v3.0/docs
- https://developer.jamendo.com/v3.0/authentication
- https://developer.jamendo.com/v3.0/response-codes
- https://devportal.jamendo.com/api_terms_of_use

## Base API

- Base URL: `https://api.jamendo.com/v3.0`
- Read methods use `GET`.
- Write methods use `POST`.
- Prefer `format=json`.
- Every Jamendo API call requires `client_id`.
- Most list endpoints support `offset`, `limit`, `order`, and `fullcount`.
- `limit` defaults to `10`; maximum documented value is `200`.
- Array parameters are sent as space-separated values in examples, usually encoded as `+`, for example `tags=rock+pop`.

## Environment Variables

- `JAMENDO_CLIENT_ID`
- `JAMENDO_CLIENT_SECRET`
- `JAMENDO_REDIRECT_URI`
- `JAMENDO_API_BASE_URL=https://api.jamendo.com/v3.0`

## Authentication

### App Authentication

All requests include `client_id`.

For local read-only testing, Jamendo documents test client id `709fa152`, but production should use an application-specific client id from the Jamendo developer portal.

### OAuth2

OAuth2 is needed for write methods and user-specific private actions.

- Authorize URL: `GET https://api.jamendo.com/v3.0/oauth/authorize`
- Grant URL: `POST https://api.jamendo.com/v3.0/oauth/grant`
- Scope currently documented for protected music actions: `music`
- Authorization code expiry: `30` seconds
- Access token lifetime: `7200` seconds
- Refresh tokens rotate; overwrite the stored refresh token after every refresh.

Required authorize parameters:

- `client_id`
- Optional `redirect_uri`
- Optional `scope=music`
- Optional `response_type=code`
- Optional `state`

Required grant parameters for new tokens:

- `client_id`
- `client_secret`
- `grant_type=authorization_code`
- `code`
- `redirect_uri` if it was sent in the authorize request

Required grant parameters for refresh:

- `client_id`
- `client_secret`
- `grant_type=refresh_token`
- `refresh_token`

## Backend Implementation Tasks

- Create a `JamendoModule`.
- Create a typed `JamendoClient` service around the upstream API.
- Add config validation for all Jamendo environment variables.
- Add request helpers for `GET`, `POST`, and file redirect endpoints.
- Automatically add `client_id` and `format=json`.
- Do not expose `client_secret` to the frontend.
- Store Jamendo OAuth tokens server-side if user library writes are implemented.
- Encrypt or otherwise protect stored refresh tokens.
- Refresh expired access tokens before calling protected endpoints.
- Normalize Jamendo responses from `{ headers, results }` into the app response shape.
- Map Jamendo response `headers.code` errors to backend HTTP errors.
- Preserve `headers.warnings` in logs or response metadata.
- Add upstream request timeout handling.
- Add rate-limit protection and caching for search/browse endpoints.
- Validate query parameters with DTOs before calling Jamendo.
- Add tests for URL construction, error mapping, OAuth refresh, and endpoint DTOs.

## Important Response Handling

Jamendo JSON responses contain:

- `headers.status`
- `headers.code`
- `headers.error_message`
- `headers.warnings`
- `headers.results_count`
- `results`

Important response codes:

- `0`: success
- `3`: invalid parameter type/range/format
- `4`: missing required parameter
- `5`: invalid client id
- `6`: rate limit exceeded
- `7`: method not found
- `12`: invalid access token
- `13`: insufficient scope

File endpoints are exceptions. They redirect to files instead of returning normal JSON and can return HTTP `404` or `500`.

## Endpoint Inventory

### Read Endpoints

| Upstream endpoint | Required parameters | Auth | Purpose |
| --- | --- | --- | --- |
| `GET /albums` | `client_id` | App | Browse/filter albums and singles. |
| `GET /albums/file` | `client_id`, `id` | App | Redirect to an album ZIP download. |
| `GET /albums/tracks` | `client_id` | App | Albums with belonging tracks. |
| `GET /albums/musicinfo` | `client_id` | App | Albums with tags and descriptions. |
| `GET /artists` | `client_id` | App | Browse/filter artists. |
| `GET /artists/tracks` | `client_id` | App | Artists with tracks. |
| `GET /artists/albums` | `client_id` | App | Artists with albums. |
| `GET /artists/locations` | `client_id` | App | Artist location search/filtering. |
| `GET /artists/musicinfo` | `client_id` | App | Artists with tags and descriptions. |
| `GET /autocomplete` | `client_id`, `prefix` | App | Autocomplete tracks, albums, artists, and tags. |
| `GET /feeds` | `client_id` | App | Active editorial homepage feeds. |
| `GET /playlists` | `client_id` | App, optional OAuth | Browse public playlists or current user's playlists with `access_token`. |
| `GET /playlists/file` | `client_id`, `id` | App | Redirect to playlist ZIP download. |
| `GET /playlists/tracks` | `client_id` plus one of `id`, `name`, `user_id`, `access_token`, `user_name` | App, optional OAuth | Playlist with tracks. |
| `GET /radios` | `client_id` | App | List Jamendo radios. |
| `GET /radios/stream` | `client_id` plus `id` or `name` | App | Radio stream info; docs warn the returned stream link is not working. |
| `GET /reviews/albums` | `client_id` | App, optional OAuth | Album reviews. |
| `GET /reviews/tracks` | `client_id` | App, optional OAuth | Track reviews. |
| `GET /tracks` | `client_id` | App | Main track search/discovery endpoint. |
| `GET /tracks/file` | `client_id`, `id` | App | Redirect to track stream/download file. |
| `GET /tracks/similar` | `client_id`, `id` | App | Similar tracks for a track id. |
| `GET /users` | `client_id` plus one of `id`, `access_token`, `name` | App, optional OAuth | User lookup. |
| `GET /users/artists` | `client_id` plus one of `id`, `access_token`, `name` | App, optional OAuth | Artists the user follows as fan. |
| `GET /users/albums` | `client_id` plus one of `id`, `access_token`, `name` | App, optional OAuth | User's albums. |
| `GET /users/tracks` | `client_id` plus `id` or `access_token` | App, optional OAuth | User's liked, favorited, or reviewed tracks. |

### Write Endpoints

Write endpoints require a Jamendo application on the `Read & Write` plan and a user `access_token` with `music` scope.

| Upstream endpoint | Required parameters | Purpose |
| --- | --- | --- |
| `POST /setuser/fan` | `client_id`, `access_token`, `artist_id` | Make current Jamendo user a fan of an artist. |
| `POST /setuser/favorite` | `client_id`, `access_token`, `track_id` | Add a track to current Jamendo user's favorites. |
| `POST /setuser/like` | `client_id`, `access_token`, `track_id` | Like a track. |
| `POST /setuser/dislike` | `client_id`, `access_token`, `track_id` | Dislike a track. |
| `POST /setuser/myalbum` | `client_id`, `access_token`, `album_id` | Add an album to current Jamendo user's albums. |

## Track Data Needed By This App

For playback and playlists, normalize Jamendo tracks into this app shape:

- `source`: `jamendo`
- `sourceId`: Jamendo track id
- `title`: track name
- `artist`: artist name
- `artistId`
- `album`: album name if present
- `albumId` if present
- `duration`
- `coverUrl`: `image` or `album_image`
- `audioUrl`: `audio`
- `downloadUrl`: `audiodownload` only when download is allowed
- `shareUrl`
- `licenseUrl`: `license_ccurl`
- `audiodownloadAllowed`

Handle singles carefully. Jamendo documents that singles may have empty `album_id`, `album_name`, and `album_image`.

## Legal And Product Notes

- Jamendo content is published under Creative Commons licenses; preserve license data and attribution links.
- The terms require crediting Jamendo members and Jamendo, with backlinks to relevant Jamendo pages.
- Non-commercial API use is documented as free; commercial use requires contacting Jamendo Licensing.
- Do not build offline content caching beyond what is reasonably necessary for app operation.
- Respect `audiodownload_allowed`, `track_audiodownload_allowed`, and `zip_allowed`.
- Do not offer download actions when the corresponding allowed flag is false.

## Suggested Backend Routes

Expose app-focused routes instead of blindly proxying every upstream query.

- `GET /jamendo/search/tracks`
- `GET /jamendo/tracks/:id`
- `GET /jamendo/tracks/:id/similar`
- `GET /jamendo/tracks/:id/file`
- `GET /jamendo/albums`
- `GET /jamendo/albums/:id/tracks`
- `GET /jamendo/artists`
- `GET /jamendo/artists/:id/tracks`
- `GET /jamendo/autocomplete`
- `GET /jamendo/playlists`
- `GET /jamendo/playlists/:id/tracks`
- `GET /jamendo/me`
- `GET /jamendo/me/tracks`
- `POST /jamendo/me/fan`
- `POST /jamendo/me/favorite`
- `POST /jamendo/me/like`
- `POST /jamendo/me/dislike`
- `POST /jamendo/me/myalbum`

If full upstream parity is required, keep it behind one internal client with one DTO per upstream endpoint.

## Acceptance Criteria

- Backend can search Jamendo tracks and return normalized playable track objects.
- Backend can fetch a track by id and a similar-track list.
- Backend can add Jamendo tracks to local playlists.
- Backend never exposes Jamendo `client_secret`.
- Backend handles expired OAuth access tokens with refresh tokens.
- Backend maps Jamendo errors into clear API errors.
- Backend respects download/ZIP allowed flags.
- Backend has tests for all supported upstream endpoint wrappers.
