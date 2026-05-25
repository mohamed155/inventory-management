import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubElectronAPI } from '../../setup/electron-api.ts';

const ok = <T>(data: T) => ({ success: true as const, data });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('signIn service', () => {
  it('delegates to electronAPI.signIn with correct args', async () => {
    const user = { id: '1', username: 'test' };
    const mock = stubElectronAPI({
      signIn: vi.fn().mockResolvedValue(ok(user)),
    });

    const { signIn } = await import('../../../src/services/auth.ts');
    const result = await signIn('test', 'pass');

    expect(mock.signIn).toHaveBeenCalledOnce();
    expect(mock.signIn).toHaveBeenCalledWith('test', 'pass');
    expect(result).toEqual(user);
  });
});

describe('createUser service', () => {
  it('delegates to electronAPI.createUser with the user object', async () => {
    const newUser = { id: '2', username: 'newuser' };
    const mock = stubElectronAPI({
      createUser: vi.fn().mockResolvedValue(ok(newUser)),
    });

    const { createUser } = await import('../../../src/services/auth.ts');
    const payload = { username: 'newuser', password: 'pass' } as any;
    const result = await createUser(payload);

    expect(mock.createUser).toHaveBeenCalledOnce();
    expect(mock.createUser).toHaveBeenCalledWith(payload);
    expect(result).toEqual(newUser);
  });
});

describe('getUserByUsername service', () => {
  it('delegates to electronAPI.getUserByUsername', async () => {
    const mock = stubElectronAPI({
      getUserByUsername: vi.fn().mockResolvedValue(ok(null)),
    });

    const { getUserByUsername } = await import('../../../src/services/auth.ts');
    await getUserByUsername('someuser');

    expect(mock.getUserByUsername).toHaveBeenCalledWith('someuser');
  });
});

describe('getUsersCount service', () => {
  it('delegates to electronAPI.getUsersCount with no args', async () => {
    const mock = stubElectronAPI({
      getUsersCount: vi.fn().mockResolvedValue(ok(5)),
    });

    const { getUsersCount } = await import('../../../src/services/auth.ts');
    const result = await getUsersCount();

    expect(mock.getUsersCount).toHaveBeenCalledOnce();
    expect(result).toBe(5);
  });
});
