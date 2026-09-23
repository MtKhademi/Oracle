import { emptyProfile, type Profile } from './types';

const STORAGE_KEY = 'oracle_profile_v1';

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return emptyProfile;
    return {
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      avatarDataUrl: typeof parsed.avatarDataUrl === 'string' ? parsed.avatarDataUrl : null,
    };
  } catch {
    return emptyProfile;
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // storage blocked or full (e.g. a very large avatar image) — ignore, in-memory state still works
  }
}
