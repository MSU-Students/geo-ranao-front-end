import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { api, AUTH_TOKEN_KEY } from 'src/boot/axios';

export type ResearcherStatus = 'pending' | 'verified' | 'suspended' | 'rejected';

export interface AuthUser {
  id: number;
  // Holds the person's display name — their full name from the backend.
  username: string;
  email: string;
  role: string;
  status?: ResearcherStatus;
  affiliation?: string;
  departmentRole?: string;
  purposeOfRequest?: string;
}

interface BackendUser {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'RESEARCHER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  affiliation: string;
  departmentRole?: string;
  purposeOfRequest: string;
}

function mapStatus(status: BackendUser['status']): ResearcherStatus {
  switch (status) {
    case 'APPROVED':
      return 'verified';
    case 'SUSPENDED':
      return 'suspended';
    case 'REJECTED':
      return 'rejected';
    default:
      return 'pending';
  }
}

function mapUser(u: BackendUser): AuthUser {
  const authUser: AuthUser = {
    id: u.id,
    username: u.fullName,
    email: u.email,
    role: u.role === 'ADMIN' ? 'Admin' : 'Researcher',
    status: mapStatus(u.status),
    affiliation: u.affiliation,
    purposeOfRequest: u.purposeOfRequest,
  };
  if (u.departmentRole) authUser.departmentRole = u.departmentRole;
  return authUser;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false);
  const user = ref<AuthUser | null>(null);
  // Flips true once a page-refresh session restore attempt has finished
  // (success or failure) — lets pages avoid bouncing to /auth/login while
  // a previously logged-in session is still being validated against the API.
  const authReady = ref(false);

  const displayName = computed(() => user.value?.username ?? 'Guest');

  async function login(email: string, password: string): Promise<void> {
    try {
      const { data } = await api.post<{ access_token: string; user: BackendUser }>('/auth/login', {
        email,
        password,
      });
      localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
      user.value = mapUser(data.user);
      isLoggedIn.value = true;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Invalid email or password.'));
    }
  }

  // Submits a researcher account application for admin review. Does not log
  // the applicant in — the account stays pending until an admin approves it.
  async function signup(
    fullName: string,
    email: string,
    password: string,
    affiliation: string,
    departmentRole: string,
    purposeOfRequest: string,
  ): Promise<void> {
    try {
      await api.post('/auth/register', {
        fullName,
        email,
        password,
        confirmPassword: password,
        affiliation,
        departmentRole: departmentRole || undefined,
        purposeOfRequest,
      });
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Registration failed. Please try again.'));
    }
  }

  async function restoreSession(): Promise<void> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      authReady.value = true;
      return;
    }
    try {
      const { data } = await api.get<BackendUser>('/auth/profile');
      user.value = mapUser(data);
      isLoggedIn.value = true;
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      user.value = null;
      isLoggedIn.value = false;
    } finally {
      authReady.value = true;
    }
  }

  function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    isLoggedIn.value = false;
    user.value = null;
  }

  return { isLoggedIn, user, authReady, displayName, login, signup, logout, restoreSession };
});
