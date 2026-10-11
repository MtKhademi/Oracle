export type Profile = {
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  avatarDataUrl: string | null;
};

export const emptyProfile: Profile = {
  firstName: '',
  lastName: '',
  fullName: '',
  phone: '',
  email: '',
  avatarDataUrl: null,
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string | null;
  token: string | null;
  expiresAtUtc: string | null;
  displayName: string | null;
  isPlatformAdmin: boolean;
};
