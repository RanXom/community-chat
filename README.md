# Community Chat

A multi-role community and real-time chat engine built as a portfolio-grade backend system.

## Tech Stack

### Backend

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- Socket.io
- Zod
- JWT
- Argon2

### Demo Client

- React
- Vite

## Project Goals

The system provides:

- user registration and authentication;
- role-based access control;
- community channel management;
- channel membership;
- real-time messaging;
- message persistence;
- typing indicators;
- online/offline presence;
- moderation;
- message rate limiting.

The backend is designed with a focus on:

1. correctness;
2. security;
3. clarity;
4. testability;
5. performance;
6. scalability.

## Architecture

The backend follows a feature-oriented layered architecture:

```text
HTTP / WebSocket
       │
       ▼
  Middleware
       │
       ▼
   Controllers
       │
       ▼
    Services
       │
       ▼
     Prisma
       │
       ▼
   PostgreSQL
````

Real-time communication is handled through Socket.io.

## Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run the type checker:

```bash
npm run typecheck
```

Build the project:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

## Environment

Copy the example environment configuration:

```bash
cp .env.example .env
```

Environment variables will be documented as the corresponding infrastructure is introduced.

## Project Status

The project is currently in **Phase 0 — Repository & Tooling**.

The implementation is being developed incrementally. Planned features are not considered implemented until they are verified through the repository, tests, or explicit manual verification.
