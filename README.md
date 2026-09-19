<div align="center">

# Community Chat

A multi-role community and real-time chat engine, with a Node.js backend and a terminal-styled web client.

**Live demo:** [community-chat-frontend-cyb7.onrender.com](https://community-chat-frontend-cyb7.onrender.com/)

**Walkthrough (turn on sound beforehand):** [walkthrough.mp4](./walkthrough.mp4)

> [!NOTE]
> Two users are available by default for demo.
>
> **Alice, Admin:**
> - Email: `alice@email.com`
> - Password: `123456789`
>
> **Bob, Member:**
> - Email: `bob@email.com`
> - Password: `987654321`

[![Node](https://img.shields.io/badge/Node.js-22-339933?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square)](https://expressjs.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square)](https://socket.io)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square)](https://www.postgresql.org)

</div>

---

## About

Community Chat is a full-stack chat engine. The backend is a real-time messaging API with role-based access control, secure token rotation, channel management, and message rate limiting. The frontend is a React + Vite client styled like a green terminal, with an OS-aware light/dark theme.

The project is developed feature-by-feature on focused branches (see [Contributing](#contributing)). Every feature is verified with unit tests, integration smoke tests, and manual review before it is merged to `main`.

## Features

- **Authentication & security**
  - Email/password registration and login (Argon2 password hashing)
  - JWT access tokens plus **refresh-token rotation with families and reuse detection**
  - Role-based access control: `ADMIN`, `MODERATOR`, `MEMBER`
- **Community channels**
  - Channel listing, creation, joining, leaving and membership tracking
  - Admin-only channel deletion (cascades messages and memberships)
- **Real-time messaging (Socket.io)**
  - Live `message_created` broadcast to channel rooms
  - Typing indicators and online/offline presence
  - Per-user message rate limiting (3 messages / 3 seconds)
  - Paginated message history with cursor-based queries
- **Web client**
  - Optimistic sends with honest per-message states (`sending` / `sent` / `failed`)
  - Failed-message feedback for rate limits and other socket errors
  - Auto-scroll with a "N new messages" jump-to-latest banner
  - Micro-animations that respect `prefers-reduced-motion`
  - Light/dark theme switcher (persisted, defaults to OS preference)

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Backend | Node.js, TypeScript, Express 5, Socket.io 4 |
| Data | PostgreSQL 17, Prisma 7 (driver adapter), zod 4 validation |
| Auth | JWT (jose), Argon2, refresh-token families |
| Frontend | React 19, Vite 8, socket.io-client, CSS custom properties |
| Tooling | tsx watch, Vitest, ESLint, Prettier, Nix flake |

## Architecture

The backend follows a **feature-oriented layered architecture**:

```text
HTTP / WebSocket
       │
       ▼
  Middleware          requireAuth · requireRole · validate · requestLogger · errorHandler
       │
       ▼
   Controllers        auth · channels · messages · health
       │
       ▼
    Services          business logic, token rotation, rate limiting
       │
       ▼
     Prisma + PG      PostgreSQL 17
```

Real-time traffic flows through Socket.io rooms keyed by channel. Every socket
connection is JWT-authenticated from `socket.handshake.auth.token`.

### Repository layout

```text
src/                    backend (Express + Socket.io)
  api/                  feature routers (auth, channels, messages, health)
  middleware/           auth, role, validation, logging, error handling
  socket/               room, message, typing, presence and rate-limit handlers
  config/               env parsing & validation
  prisma/               Prisma client wiring (Pg driver adapter)
  utils/                AppError, password hashing
web/                    frontend (React + Vite)
  src/components/       auth · channels · chat · common (Dialog, ThemeSwitcher)
  src/hooks/            useAuth · useChat · useTheme
  src/services/         REST client and socket factory
prisma/                 schema + SQL migrations
```

## API Overview

All endpoints are JSON under `/api`; authenticated routes expect a
`Authorization: Bearer <accessToken>` header.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | Register a user |
| POST | `/api/auth/login` | public | Login, returns tokens + user |
| POST | `/api/auth/refresh` | public | Rotate the refresh token |
| POST | `/api/auth/logout` | public | Revoke the refresh token |
| GET | `/api/auth/me` | auth | Current user profile |
| GET | `/api/auth/*-test` | role-gated | Role gate tests (`admin`/`moderator`/`member`) |
| GET | `/api/channels` | auth | List all channels |
| POST | `/api/channels` | ADMIN/MODERATOR | Create a channel |
| GET | `/api/channels/:id` | auth | Get one channel |
| POST | `/api/channels/:id/join` | auth | Join a channel |
| DELETE | `/api/channels/:id/leave` | auth | Leave a channel |
| GET | `/api/channels/:id/members` | auth | List channel members |
| DELETE | `/api/channels/:id` | ADMIN | Delete a channel |
| GET | `/api/channels/:id/messages?cursor=&limit=` | auth | Paginated message history (default 50) |
| GET | `/health` | public | Health check (`{ status: "ok" }`) |

### Socket.io events

Client → server: `join_channel`, `leave_channel`, `send_message`, `typing_start`, `typing_stop`

Server → client: `message_created`, `user_typing`, `user_stopped_typing`, `user_online`, `user_offline`, `channel_joined`, `channel_left`, `error`

Socket errors include `Too many messages`, `Channel membership required`, `Invalid message`, and `Failed to send message`.

## Quickstart

### Prerequisites

- Node.js 22+ and npm
- Docker (for the local PostgreSQL container) *or* a PostgreSQL 17 instance
- Optional: [Nix](https://nixos.org) with `direnv` for the pinned dev shell (`flake.nix`)

### 1. Install dependencies

```bash
npm install
npm install --prefix web
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set a strong `JWT_SECRET` (32+ chars) plus your `DATABASE_URL`
if it differs from the default. See [Environment variables](#environment-variables).

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Apply database migrations

```bash
npx prisma migrate dev
```

### 5. Run the backend

```bash
npm run dev          # tsx watch; serves API + Socket.io on :3000
```

### 6. Run the web client

```bash
npm run dev --prefix web   # Vite dev server on :5173
```

Open [http://localhost:5173](http://localhost:5173), register an account and join or
create a channel. To exercise admin controls, promote your user to `ADMIN` in the
database (`UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';`)
or use a separate browser profile so you can chat as two users at once.

### Verification

```bash
npm test                # unit tests (JWT, refresh tokens, password hashing)
npm run lint            # backend + frontend linting
npm run typecheck       # backend static type check
npm run build           # backend build (web: npm run build --prefix web)
```

## Environment Variables

Backend: `.env` (see `.env.example`):

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | `development` | no | Runtime environment |
| `PORT` | `3000` | no | HTTP + Socket.io port |
| `DATABASE_URL` | none | **yes** | PostgreSQL connection string |
| `JWT_SECRET` | none | **yes** | Access/refresh token signing secret (32+ chars) |
| `JWT_ISSUER` | `community-chat` | no | Token issuer claim |
| `JWT_AUDIENCE` | `community-chat-client` | no | Token audience claim |
| `ACCESS_TOKEN_TTL` | `15m` | no | Access token lifetime |
| `REFRESH_TOKEN_TTL` | `30d` | no | Refresh token lifetime |
| `FRONTEND_URL` | `http://localhost:5173` | no | CORS + Socket.io origin |

Frontend: `web/.env.local`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://127.0.0.1:3000/api` | REST base URL |
| `VITE_SOCKET_URL` | `http://127.0.0.1:3000` | Socket.io server URL |

## Database Schema

`prisma/schema.prisma` defines the core entities:

- **User**: profile + `Role` (`ADMIN`/`MODERATOR`/`MEMBER`)
- **Channel**: unique name + optional description
- **ChannelMember**: many-to-many join with `mutedUntil` (composite primary key)
- **Message**: content + author + channel, indexed by `(channelId, createdAt DESC)`
- **RefreshToken**: hashed token with rotation `familyId`, expiry and revocation

## Contributing

Community Chat is developed feature-by-feature:

1. Branch from the latest `main` using `feat/<scope>` or `fix/<topic>` names
   (e.g. `feat/ui`, `feat/auth`, `chore/docs`).
2. Commit with [Conventional Commits](https://www.conventionalcommits.org)
   (`feat(scope): …`, `fix(scope): …`, `refactor(scope): …`, `chore(scope): …`).
3. Keep each commit a single logical change, and keep features isolated to their branch.
4. Verify locally: lint, typecheck, backend tests, and a live smoke test of the
   affected surface.
5. Open a pull request to `main` with the `## Summary` / `## Changes` description
   format and merge it.

## Roadmap

The core loop (auth, channels, real-time messaging, rate limiting, admin controls
and themes) is implemented on `main`. Upcoming ideas include message editing and
deletion, moderation (mutes/bans), search, and transport-level tests.

## License

This repository is a private portfolio project and is **not** licensed for reuse.
All rights reserved.