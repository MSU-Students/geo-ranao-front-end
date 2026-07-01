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
        <div class="text-subtitle2 text-grey-8">Create your account</div>
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-sm" @submit="handleSignup">
          <q-input
            filled
            v-model="formData.username"
            label="Username"
            lazy-rules
            :rules="[(val) => (val && val.length > 3) || 'Username must be at least 4 characters']"
          >
            <template v-slot:prepend><q-icon name="person" /></template>
          </q-input>

          <q-input
            filled
            type="email"
            v-model="formData.email"
            label="Email Address"
            lazy-rules
            :rules="[
              (val) => !!val || 'Email is required',
              (val) => isValidEmail(val) || 'Invalid email',
            ]"
          >
            <template v-slot:prepend><q-icon name="email" /></template>
          </q-input>

          <q-input
            filled
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            lazy-rules
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

          <q-file
            filled
            v-model="formData.avatar"
            label="Profile Picture *"
            accept="image/*"
            class="q-mt-sm"
            :rules="[(val) => !!val || 'Profile picture is required']"
          >
            <template v-slot:prepend>
              <q-icon name="photo_camera" />
            </template>
          </q-file>

          <q-select
            filled
            v-model="formData.role"
            :options="['Researcher', 'Public User']"
            label="Register as..."
            emit-value
            map-options
            behavior="menu"
            :rules="[(val) => !!val || 'Please select a role']"
          >
            <template v-slot:prepend><q-icon name="badge" /></template>
          </q-select>

          <div class="q-mt-md">
            <q-btn
              label="Sign Up"
              type="submit"
              color="primary"
              class="full-width py-sm text-weight-bold"
              rounded
              unelevated
            />
          </div>
        </q-form>

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
import { ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const showPassword = ref(false);

const formData = reactive({
  username: '',
  email: '',
  password: '',
  avatar: null,
  role: 'Public User', // Default
});

const isValidEmail = (email: string) => {
  // A standard, reliable email validation regex
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
};

function handleSignup() {
  authStore.signup(formData.username, formData.email, formData.password, formData.role);
  $q.notify({
    message: 'Account created successfully!',
    color: 'positive',
    icon: 'check_circle',
    position: 'top',
  });
  router.push('/?explore=true');
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
  max-width: 420px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  background: white; /* Clean white card for contrast against dark blur */
}

.signup-wrapper {
  min-height: 100vh;
}

/* Custom rounded inputs */
:deep(.q-field--filled .q-field__control) {
  border-radius: 8px !important;
}
</style>
