import type { Profile } from '../types';
import { serverProfileService } from './serverProfileService';

export interface ProfileService {
  getProfile(): Promise<Profile>;
  saveProfile(profile: Profile): Promise<Profile>;
}

export const profileService: ProfileService = serverProfileService;
