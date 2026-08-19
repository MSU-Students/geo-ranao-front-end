import { defineBoot } from '#q-app/wrappers';
import { useAuthStore } from 'src/stores/auth';

// Restores a logged-in session from the persisted JWT (if any) before the
// app renders, so a page refresh doesn't bounce a logged-in user back to
// the login screen while the token is still being validated.
export default defineBoot(async () => {
  const authStore = useAuthStore();
  await authStore.restoreSession();
});
