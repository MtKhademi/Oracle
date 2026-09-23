export type Profile = {
  fullName: string;
  phone: string;
  email: string;
  avatarDataUrl: string | null;
};

export const emptyProfile: Profile = {
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
  passwordHash: string;
};
