import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password.js';

describe('password utilities', () => {
  it('hashes and verifies the password', async () => {
    const password = 'correct horse battery staple';

    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await verifyPassword(hash, password)).toBe(true);
  });

  it('rejects incorrect password', async () => {
    const hash = await hashPassword('correct password');

    expect(await verifyPassword(hash, 'wrong password')).toBe(false);
  });
});
