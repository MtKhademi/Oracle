import { loadServerUser, loadSessionUserId } from './authStorage';

const LEGACY_STORAGE_OWNER_KEY = 'oracle_private_storage_owner_v1';

export function getActiveStorageUserId(): string | null {
  return loadServerUser()?.id ?? loadSessionUserId();
}

// Private browser-only data used to live in global keys. Bind those keys to
// the first authenticated owner that opens the upgraded app, then keep every
// user's data isolated under a stable user-specific key.
export function getUserScopedStorageKey(baseKey: string, ownerId?: string | null): string {
  const userId = ownerId === undefined ? getActiveStorageUserId() : ownerId;
  if (!userId) return baseKey;

  const scopedKey = `${baseKey}:${userId}`;
  try {
    let legacyOwnerId = localStorage.getItem(LEGACY_STORAGE_OWNER_KEY);
    if (!legacyOwnerId) {
      legacyOwnerId = userId;
      localStorage.setItem(LEGACY_STORAGE_OWNER_KEY, userId);
    }

    if (legacyOwnerId === userId && localStorage.getItem(scopedKey) === null) {
      const legacyValue = localStorage.getItem(baseKey);
      if (legacyValue !== null) localStorage.setItem(scopedKey, legacyValue);
    }
  } catch {
    // Storage may be unavailable; callers retain their existing safe fallbacks.
  }
  return scopedKey;
}
