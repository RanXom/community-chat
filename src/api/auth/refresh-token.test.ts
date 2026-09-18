import { describe, expect, it } from 'vitest';
import { generateRefreshToken, hashRefreshToken } from './refresh-token.js';

describe('refresh token utilities', () => {
  it('generates a non-empty opaque token', () => {
    const token = generateRefreshToken();

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  it('generates unique token', () => {
    expect(generateRefreshToken()).not.toBe(generateRefreshToken());
  });

  it('produces deterministic hash', () => {
    const token = 'test-refresh-token';

    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
  });

  it('does not expose raw token in the hash', () => {
    const token = generateRefreshToken();

    expect(hashRefreshToken(token)).not.toContain(token);
  });
});
