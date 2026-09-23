import type { Profile } from '../types';
import { localProfileService } from './localProfileService';

export interface ProfileService {
  getProfile(): Promise<Profile>;
  saveProfile(profile: Profile): Promise<Profile>;
}

// The only place that needs to change to point at a server-backed implementation later.
export const profileService: ProfileService = localProfileService;
