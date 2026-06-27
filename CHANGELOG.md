# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1] - 2026-06-27

### Added
- NestJS 11 + TypeScript backend scaffold, all routes prefixed with `/api`.
- PostgreSQL persistence via the raw `pg` driver (no ORM): `DatabaseModule` /
  `DatabaseService` own a single pooled connection.
- Database migrations with node-pg-migrate (`users`, `refresh_tokens` tables).
- Zod-validated environment configuration that fails fast at boot.
- JWT authentication: register, login, refresh, and logout endpoints with
  bcrypt password hashing and httpOnly refresh-token cookies.

[Unreleased]: https://github.com/2iaad/tradel/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/2iaad/tradel/releases/tag/v0.0.1
