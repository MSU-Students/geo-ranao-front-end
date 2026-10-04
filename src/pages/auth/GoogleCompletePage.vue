<template>
  <q-page class="flex flex-center" style="min-height: 100vh">
    <q-card class="q-pa-xl text-center" style="width: 100%; max-width: 420px; border-radius: 20px">
      <template v-if="loading">
        <q-spinner color="primary" size="48px" />
        <div class="text-subtitle1 text-grey-8 q-mt-md">Finishing Google sign-in…</div>
      </template>
      <template v-else-if="errorMsg">
        <q-icon name="error" color="negative" size="48px" />
        <div class="text-subtitle1 text-grey-9 q-mt-md">{{ errorMsg }}</div>
        <q-btn
          color="primary"
          label="Back to Login"
          unelevated
          rounded
          class="q-mt-lg"
          to="/auth/login"
        />
      </template>
      <template v-else>
        <q-icon name="check_circle" color="positive" size="48px" />
        <div class="text-subtitle1 text-grey-9 q-mt-md">Signed in with Google!</div>
      </template>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
// Landing point for the backend's /auth/google/callback redirect — reads
// either ?token=... (an existing, approved, Google-linked account) or
// ?error=... (a Google identity that exists but isn't approved yet, mirrors
// the same pending/rejected/suspended messages as a normal login attempt).
// A brand-new Google identity never lands here at all — the backend sends
// that case straight to /auth/signup?googleToken=... instead (see
// SignupPage.vue).
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const errorMsg = ref('');

onMounted(async () => {
  const token = route.query.token;
  const error = route.query.error;

  if (typeof error === 'string' && error) {
    errorMsg.value = error;
    loading.value = false;
    return;
  }
  if (typeof token !== 'string' || !token) {
    errorMsg.value = 'Missing sign-in token — please try again.';
    loading.value = false;
    return;
  }

  try {
    await authStore.loginWithToken(token);
    const target = authStore.user?.role === 'Admin' ? '/admin' : '/map';
    await router.push(target);
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Google sign-in failed.';
    loading.value = false;
  }
});
</script>
