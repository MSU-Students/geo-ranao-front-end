<template>
  <q-page class="flex flex-center signup-wrapper">
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
      style="filter: blur(5px) brightness(0.5); z-index: 0"
    />

    <q-card class="signup-card q-pa-lg">
      <q-card-section class="text-center q-pb-none">
        <q-avatar
          size="70px"
          font-size="52px"
          color="primary"
          text-color="white"
          icon="water_drop"
        />
        <div class="text-h5 text-weight-bolder q-mt-md text-primary">RANAO AQUA PROJECT</div>
        <div class="text-subtitle2 text-grey-8">Apply for a researcher account</div>
        <div class="text-caption text-grey-6 q-mt-xs">
          Applications are reviewed by an administrator before access is granted.
        </div>
      </q-card-section>

      <q-card-section>
        <q-stepper
          v-model="step"
          flat
          animated
          header-nav
          alternative-labels
          color="primary"
          class="signup-stepper"
        >
          <!-- ═══ STEP 1 — BASIC IDENTITY ═══ -->
          <q-step
            name="identity"
            title="Basic Identity"
            icon="badge"
            :done="step !== 'identity'"
          >
            <q-input
              filled
              v-model="formData.fullName"
              label="Full Name *"
              lazy-rules
              class="q-mb-sm"
              :rules="[(val) => (val && val.trim().length > 1) || 'Full name is required']"
            >
              <template v-slot:prepend><q-icon name="person" /></template>
            </q-input>

            <q-input
              filled
              type="email"
              v-model="formData.email"
              label="Email Address *"
              lazy-rules
              class="q-mb-sm"
              :rules="[
                (val) => !!val || 'Email is required',
                (val) => isValidEmail(val) || 'Invalid email',
                (val) => getEmailDomainError(val) ?? true,
              ]"
            >
              <template v-slot:prepend><q-icon name="email" /></template>
            </q-input>

            <q-input
              filled
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              label="Password *"
              lazy-rules
              class="q-mb-sm"
              :rules="[(val) => (val && val.length >= 8) || 'Password must be at least 8 characters']"
            >
              <template v-slot:prepend><q-icon name="lock" /></template>
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility' : 'visibility_off'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <q-input
              filled
              v-model="formData.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              label="Confirm Password *"
              lazy-rules
              :rules="[
                (val) => !!val || 'Please confirm your password',
                (val) => val === formData.password || 'Passwords do not match',
              ]"
            >
              <template v-slot:prepend><q-icon name="lock" /></template>
              <template v-slot:append>
                <q-icon
                  :name="showConfirmPassword ? 'visibility' : 'visibility_off'"
                  class="cursor-pointer"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </q-input>

            <q-stepper-navigation class="text-right">
              <q-btn
                color="primary"
                label="Continue"
                unelevated
                rounded
                :disable="!canContinueIdentity"
                @click="step = 'institution'"
              />
            </q-stepper-navigation>
          </q-step>

          <!-- ═══ STEP 2 — INSTITUTIONAL CREDENTIALS ═══ -->
          <q-step
            name="institution"
            title="Institutional Credentials"
            icon="school"
            :done="step === 'context'"
          >
            <q-select
              filled
              v-model="formData.affiliation"
              :options="affiliationOptionsFiltered"
              use-input
              hide-selected
              fill-input
              new-value-mode="add-unique"
              input-debounce="0"
              @filter="filterAffiliation"
              label="Affiliation / Institution *"
              placeholder="e.g., Academic Researcher"
              behavior="menu"
              class="q-mb-sm"
              :rules="[(val) => !!val || 'Please select or enter your affiliation']"
            >
              <template v-slot:prepend><q-icon name="school" /></template>
            </q-select>

            <q-input
              filled
              v-model="formData.departmentRole"
              label="Department / Role (optional)"
              placeholder='e.g., "Research Assistant" or "Postdoctoral Researcher"'
            >
              <template v-slot:prepend><q-icon name="work" /></template>
            </q-input>

            <q-stepper-navigation class="row justify-end q-gutter-sm">
              <q-btn flat color="grey-8" label="Back" @click="step = 'identity'" />
              <q-btn
                color="primary"
                label="Continue"
                unelevated
                rounded
                :disable="!canContinueInstitution"
                @click="step = 'context'"
              />
            </q-stepper-navigation>
          </q-step>

          <!-- ═══ STEP 3 — APPLICATION CONTEXT ═══ -->
          <q-step name="context" title="Application Context" icon="description">
            <q-input
              filled
              type="textarea"
              autogrow
              v-model="formData.purposeOfRequest"
              label="Purpose of Request *"
              placeholder='e.g., "Studying Water Quality in the shallow depth part using geographic spatial data"'
              lazy-rules
              :rules="[
                (val) =>
                  (val && val.trim().length >= 10) ||
                  'Please describe the purpose of your research access request',
              ]"
            >
              <template v-slot:prepend><q-icon name="assignment" /></template>
            </q-input>

            <q-banner dense class="bg-blue-1 text-blue-9 q-mt-md rounded-borders">
              <template #avatar><q-icon name="info" color="blue-9" /></template>
              Your application will be submitted for admin review. You'll be notified once your
              account is verified.
            </q-banner>

            <q-stepper-navigation class="row justify-end q-gutter-sm">
              <q-btn flat color="grey-8" label="Back" @click="step = 'institution'" />
              <q-btn
                color="primary"
                label="Submit for Review"
                unelevated
                rounded
                :disable="!canSubmit"
                @click="handleSignup"
              />
            </q-stepper-navigation>
          </q-step>
        </q-stepper>

        <div class="relative-position q-my-lg">
          <q-separator />
          <div class="absolute-center bg-white q-px-sm text-grey-7 text-caption">OR</div>
        </div>

        <q-btn
          outline
          color="grey-8"
          class="full-width bg-white text-weight-medium"
          @click="loginWithGoogle"
          no-caps
          rounded
        >
          <q-img
            src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.svg"
            style="width: 18px; margin-right: 12px"
          />
          Continue with Google
        </q-btn>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <p class="text-grey-7">
          Already have an account?
          <q-btn
            @click.prevent="handleLogin"
            type="submit"
            label="Login"
            class="q-ma-sm"
            color="primary"
            unelevated
            style="border-radius: 10px; font-size: 12px"
          />
        </p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const step = ref<'identity' | 'institution' | 'context'>('identity');

const formData = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  affiliation: '',
  departmentRole: '',
  purposeOfRequest: '',
});

const isValidEmail = (email: string) => {
  // A standard, reliable email validation regex
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
};

// Well-known free email providers, mapped to their one true domain. Catches
// mistyped TLDs like "gmail.co" (missing the trailing "m") that otherwise
// pass generic email-format validation, since "gmail.co" is syntactically
// a valid domain — the mistake is only obvious because we know the provider.
const knownEmailProviders: Record<string, string> = {
  gmail: 'gmail.com',
  yahoo: 'yahoo.com',
  hotmail: 'hotmail.com',
  outlook: 'outlook.com',
  icloud: 'icloud.com',
  live: 'live.com',
  aol: 'aol.com',
  protonmail: 'protonmail.com',
};

function getEmailDomainError(email: string): string | null {
  const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase();
  const provider = domain.split('.')[0];
  const expectedDomain = provider ? knownEmailProviders[provider] : undefined;
  if (expectedDomain && domain !== expectedDomain) {
    return `Did you mean "${expectedDomain}"?`;
  }
  return null;
}

const canContinueIdentity = computed(
  () =>
    formData.fullName.trim().length > 1 &&
    isValidEmail(formData.email) &&
    !getEmailDomainError(formData.email) &&
    formData.password.length >= 8 &&
    formData.confirmPassword === formData.password,
);

const canContinueInstitution = computed(() => !!formData.affiliation.trim());

const canSubmit = computed(() => formData.purposeOfRequest.trim().length >= 10);

// ── Affiliation combobox: searchable dropdown of common categories, but also
// accepts a freely typed institution name (new-value-mode="add-unique"). ──
const affiliationCategories = [
  'Academic Researcher',
  'LGU Researcher',
  'Student Researcher',
  'Private Researcher',
];
const affiliationOptionsFiltered = ref<string[]>(affiliationCategories);

function filterAffiliation(val: string, update: (callback: () => void) => void) {
  if (val === '') {
    update(() => {
      affiliationOptionsFiltered.value = affiliationCategories;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    affiliationOptionsFiltered.value = affiliationCategories.filter((o) =>
      o.toLowerCase().includes(needle),
    );
  });
}

function handleSignup() {
  if (!canSubmit.value) return;

  authStore.signup(
    formData.fullName,
    formData.email,
    formData.password,
    formData.affiliation,
    formData.departmentRole,
    formData.purposeOfRequest,
  );

  $q.notify({
    message: 'Application submitted!',
    caption: 'Your researcher account is pending admin review.',
    color: 'info',
    icon: 'hourglass_top',
    position: 'top',
    timeout: 6000,
  });

  router.push('/auth/login').catch((err) => {
    console.error('Navigation error:', err);
  });
}

const loginWithGoogle = () => {
  // Logic to trigger Google Auth
  $q.notify({
    message: 'Connecting to Google Services...',
    color: 'info',
    icon: 'auth',
  });
};

function handleLogin() {
  router.push('/auth/login').catch((err) => {
    console.error('Navigation error:', err);
  });
}
</script>

<style scoped>
.signup-card {
  width: 100%;
  max-width: 480px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  background: white; /* Clean white card for contrast against dark blur */
}

.signup-wrapper {
  min-height: 100vh;
}

.signup-stepper {
  box-shadow: none;
}

.signup-stepper :deep(.q-stepper__step-inner) {
  padding: 16px 4px 0;
}

.signup-stepper :deep(.q-stepper__tab) {
  padding: 8px 4px;
}

.signup-stepper :deep(.q-stepper__title) {
  font-size: 0.68rem;
}

/* Custom rounded inputs */
:deep(.q-field--filled .q-field__control) {
  border-radius: 8px !important;
}
</style>
