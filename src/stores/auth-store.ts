import { defineStore, acceptHMRUpdate } from 'pinia';
import { aquaService } from 'src/services/aqua.service';
import type { ProfileDto } from 'src/services/sdk';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: undefined as ProfileDto | undefined
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    async signIn(username: string, password: string) {
      const token = await aquaService.login(username, password);
      if (token) {
        this.user = await aquaService.getProfile();
      }
    },
    async authorizeUser() {
      this.user = await aquaService.getProfile();
    }
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
