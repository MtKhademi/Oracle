import { expireServerSession, loadServerToken } from '../authStorage';
import { loadProfile, saveProfile } from '../profileStorage';
import type { Profile } from '../types';
import type { ProfileService } from './profileService';

type MeResponse = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  mobileNumber: string | null;
  email: string | null;
};

function authorizationHeaders(): HeadersInit {
  const token = loadServerToken();
  if (!token) {
    expireServerSession();
    throw new Error('نشست شما معتبر نیست. دوباره وارد شوید.');
  }
  return { Authorization: `Bearer ${token}` };
}

function toProfile(me: MeResponse): Profile {
  const local = loadProfile();
  return {
    firstName: me.firstName ?? '',
    lastName: me.lastName ?? '',
    fullName: me.displayName,
    phone: me.mobileNumber ?? '',
    email: me.email ?? '',
    avatarDataUrl: local.avatarDataUrl,
  };
}

async function parseError(response: Response): Promise<Error> {
  if (response.status === 401) {
    expireServerSession();
    return new Error('نشست شما منقضی شده است. دوباره وارد شوید.');
  }

  const body = await response.json().catch(() => null);
  const errors = body && typeof body === 'object' && 'errors' in body
    ? Object.values((body as { errors?: Record<string, string[]> }).errors ?? {}).flat()
    : [];
  return new Error(errors[0] ?? 'دریافت یا ذخیره مشخصات انجام نشد.');
}

export const serverProfileService: ProfileService = {
  async getProfile() {
    const response = await fetch('/iam/api/me', { headers: authorizationHeaders() });
    if (!response.ok) throw await parseError(response);
    return toProfile(await response.json() as MeResponse);
  },

  async saveProfile(profile) {
    const response = await fetch('/iam/api/me', {
      method: 'PATCH',
      headers: { ...authorizationHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: profile.firstName.trim(), lastName: profile.lastName.trim() }),
    });
    if (!response.ok) throw await parseError(response);

    const updated = toProfile(await response.json() as MeResponse);
    const result = { ...updated, avatarDataUrl: profile.avatarDataUrl };
    saveProfile(result);
    return result;
  },
};
