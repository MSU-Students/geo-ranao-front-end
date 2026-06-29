<template>
  <q-layout view="hHh Lpr lFf">
    <!-- Transparent floating header -->
    <q-header class="header-glass" :class="{ 'header-hidden': hideHeader }">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" color="white" @click="toggleLeftDrawer" />

        <q-toolbar-title class="text-weight-bold header-title">
          <q-icon name="water_drop" color="teal-3" class="q-mr-xs" size="sm" />
          Ranao FishNet
        </q-toolbar-title>

        <q-space />

        <q-btn
          outline
          rounded
          color="white"
          label="Researcher Login"
          icon="person"
          size="sm"
          class="q-px-md login-btn"
          @click="handleLogin"
        />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered class="drawer-dark">
      <q-list dark>
        <q-item-label header class="text-grey-4 text-weight-bold q-pb-md">
          <q-icon name="water_drop" color="teal-4" class="q-mr-sm" />
          Navigation
        </q-item-label>

        <q-item
          v-for="link in linksList"
          :key="link.title"
          clickable
          class="nav-item"
          @click="navigateTo(link)"
        >
          <q-item-section avatar>
            <q-icon :name="link.icon" color="teal-4" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-white">{{ link.title }}</q-item-label>
            <q-item-label caption class="text-grey-5">{{ link.caption }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container style="padding-top: 0 !important;">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

interface NavLink {
  title: string;
  caption: string;
  icon: string;
  link: string;
  query?: Record<string, string>;
}

const linksList: NavLink[] = [
  { title: 'Home', caption: 'Landing Page', icon: 'home', link: '/' },
  { title: 'Interactive Map', caption: 'Go to GIS Map', icon: 'map', link: '/', query: { explore: 'true' } },
  { title: 'Fish Dashboard', caption: 'Species Profiles', icon: 'set_meal', link: '/dashboard/fish' },
];

const leftDrawerOpen = ref(false);
const hideHeader = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function navigateTo(link: NavLink) {
  leftDrawerOpen.value = false;
  router.push({ path: link.link, query: link.query })
    .catch(err => {
      console.error('Navigation error:', err);
    });
}

function handleLogin() {
  router.push('/auth/login')
    .catch(err => {
      console.error('Navigation error:', err);
    });
}
</script>

<style scoped>
.header-glass {
  background: rgba(8, 18, 32, 0.6) !important;
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.3s ease;
  z-index: 2000;
}

.header-hidden {
  transform: translateY(-100%);
}

.header-title {
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  font-size: 1.1rem;
  letter-spacing: 0.5px;
}

.login-btn {
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.3) !important;
  transition: all 0.2s ease;
}
.login-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.6) !important;
}

.drawer-dark {
  background: #0a1929 !important;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-item {
  border-radius: 8px;
  margin: 2px 8px;
  transition: background 0.2s ease;
}
.nav-item:hover {
  background: rgba(38, 166, 154, 0.1);
}
</style>
