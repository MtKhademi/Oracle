import { loadProfile, saveProfile } from '../profileStorage';
import type { ProfileService } from './profileService';

export const localProfileService: ProfileService = {
  async getProfile() {
    return loadProfile();
  },

  async saveProfile(profile) {
    saveProfile(profile);
    return profile;
  },
};
