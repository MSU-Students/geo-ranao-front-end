import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface AuthUser {
  username: string;
  email: string;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false);
  const user = ref<AuthUser | null>(null);

  const displayName = computed(() => user.value?.username ?? 'Guest');

  function login(username: string, _password: string) {
    // No real backend — accept any credentials
    isLoggedIn.value = true;
    user.value = {
      username,
      email: `${username.toLowerCase().replace(/\s+/g, '.')}@msumain.edu.ph`,
      role: 'Researcher',
    };
  }

  function signup(username: string, email: string, _password: string, role: string) {
    isLoggedIn.value = true;
    user.value = { username, email, role };
  }

  function logout() {
    isLoggedIn.value = false;
    user.value = null;
  }

  return { isLoggedIn, user, displayName, login, signup, logout };
});
