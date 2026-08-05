<template>
  <q-layout view="hHh Lpr lFf">
    <!-- Floating frosted-glass header -->
    <q-header class="header-glass" :class="{ 'header-hidden': hideHeader }">
      <q-toolbar class="header-toolbar">
        <!-- Logo (left) -->
        <div class="header-brand" @click="navigateTo(linksList[0]!)">
          <q-icon name="water_drop" color="teal-3" size="sm" class="q-mr-xs" />
          <span class="brand-text">Ranao FishNet</span>
        </div>

        <!-- Centered horizontal navigation (desktop) -->
        <div class="nav-center">
          <div class="nav-pill-track">
            <button
              v-for="link in visibleLinks"
              :key="link.title"
              class="nav-icon-btn"
              :class="{ 'nav-icon-btn--active': isActive(link) }"
              @click="navigateTo(link)"
              @mousedown="onPressStart"
              @mouseup="onPressEnd"
              @mouseleave="onPressEnd"
            >
              <q-icon :name="link.icon" size="20px" />
              <q-tooltip
                anchor="bottom middle"
                self="top middle"
                :offset="[0, 10]"
                class="nav-tooltip"
                transition-show="jump-down"
                transition-hide="jump-up"
              >
                {{ link.title }}
              </q-tooltip>
            </button>
          </div>
        </div>

        <!-- Right side: Auth buttons -->
        <div class="header-right">
          <!-- Mobile hamburger -->
          <q-btn
            flat
            dense
            round
            icon="menu"
            color="white"
            class="mobile-menu-btn"
            @click="toggleLeftDrawer"
          />

          <!-- When NOT logged in: show Researcher Login -->
          <q-btn
            v-if="!authStore.isLoggedIn"
            outline
            rounded
            color="white"
            label="Researcher Login"
            icon="person"
            size="sm"
            class="q-px-md login-btn"
            @click="handleLogin"
          />

          <!-- When LOGGED IN: show Profile + Logout -->
          <template v-else>
            <q-btn
              unelevated
              rounded
              color="teal"
              :label="authStore.displayName"
              icon="account_circle"
              size="sm"
              class="q-px-md profile-btn"
              @click="goToProfile"
            />
            <q-btn
              flat
              round
              icon="logout"
              color="white"
              size="sm"
              class="q-ml-sm"
              @click="handleLogout"
            >
              <q-tooltip>Logout</q-tooltip>
            </q-btn>
          </template>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Mobile drawer (collapsed nav for small screens) -->
    <q-drawer v-model="leftDrawerOpen" bordered class="drawer-modern" :width="280">
      <q-list class="q-pt-lg">
        <q-item-label header class="drawer-header">
          <q-icon name="water_drop" color="teal" class="q-mr-sm" size="sm" />
          Navigation
        </q-item-label>

        <q-item
          v-for="link in visibleLinks"
          :key="link.title"
          clickable
          class="nav-item"
          :class="{ 'nav-item--active': isActive(link) }"
          @click="navigateTo(link)"
        >
          <q-item-section avatar>
            <q-icon :name="link.icon" :color="isActive(link) ? 'teal' : 'grey-7'" />
          </q-item-section>
          <q-item-section>
            <q-item-label :class="isActive(link) ? 'text-teal text-weight-bold' : 'text-grey-9'">
              {{ link.title }}
            </q-item-label>
            <q-item-label caption class="text-grey-5">{{ link.caption }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container style="padding-top: 0 !important">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

interface NavLink {
  title: string;
  caption: string;
  icon: string;
  link: string;
  query?: Record<string, string>;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  hideForAdmin?: boolean;
}

const linksList: NavLink[] = [
  {
    title: 'About',
    caption: 'About the Project',
    icon: 'info',
    link: '/',
  },
  {
    title: 'Interactive Map',
    caption: 'Go to GIS Map',
    icon: 'map',
    link: '/map',
  },
  {
    title: 'Fish Dashboard',
    caption: 'Species Profiles',
    icon: 'set_meal',
    link: '/dashboard/fish',
  },
  {
    title: 'Water Quality Dashboard',
    caption: 'Environmental Overview',
    icon: 'water_drop',
    link: '/dashboard/water-quality',
  },
  {
    title: 'My Contributions',
    caption: 'Your Records',
    icon: 'assignment_ind',
    link: '/auth/profile',
    query: { tab: 'contributions' },
    requiresAuth: true,
    hideForAdmin: true,
  },
  {
    title: 'Reports & Exports',
    caption: 'Generate Reports',
    icon: 'assessment',
    link: '/researcher',
    requiresAuth: true,
  },
  {
    title: 'Admin Dashboard',
    caption: 'Accounts, Logs & Reviews',
    icon: 'admin_panel_settings',
    link: '/admin',
    requiresAuth: true,
    requiresAdmin: true,
  },
];

const visibleLinks = computed(() =>
  linksList.filter((link) => {
    if (link.hideForAdmin && authStore.user?.role === 'Admin') return false;
    if (link.requiresAdmin) return authStore.user?.role === 'Admin';
    return !link.requiresAuth || authStore.isLoggedIn;
  }),
);

const leftDrawerOpen = ref(false);
const hideHeader = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function isActive(link: NavLink): boolean {
  if (link.query) {
    return route.path === link.link && route.query.tab === link.query.tab;
  }
  return route.path === link.link;
}

function navigateTo(link: NavLink) {
  leftDrawerOpen.value = false;
  const target = link.query ? { path: link.link, query: link.query } : { path: link.link };
  router.push(target).catch((err) => {
    console.error('Navigation error:', err);
  });
}

function handleLogin() {
  router.push('/auth/login').catch((err) => {
    console.error('Navigation error:', err);
  });
}

function goToProfile() {
  router.push('/auth/profile').catch((err) => {
    console.error('Navigation error:', err);
  });
}

function handleLogout() {
  authStore.logout();
  router.push('/map').catch((err) => {
    console.error('Navigation error:', err);
  });
}

/* Press animation helpers */
function onPressStart(e: MouseEvent) {
  (e.currentTarget as HTMLElement).classList.add('nav-icon-btn--pressed');
}
function onPressEnd(e: MouseEvent) {
  (e.currentTarget as HTMLElement).classList.remove('nav-icon-btn--pressed');
}
</script>

<style scoped>
/* ═══════════════════════════════════ */
/* HEADER                             */
/* ═══════════════════════════════════ */
.header-glass {
  background: rgba(10, 16, 28, 0.62) !important;
  backdrop-filter: blur(24px) saturate(1.6);
  -webkit-backdrop-filter: blur(24px) saturate(1.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2000;
}

.header-hidden {
  transform: translateY(-100%);
}

.header-toolbar {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 16px;
  gap: 8px;
}

/* ═══════════════════════════════════ */
/* BRAND (left)                       */
/* ═══════════════════════════════════ */
.header-brand {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 10px;
  transition: background 0.2s ease-out;
  flex-shrink: 0;
}
.header-brand:hover {
  background: rgba(255, 255, 255, 0.06);
}

.brand-text {
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
}

/* ═══════════════════════════════════ */
/* CENTER NAVIGATION                  */
/* ═══════════════════════════════════ */
.nav-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.nav-pill-track {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 4px;
}

/* Individual nav icon button */
.nav-icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition:
    transform 0.2s ease-out,
    background 0.2s ease-out,
    color 0.2s ease-out,
    box-shadow 0.2s ease-out;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.nav-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);
  transform: translateY(-2px) scale(1.08);
}

.nav-icon-btn--active {
  background: rgba(13, 148, 136, 0.25);
  color: #5eead4;
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.2);
}

.nav-icon-btn--active:hover {
  background: rgba(13, 148, 136, 0.32);
  color: #99f6e4;
}

.nav-icon-btn--pressed {
  transform: scale(0.92) !important;
  transition: transform 0.1s ease-out !important;
}

/* ═══════════════════════════════════ */
/* TOOLTIP                            */
/* ═══════════════════════════════════ */
.nav-tooltip {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

/* ═══════════════════════════════════ */
/* RIGHT SIDE                         */
/* ═══════════════════════════════════ */
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.mobile-menu-btn {
  display: none;
}

.login-btn {
  border-color: rgba(255, 255, 255, 0.2) !important;
  font-weight: 600;
  font-size: 0.76rem;
  letter-spacing: 0.02em;
  transition: all 0.2s ease-out;
}
.login-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
  transform: scale(1.02);
}

.profile-btn {
  font-weight: 600;
  font-size: 0.76rem;
  transition: all 0.2s ease-out;
}
.profile-btn:hover {
  filter: brightness(1.12);
  transform: scale(1.02);
}

/* ═══════════════════════════════════ */
/* MOBILE DRAWER                      */
/* ═══════════════════════════════════ */
.drawer-modern {
  background: rgba(255, 255, 255, 0.96) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.06) !important;
}

.drawer-header {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 16px 20px 12px;
}

.nav-item {
  border-radius: 12px;
  margin: 2px 10px;
  padding: 10px 14px;
  transition:
    background 0.2s ease-out,
    transform 0.2s ease-out;
}
.nav-item:hover {
  background: rgba(13, 148, 136, 0.06);
  transform: translateX(2px);
}
.nav-item--active {
  background: rgba(13, 148, 136, 0.1);
}

/* ═══════════════════════════════════ */
/* RESPONSIVE                         */
/* ═══════════════════════════════════ */
@media (max-width: 860px) {
  .nav-center {
    display: none;
  }
  .mobile-menu-btn {
    display: flex;
  }
}

@media (min-width: 861px) {
  .mobile-menu-btn {
    display: none;
  }
}
</style>
