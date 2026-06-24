# Auth Module

## Goal

Allow users to register, log in, and access protected backend resources with JWT.

## Endpoints

- `POST /auth/register`
- `POST /auth/login`

## Tasks

- Register user with email and password.
- Hash password before storage.
- Reject duplicate email.
- Validate login credentials.
- Issue authentication using the configured cookie, bearer, or combined transport.
- Return basic user profile without password.
- Add JWT guard for protected endpoints.
- Add current-user extraction for controllers.

## Acceptance Criteria

- Duplicate emails are rejected.
- Invalid credentials are rejected.
- A JWT supplied through an enabled authentication transport is required for protected endpoints.
- Password hashes are never returned by the API.
