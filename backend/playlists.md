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
- `POST /playlists/:id/items`
- `DELETE /playlists/:id/items/:playlistItemId`
- `PUT /playlists/:id/items/reorder`

## Tasks

- Create playlist with name and optional description.
- Validate playlist name as required.
- Return playlists with item count and total duration.
- Update playlist name and description.
- Add Jamendo tracks as playlist items.
- Add uploaded tracks as playlist items.
- Remove playlist items without deleting source tracks.
- Reorder playlist items by playlist item ID.
- Delete playlist.
- Scope every operation to the authenticated user.

## Acceptance Criteria

- Users can only access their own playlists.
- Playlist item order is preserved after reload.
- Playlists return enough data for Library display.
- Deleting a playlist does not delete uploaded track files.
