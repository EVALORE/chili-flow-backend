# Endpoint Intent Decision Document

## Summary

The current API surface mixes several meanings of "track" across uploaded audio,
Jamendo catalog content, and playlist rows. This makes the endpoint intent hard
to understand from Swagger alone and increases the chance that frontend code will
send the wrong ID to the wrong route.

This document recommends an explicit separation between:

- Jamendo catalog resources.
- User uploaded tracks.
- User playlists.
- Playlist items.
- Playback history.

This document records the implemented endpoint model. It should guide future
route names, DTO wording, Swagger descriptions, and migration work.

## Domain Terms

| Term | Meaning | Ownership | Persistence |
| --- | --- | --- | --- |
| Catalog track | External Jamendo track returned by the catalog API. | Not owned by the app user. | Not stored as a local track by default. |
| Uploaded track | User-owned local audio file and metadata. | Owned by one authenticated app user. | Stored in local DB and file storage. |
| Playlist | User-owned ordered collection. | Owned by one authenticated app user. | Stored in local DB. |
| Playlist item | One row inside a playlist. It references either a Jamendo track or an uploaded track and stores display/playback snapshot data. | Owned through its playlist. | Stored in local DB. |
| Recently played item | Playback event snapshot created when the user plays something. | Owned by one authenticated app user. | Stored in local DB. |

## Previous Ambiguity

Before this endpoint model, "track" meant different things depending on the
route:

- `/tracks` means uploaded tracks only.
- `/catalog/tracks` means Jamendo catalog tracks.
- `/playlists/{id}/tracks/{trackId}` uses `trackId` for a playlist row, not the
  original Jamendo or uploaded track ID.
- `sourceId` changes meaning based on `source`:
  - For `source: "jamendo"`, it is a Jamendo track ID.
  - For `source: "uploaded"`, it is an uploaded track ID.

The API works technically, but the names make the data model harder to reason
about. A playlist does not contain source tracks directly. It contains playlist
items that point to source tracks and snapshot enough metadata for display and
playback.

## Recommended Endpoint Model

Use explicit resource names that describe intent and ownership.

```txt
POST   /uploaded-tracks
GET    /uploaded-tracks
DELETE /uploaded-tracks/{uploadedTrackId}

GET    /catalog/tracks
GET    /catalog/tracks/{catalogTrackId}
GET    /catalog/albums
GET    /catalog/artists
GET    /catalog/playlists

GET    /playlists
POST   /playlists
GET    /playlists/{playlistId}
PUT    /playlists/{playlistId}
DELETE /playlists/{playlistId}

POST   /playlists/{playlistId}/items
DELETE /playlists/{playlistId}/items/{playlistItemId}
PUT    /playlists/{playlistId}/items/reorder

GET    /recently-played
POST   /recently-played
```

Playlist item creation should keep `source` and `sourceId`, because the client
still needs to say which backing track should be added:

```json
{
  "source": "jamendo",
  "sourceId": "123456"
}
```

```json
{
  "source": "uploaded",
  "sourceId": "uploaded-track-uuid"
}
```

Once added, the playlist response should expose a playlist item ID. Follow-up
operations such as delete and reorder should use playlist item IDs, not source
track IDs.

## Decision Options

| Option | Description | Pros | Cons | Recommendation |
| --- | --- | --- | --- | --- |
| A. Explicit separation | Keep catalog, uploaded tracks, playlists, playlist items, and history as separate concepts with separate route names. | Clearest intent, matches current DB model, avoids source ID confusion, smallest product assumption. | Requires endpoint and DTO renames. | Recommended. |
| B. Unified local library | Import or save Jamendo tracks into a local library model and treat uploaded and Jamendo tracks as one local track concept. | Useful if the product needs favorites, saved library, offline metadata, or user-level collection management. | Adds more data modeling, sync rules, duplicate handling, and Jamendo OAuth questions. | Wait until there is a concrete product need. |
| C. Keep current routes and clarify names only | Keep `/tracks` and `/playlists/{id}/tracks`, but improve Swagger and rename parameters like `playlistTrackId`. | Least disruptive in the short term. | Still leaves route-level ambiguity and keeps two meanings of "tracks". | Acceptable only as a temporary bridge. |

Option A should be the default direction because it is the simplest model that
matches the current implementation. Option B should wait until the product
explicitly needs saved Jamendo library behavior, favorites, offline metadata, or
Jamendo OAuth user-library actions.

## Jamendo Boundary

Jamendo should stay read-only and catalog-focused for now:

- Catalog endpoints search and browse Jamendo content.
- Local app endpoints manage local user data: uploads, playlists, playlist
  items, and history.
- Adding a Jamendo track to a playlist should snapshot the track metadata into a
  playlist item.
- Playing a Jamendo track should snapshot the playback event into recently
  played history.

The backend should not implement Jamendo OAuth, Jamendo user library writes, or
full upstream endpoint parity unless the product has a clear use case for those
features.

## Implementation Notes

- The `tracks` module/routes are named `uploaded-tracks` in the public API.
- Playlist route wording uses `items`.
- Playlist item DTO and parameter wording uses:
  - `trackId` -> `playlistItemId`.
  - `trackIds` -> `playlistItemIds`.
- Keep `source` and `sourceId` only for creating playlist items and history
  records from a backing source.
- Add Swagger descriptions for every endpoint explaining:
  - whether the resource is local or external;
  - whether authentication and user ownership apply;
  - what each path ID represents;
  - whether the endpoint uses source IDs or playlist item IDs.
- This implementation is a breaking rename. Old route aliases are not exposed.

## Test Plan

Implementation should include:

- E2E tests for renamed uploaded track routes.
- E2E tests proving playlist item delete/reorder uses playlist item IDs.
- E2E tests proving `sourceId` is accepted only when creating playlist items.
- Swagger review to confirm route names and descriptions remove ambiguity.
