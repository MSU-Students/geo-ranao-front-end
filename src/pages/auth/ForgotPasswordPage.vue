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
            Reset your password and get back into Geo Ranao
          </p>
        </div>
      </div>

      <div class="col-md-6 col-12 bg-white flex flex-center rounded-right">
        <div class="q-pa-xl full-width" style="max-width: 420px">
          <template v-if="!sent">
            <div class="text-h5 text-weight-bold text-center text-grey-9 q-mb-xs">
              Forgot Password?
            </div>
            <div class="text-subtitle2 text-center text-grey-6 q-mb-lg">
              Enter your account email and we'll send you a reset link.
            </div>

            <q-banner v-if="requestError" class="bg-red-1 text-red q-mb-md" rounded>
              <template #avatar><q-icon name="error" color="red" /></template>
              {{ requestError }}
            </q-banner>

            <q-input
              outlined
              v-model="email"
              label="Email"
              type="email"
              color="primary"
              lazy-rules
              :rules="[(val) => !!val || 'Please enter your email']"
              class="q-mb-lg"
              @keyup.enter="handleSendLink"
            >
              <template v-slot:prepend>
                <q-icon name="alternate_email" class="text-grey-7" />
              </template>
            </q-input>

            <q-btn
              unelevated
              size="lg"
              color="primary"
              class="full-width text-weight-bold"
              label="Send Reset Link"
              :loading="sending"
              style="border-radius: 8px"
              @click="handleSendLink"
            />
          </template>

          <template v-else>
            <div class="text-center">
              <q-icon name="mark_email_read" size="64px" color="primary" class="q-mb-md" />
              <div class="text-h5 text-weight-bold text-grey-9 q-mb-sm">Check your email</div>
              <p class="text-grey-7 q-mb-lg">
                If <b>{{ email }}</b> is registered, we've sent a link to reset your password.
                It expires in 30 minutes.
              </p>
              <a
                href="#"
                class="text-primary text-weight-medium"
                style="text-decoration: none; font-size: 13px"
                @click.prevent="handleSendLink"
              >
                Didn't get it? Resend
              </a>
            </div>
          </template>

          <div class="text-center q-mt-md">
            <span class="text-grey-6">Remembered your password?</span>
            <q-btn
              @click="goToLogin"
              label="Back to Sign In"
              class="q-ma-sm"
              color="primary"
              unelevated
              style="border-radius: 10px; font-size: 12px"
            />
          </div>
        </div>
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import BackButton from 'src/components/BackButton.vue';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const sending = ref(false);
const sent = ref(false);
const requestError = ref('');

async function handleSendLink() {
  requestError.value = '';
  if (!email.value) {
    requestError.value = 'Please enter your email.';
    return;
  }

  sending.value = true;
  try {
    await authStore.forgotPassword(email.value);
    sent.value = true;
    $q.notify({
      type: 'info',
      message: 'If that email is registered, a reset link is on its way.',
      icon: 'mail',
      position: 'top',
      timeout: 5000,
    });
  } catch (err) {
    requestError.value = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
  } finally {
    sending.value = false;
  }
}

function goToLogin() {
  router.push('/auth/login').catch((err) => {
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
