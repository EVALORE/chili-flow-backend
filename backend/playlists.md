# Playlists Module

## Goal

Store and manage user playlists in the backend.

## Required Endpoints

- `GET /playlists`
- `POST /playlists`
- `PUT /playlists/:id`
- `DELETE /playlists/:id`

## Additional Endpoints

- `GET /playlists/:id`
- `POST /playlists/:id/tracks`
- `DELETE /playlists/:id/tracks/:trackId`
- `PUT /playlists/:id/tracks/reorder`

## Tasks

- Create playlist with name and optional description.
- Validate playlist name as required.
- Return playlists with track count and total duration.
- Update playlist name and description.
- Add Jamendo tracks to playlist.
- Add uploaded tracks to playlist.
- Remove tracks from playlist.
- Reorder tracks.
- Delete playlist.
- Scope every operation to the authenticated user.

## Acceptance Criteria

- Users can only access their own playlists.
- Playlist track order is preserved after reload.
- Playlists return enough data for Library display.
- Deleting a playlist does not delete uploaded track files.
