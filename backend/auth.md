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
- Return JWT after successful login.
- Return basic user profile without password.
- Add JWT guard for protected endpoints.
- Add current-user extraction for controllers.

## Acceptance Criteria

- Duplicate emails are rejected.
- Invalid credentials are rejected.
- JWT is required for protected endpoints.
- Password hashes are never returned by the API.
