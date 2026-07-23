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
      style="width: 900px; max-width: 95vw; min-height: 550px; border-radius: 20px"
    >
      <div class="col-md-6 col-12 bg-primary text-white flex flex-center rounded-left">
        <div class="text-center q-pa-xl">
          <q-icon name="lock_reset" size="80px" class="q-mb-md opacity-80" />
          <h2 class="text-h3 text-weight-bolder q-mb-sm q-mt-none tracking-tight">
            ACCOUNT RECOVERY
          </h2>
          <p class="text-h6 text-weight-light opacity-80">
            Reset your password and get back into Ranao FishNet
          </p>
        </div>
      </div>

      <div class="col-md-6 col-12 bg-white flex flex-center rounded-right">
        <div class="q-pa-xl full-width" style="max-width: 420px">
          <div class="text-h5 text-weight-bold text-center text-grey-9 q-mb-xs">
            Forgot Password?
          </div>
          <div class="text-subtitle2 text-center text-grey-6 q-mb-lg">
            {{ stepSubtitle }}
          </div>

          <q-stepper
            v-model="step"
            flat
            animated
            header-nav
            alternative-labels
            color="primary"
            class="recovery-stepper"
          >
            <!-- ═══ STEP 1 — IDENTIFY ACCOUNT ═══ -->
            <q-step name="identify" title="Identify" icon="person_search" :done="step !== 'identify'">
              <q-banner v-if="identifyError" class="bg-red-1 text-red q-mb-md" rounded>
                <template #avatar><q-icon name="error" color="red" /></template>
                {{ identifyError }}
              </q-banner>

              <q-input
                outlined
                v-model="form.emailOrUsername"
                label="Email or Username"
                color="primary"
                lazy-rules
                :rules="[(val) => !!val || 'Please enter your email or username']"
                class="q-mb-sm"
              >
                <template v-slot:prepend>
                  <q-icon name="alternate_email" class="text-grey-7" />
                </template>
              </q-input>

              <p class="text-grey-6 text-caption q-mb-lg">
                We'll send a 6-digit recovery code to the email on file for this account.
              </p>

              <q-stepper-navigation class="text-right">
                <q-btn
                  unelevated
                  size="lg"
                  color="primary"
                  class="full-width text-weight-bold"
                  label="Send Recovery Code"
                  :loading="sendingCode"
                  style="border-radius: 8px"
                  @click="handleSendCode"
                />
              </q-stepper-navigation>
            </q-step>

            <!-- ═══ STEP 2 — VERIFY CODE ═══ -->
            <q-step name="verify" title="Verify" icon="mark_email_read" :done="step === 'reset'">
              <q-banner class="bg-blue-1 text-blue-9 q-mb-md" rounded dense>
                <template #avatar><q-icon name="info" color="blue-9" /></template>
                Demo mode — no real email is sent. Your recovery code is
                <b>{{ generatedCode }}</b>.
              </q-banner>

              <q-banner v-if="codeError" class="bg-red-1 text-red q-mb-md" rounded>
                <template #avatar><q-icon name="error" color="red" /></template>
                {{ codeError }}
              </q-banner>

              <q-input
                outlined
                v-model="form.code"
                label="6-Digit Recovery Code"
                color="primary"
                maxlength="6"
                class="q-mb-sm"
              >
                <template v-slot:prepend>
                  <q-icon name="pin" class="text-grey-7" />
                </template>
              </q-input>

              <div class="text-right q-mb-lg">
                <a
                  href="#"
                  class="text-primary text-weight-medium"
                  style="text-decoration: none; font-size: 13px"
                  @click.prevent="handleSendCode"
                >
                  Resend code
                </a>
              </div>

              <q-stepper-navigation class="row justify-end q-gutter-sm">
                <q-btn flat color="grey-8" label="Back" @click="step = 'identify'" />
                <q-btn
                  unelevated
                  color="primary"
                  label="Verify Code"
                  style="border-radius: 8px"
                  @click="handleVerifyCode"
                />
              </q-stepper-navigation>
            </q-step>

            <!-- ═══ STEP 3 — RESET PASSWORD ═══ -->
            <q-step name="reset" title="Reset" icon="lock_reset">
              <q-input
                outlined
                v-model="form.newPassword"
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
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                label="Confirm New Password"
                color="primary"
                lazy-rules
                class="q-mb-lg"
                :rules="[
                  (val) => !!val || 'Please confirm your new password',
                  (val) => val === form.newPassword || 'Passwords do not match',
                ]"
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

              <q-stepper-navigation class="row justify-end q-gutter-sm">
                <q-btn flat color="grey-8" label="Back" @click="step = 'verify'" />
                <q-btn
                  unelevated
                  color="primary"
                  label="Reset Password"
                  :loading="resetting"
                  :disable="!canResetPassword"
                  style="border-radius: 8px"
                  @click="handleResetPassword"
                />
              </q-stepper-navigation>
            </q-step>
          </q-stepper>

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
import { ref, reactive, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import BackButton from 'src/components/BackButton.vue';

const $q = useQuasar();
const router = useRouter();

const step = ref<'identify' | 'verify' | 'reset'>('identify');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const sendingCode = ref(false);
const resetting = ref(false);
const identifyError = ref('');
const codeError = ref('');
const generatedCode = ref('');

const form = reactive({
  emailOrUsername: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
});

const stepSubtitle = computed(() => {
  switch (step.value) {
    case 'identify':
      return 'Enter your account details to begin recovery.';
    case 'verify':
      return 'Enter the code we sent to continue.';
    case 'reset':
      return 'Choose a new password for your account.';
    default:
      return '';
  }
});

const canResetPassword = computed(
  () => form.newPassword.length >= 8 && form.confirmPassword === form.newPassword,
);

// No real backend — this generates a fake code client-side so the recovery
// flow can be tried end-to-end without a real email inbox.
function handleSendCode() {
  identifyError.value = '';

  if (!form.emailOrUsername) {
    identifyError.value = 'Please enter your email or username.';
    return;
  }

  sendingCode.value = true;
  setTimeout(() => {
    generatedCode.value = Math.floor(100000 + Math.random() * 900000).toString();
    sendingCode.value = false;
    step.value = 'verify';
    $q.notify({
      type: 'info',
      message: 'Recovery code sent!',
      caption: `Demo mode — your code is ${generatedCode.value}`,
      icon: 'mail',
      position: 'top',
      timeout: 8000,
    });
  }, 800);
}

function handleVerifyCode() {
  if (!form.code) {
    codeError.value = 'Please enter the recovery code.';
    return;
  }
  if (form.code !== generatedCode.value) {
    codeError.value = 'Incorrect code. Please check and try again.';
    return;
  }
  codeError.value = '';
  step.value = 'reset';
}

function handleResetPassword() {
  if (!canResetPassword.value) return;

  resetting.value = true;
  setTimeout(() => {
    resetting.value = false;
    $q.notify({
      type: 'positive',
      message: 'Password reset successfully!',
      caption: 'You can now sign in with your new password.',
      icon: 'check_circle',
      position: 'top',
      timeout: 4000,
    });
    goToLogin();
  }, 800);
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

.recovery-stepper {
  box-shadow: none;
}

.recovery-stepper :deep(.q-stepper__step-inner) {
  padding: 16px 4px 0;
}

.recovery-stepper :deep(.q-stepper__tab) {
  padding: 8px 4px;
}

.recovery-stepper :deep(.q-stepper__title) {
  font-size: 0.68rem;
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
