import { beforeEach, describe, expect, it } from 'vitest';
import { useCurrentUserStore } from '@/store/user.store.ts';

beforeEach(() => {
  useCurrentUserStore.setState({ currentUser: null });
});

describe('user store', () => {
  it('starts with null currentUser', () => {
    expect(useCurrentUserStore.getState().currentUser).toBeNull();
  });

  it('setCurrentUser stores the provided user', () => {
    const user = { id: '1', firstname: 'Test', lastname: 'User' } as any;
    useCurrentUserStore.getState().setCurrentUser(user);
    expect(useCurrentUserStore.getState().currentUser).toEqual(user);
  });

  it('calling setCurrentUser twice stores only the second user', () => {
    const first = { id: '1', firstname: 'First', lastname: 'User' } as any;
    const second = { id: '2', firstname: 'Second', lastname: 'User' } as any;

    useCurrentUserStore.getState().setCurrentUser(first);
    useCurrentUserStore.getState().setCurrentUser(second);

    expect(useCurrentUserStore.getState().currentUser?.id).toBe('2');
  });
});
