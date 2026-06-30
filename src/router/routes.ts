import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/landing', component: () => import('pages/landing/LandingPage.vue') },
      { path: '/map', component: () => import('pages/map/GeoMapPage.vue') },
      {
        path: '/dashboard/fish',
        component: () => import('pages/dashboard/FishDashboardPage.vue'),
      },
      {
        path: '/researcher',
        component: () => import('pages/researcher/ResearcherPortalPage.vue'),
      },
      {
        path: '/researcher/upload',
        component: () => import('pages/researcher/UploadDataPage.vue'),
      },
      {
        path: '/researcher/upload/fish',
        component: () => import('pages/researcher/FishObservationPage.vue'),
      },
      {
        path: '/researcher/upload/water-quality',
        component: () => import('pages/researcher/WaterQualityPage.vue'),
      },
    ],
  },
  {
    path: '/auth',
    component: () => import('layouts/PlainLayout.vue'),
    children: [
      { path: 'login', component: () => import('pages/auth/LoginPage.vue') },
      { path: 'signup', component: () => import('pages/auth/SignupPage.vue') },
      { path: 'profile', component: () => import('pages/auth/ProfilePage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
