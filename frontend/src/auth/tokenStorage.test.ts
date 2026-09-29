import {
  clearTokens,
  getAccessToken,
  hasAccessToken,
  setTokens,
} from './tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns null when no token is stored', () => {
    expect(getAccessToken()).toBeNull();
    expect(hasAccessToken()).toBe(false);
  });

  it('stores and reads access tokens', () => {
    setTokens('  access-abc  ', 'refresh-xyz');
    expect(getAccessToken()).toBe('access-abc');
    expect(hasAccessToken()).toBe(true);
  });

  it('clears tokens', () => {
    setTokens('access-abc', 'refresh-xyz');
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(hasAccessToken()).toBe(false);
  });

  it('ignores empty access tokens', () => {
    setTokens('   ');
    expect(getAccessToken()).toBeNull();
  });
});
