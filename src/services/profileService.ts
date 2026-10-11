import type { Profile } from '../types';
import { localProfileService } from './localProfileService';
import { serverProfileService } from './serverProfileService';

export interface ProfileService {
  getProfile(): Promise<Profile>;
  saveProfile(profile: Profile): Promise<Profile>;
}

export const profileService: ProfileService = import.meta.env.DEV ? serverProfileService : localProfileService;
