<template>
  <q-page class="q-pa-xl window-width row justify-center items-center bg-blue-grey-1">
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
      style="filter: blur(5px) brightness(0.5); z-index: 0"
    />

    <q-card
      class="shadow-24 row"
      style="width: 900px; max-width: 95vw; min-height: 550px; border-radius: 20px"
    >
      <div class="col-md-6 col-12 bg-primary text-white flex flex-center rounded-left">
        <div class="text-center q-pa-xl">
          <q-icon name="water_drop" size="80px" class="q-mb-md opacity-80" />
          <h2 class="text-h3 text-weight-bolder q-mb-sm q-mt-none tracking-tight">
            RANAO AQUA PROJECT
          </h2>
          <p class="text-h6 text-weight-light opacity-80">
            Water Quality Mapping & Fish Observation System for Lake Lanao
          </p>
        </div>
      </div>

      <div class="col-md-6 col-12 bg-white flex flex-center rounded-right">
        <div class="q-pa-xl full-width" style="max-width: 420px">
          <div class="text-center q-mb-lg">
            <q-img src="~assets/cics-logo.webp" style="width: 100px; height: 100px" fit="contain" />
            <q-img src="~assets/CFAS-Logo.png" style="width: 100px; height: 90px" fit="contain" />
          </div>

          <div class="text-h5 text-weight-bold text-center text-grey-9 q-mb-xs">Welcome</div>
          <div class="text-subtitle1 text-center text-grey-6 q-mb-xl">
            Please enter your details to sign in.
          </div>

          <!-- Error message -->
          <q-banner v-if="errorMsg" class="bg-red-1 text-red q-mb-md" rounded>
            <template #avatar>
              <q-icon name="error" color="red" />
            </template>
            {{ errorMsg }}
          </q-banner>

          <q-form @submit="handleLogin" class="q-gutter-y-md">
            <q-input
              outlined
              v-model="username"
              label="Username"
              color="primary"
              lazy-rules
              :rules="[(val) => !!val || 'Username is required']"
            >
              <template v-slot:prepend>
                <q-icon name="person" class="text-grey-7" />
              </template>
            </q-input>

            <q-input
              outlined
              v-model="password"
              label="Password"
              type="password"
              color="primary"
              lazy-rules
              :rules="[(val) => !!val || 'Password is required']"
            >
              <template v-slot:prepend>
                <q-icon name="lock" class="text-grey-7" />
              </template>
            </q-input>

            <div class="row justify-between items-center q-pb-sm">
              <q-checkbox v-model="remember" label="Remember me" color="primary" dense />
              <a
                href="#"
                class="text-primary text-weight-medium"
                style="text-decoration: none; font-size: 14px"
              >
                Forgot password?
              </a>
            </div>

            <q-btn
              unelevated
              size="lg"
              color="primary"
              class="full-width text-weight-bold"
              label="Sign In"
              type="submit"
              :loading="loading"
              style="border-radius: 8px"
            />
          </q-form>

          <q-btn
            outline
            color="grey-8"
            class="full-width bg-white text-weight-medium q-mt-md"
            @click="loginWithGoogle"
            no-caps
            rounded
          >
            <q-img
              src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg"
              style="width: 18px; margin-right: 12px"
            />
            Continue with Google
          </q-btn>

          <div class="text-center q-mt-lg">
            <span class="text-grey-6">Don't have an account?</span>
            <q-btn
              @click.prevent="handlesignup"
              label="Create Account"
              class="q-ma-sm"
              color="primary"
              unelevated
              style="border-radius: 10px; font-size: 12px"
            />
          </div>

          <!-- Temp note -->
          <div class="text-center q-mt-md">
            <span class="text-grey-4 text-caption"
              >Use any username and password to continue — sign in as "admin" for admin access</span
            >
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
import { useAdminStore } from 'src/stores/admin';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const adminStore = useAdminStore();

const username = ref('');
const password = ref('');
const remember = ref(false);
const loading = ref(false);
const errorMsg = ref('');

function handleLogin() {
  errorMsg.value = '';

  // Temporary bypass — accepts any username and password
  if (!username.value || !password.value) {
    errorMsg.value = 'Please enter your username and password.';
    return;
  }

  loading.value = true;

  // Simulate a short loading delay then log in and go to home
  setTimeout(() => {
    authStore.login(username.value, password.value);
    adminStore.logActivity(authStore.displayName, 'Logged In', 'Signed in to Ranao FishNet');
    loading.value = false;
    router.push(authStore.user?.role === 'Admin' ? '/admin' : '/');
  }, 800);
}

const loginWithGoogle = () => {
  // Logic to trigger Google Auth
  $q.notify({
    message: 'Connecting to Google Services...',
    color: 'info',
    icon: 'auth',
  });
};

function handlesignup() {
  router.push('/auth/signup').catch((err) => {
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
