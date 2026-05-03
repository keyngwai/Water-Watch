# Security Policies

## Overview

This checklist maps implemented controls to project security requirements.

## Implemented Security Checklist

- [x] JWT authentication with role authorization middleware.
- [x] Short-lived access JWTs plus opaque refresh tokens (httpOnly cookie, hashed at rest, rotation on refresh).
- [x] Password hashing with bcrypt.
- [x] Request validation with `express-validator`.
- [x] Rate limiting for API and auth-sensitive endpoints.
- [x] Helmet security headers and restricted CORS origins.
- [x] Reset password token expiry and one-time token consumption.
- [x] Reset token invalidation when a new token is issued.
- [x] Security event audit logs in `security_events`.
- [x] Admin action audit logs in `admin_actions`.
- [x] Upload sanitization (image format normalization + EXIF stripping).

## Password Policy

- Minimum 8 characters.
- Must include uppercase, lowercase, and numeric characters.
- Reset token required for password reset action.

## Session/Token Policy

- Access token is JWT signed with `JWT_SECRET` (short TTL via `JWT_EXPIRES_IN`).
- Refresh token is opaque, stored **hashed** in `refresh_sessions`, delivered as httpOnly cookie `maji_refresh`, rotated on `/api/auth/refresh`.
- Expired/invalid JWTs return `AUTH_EXPIRED` / `AUTH_INVALID`; failed refresh returns `AUTH_REFRESH_*`.
- Auth endpoints are throttled to reduce brute-force risk.

## Monitoring & Audit

- `security_events` records password reset requests and outcomes.
- `admin_actions` tracks report workflow actions by admins.
- Application logs (Winston) capture security-relevant errors and warnings.
