import 'dotenv/config';

const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const jwtIssuer: string = process.env.JWT_ISSUER ?? 'community-chat';
const jwtAudience: string = process.env.JWT_AUDIENCE ?? 'community-chat-client';
const accessTokenTtl = process.env.ACCESS_TOKEN_TTL ?? '15m';
const refreshTokenTtl = process.env.REFRESH_TOKEN_TTL ?? '30d';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port');
}

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT token must be at 32 characters');
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
  databaseUrl,
  jwt: {
    secret: jwtSecret,
    issuer: jwtIssuer,
    audience: jwtAudience,
    accessTokenTtl,
    refreshTokenTtl,
  },
} as const;
