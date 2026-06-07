# Recently Played Module

## Goal

Save and show user listening history.

## Endpoints

- `GET /recently-played`
- `POST /recently-played`

## Tasks

- Save a history item when playback starts.
- Store track source:
  - Jamendo.
  - Uploaded.
- Store enough track data for display:
  - Track ID.
  - Title.
  - Artist.
  - Cover URL if available.
  - Audio URL if needed.
  - Duration.
- Store played date and time.
- Return history newest first.
- Add date filtering.
- Scope history to authenticated user.

## Acceptance Criteria

- Recently played list is user-specific.
- Playback creates a history item.
- Date filtering works.
- Clicking a history item starts playback.
