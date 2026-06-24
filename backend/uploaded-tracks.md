# Uploaded Tracks Module

## Goal

Allow authenticated users to upload, list, play, and delete their own audio tracks.

## Endpoints

- `POST /uploaded-tracks`
- `GET /uploaded-tracks`
- `DELETE /uploaded-tracks/:uploadedTrackId`

## Upload Fields

- `title`
- `artist`
- `genre`
- `file`

## Tasks

- Accept multipart/form-data upload.
- Validate required metadata.
- Validate audio file presence and type.
- Store file on the server.
- Store track metadata in the database.
- Return public playable URL.
- List tracks uploaded by the authenticated user.
- Delete uploaded track metadata.
- Delete uploaded file from storage.
- Prevent access to another user's uploaded tracks.

## Acceptance Criteria

- Uploaded tracks appear in Library.
- Uploaded tracks can be played by the global player.
- Users can delete only their own uploaded tracks.
- Invalid uploads return validation errors.
