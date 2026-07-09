import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type ResearcherStatus = 'pending' | 'verified' | 'suspended';

export interface AuthUser {
  // Holds the person's display name — their full name when set via signup,
  // or the entered username when set via the (mock) login form.
  username: string;
  email: string;
  role: string;
  status?: ResearcherStatus;
  affiliation?: string;
  departmentRole?: string;
  purposeOfRequest?: string;
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
      status: 'verified',
    };
  }

  // Submits a researcher account application for admin review. No real
  // backend exists yet, so this does not grant access — the applicant must
  // wait to be verified before they can log in with full researcher access.
  function signup(
    fullName: string,
    email: string,
    _password: string,
    affiliation: string,
    departmentRole: string,
    purposeOfRequest: string,
  ) {
    isLoggedIn.value = false;
    user.value = {
      username: fullName,
      email,
      role: 'Researcher',
      status: 'pending',
      affiliation,
      departmentRole,
      purposeOfRequest,
    };
  }

  function logout() {
    isLoggedIn.value = false;
    user.value = null;
  }

  return { isLoggedIn, user, displayName, login, signup, logout };
});
