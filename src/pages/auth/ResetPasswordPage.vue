<template>
  <q-page class="q-pa-xl window-width row justify-center items-center bg-blue-grey-1">
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
      style="filter: blur(5px) brightness(0.5); z-index: 0"
    />

    <BackButton to="/auth/login" :offset="false" />

    <q-card
      class="shadow-24 row"
      style="width: 900px; max-width: 95vw; min-height: 480px; border-radius: 20px"
    >
      <div class="col-md-6 col-12 bg-primary text-white flex flex-center rounded-left">
        <div class="text-center q-pa-xl">
          <q-icon name="lock_reset" size="80px" class="q-mb-md opacity-80" />
          <h2 class="text-h3 text-weight-bolder q-mb-sm q-mt-none tracking-tight">
            ACCOUNT RECOVERY
          </h2>
          <p class="text-h6 text-weight-light opacity-80">
            Choose a new password for your account
          </p>
        </div>
      </div>

      <div class="col-md-6 col-12 bg-white flex flex-center rounded-right">
        <div class="q-pa-xl full-width" style="max-width: 420px">
          <template v-if="!token">
            <div class="text-center">
              <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md" />
              <div class="text-h5 text-weight-bold text-grey-9 q-mb-sm">Invalid Link</div>
              <p class="text-grey-7 q-mb-lg">
                This reset link is missing its token. Please request a new one.
              </p>
              <q-btn
                unelevated
                color="primary"
                label="Request a New Link"
                style="border-radius: 8px"
                @click="goToForgotPassword"
              />
            </div>
          </template>

          <template v-else-if="done">
            <div class="text-center">
              <q-icon name="check_circle" size="64px" color="positive" class="q-mb-md" />
              <div class="text-h5 text-weight-bold text-grey-9 q-mb-sm">Password Reset</div>
              <p class="text-grey-7 q-mb-lg">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <q-btn
                unelevated
                color="primary"
                label="Back to Sign In"
                style="border-radius: 8px"
                @click="goToLogin"
              />
            </div>
          </template>

          <template v-else>
            <div class="text-h5 text-weight-bold text-center text-grey-9 q-mb-xs">
              Set a New Password
            </div>
            <div class="text-subtitle2 text-center text-grey-6 q-mb-lg">
              Choose a new password for your account.
            </div>

            <q-banner v-if="resetError" class="bg-red-1 text-red q-mb-md" rounded>
              <template #avatar><q-icon name="error" color="red" /></template>
              {{ resetError }}
            </q-banner>

            <q-input
              outlined
              v-model="newPassword"
              :type="showPassword ? 'text' : 'password'"
              label="New Password"
              color="primary"
              lazy-rules
              class="q-mb-sm"
              :rules="[(val) => (val && val.length >= 8) || 'Password must be at least 8 characters']"
            >
              <template v-slot:prepend><q-icon name="lock" class="text-grey-7" /></template>
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility' : 'visibility_off'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <q-input
              outlined
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              label="Confirm New Password"
              color="primary"
              lazy-rules
              class="q-mb-lg"
              :rules="[
                (val) => !!val || 'Please confirm your new password',
                (val) => val === newPassword || 'Passwords do not match',
              ]"
              @keyup.enter="handleResetPassword"
            >
              <template v-slot:prepend><q-icon name="lock" class="text-grey-7" /></template>
              <template v-slot:append>
                <q-icon
                  :name="showConfirmPassword ? 'visibility' : 'visibility_off'"
                  class="cursor-pointer"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </q-input>

            <q-btn
              unelevated
              size="lg"
              color="primary"
              class="full-width text-weight-bold"
              label="Reset Password"
              :loading="resetting"
              :disable="!canReset"
              style="border-radius: 8px"
              @click="handleResetPassword"
            />
          </template>
        </div>
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import BackButton from 'src/components/BackButton.vue';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const token = typeof route.query.token === 'string' ? route.query.token : '';

const newPassword = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const resetting = ref(false);
const resetError = ref('');
const done = ref(false);

const canReset = computed(
  () => newPassword.value.length >= 8 && confirmPassword.value === newPassword.value,
);

async function handleResetPassword() {
  if (!canReset.value || !token) return;

  resetting.value = true;
  resetError.value = '';
  try {
    await authStore.resetPassword(token, newPassword.value);
    done.value = true;
    $q.notify({
      type: 'positive',
      message: 'Password reset successfully!',
      icon: 'check_circle',
      position: 'top',
      timeout: 4000,
    });
  } catch (err) {
    resetError.value =
      err instanceof Error ? err.message : 'This reset link is invalid or has expired.';
  } finally {
    resetting.value = false;
  }
}

function goToLogin() {
  router.push('/auth/login').catch((err) => {
    console.error('Navigation error:', err);
  });
}

function goToForgotPassword() {
  router.push('/auth/forgot-password').catch((err) => {
    console.error('Navigation error:', err);
  });
}
</script>

<style scoped>
.rounded-left {
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
}
.rounded-right {
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 8px;
}

@media (max-width: 1023px) {
  .rounded-left {
    border-bottom-left-radius: 0;
    border-top-right-radius: 20px;
  }
  .rounded-right {
    border-top-right-radius: 0;
    border-bottom-left-radius: 20px;
  }
}
</style>
