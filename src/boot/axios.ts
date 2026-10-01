import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

const AUTH_TOKEN_KEY = 'geo-ranao-auth-token';

// Vite bakes VITE_API_URL into the build at compile time — it must be set
// via the deploy platform's environment variables (e.g. Vercel Project
// Settings), not left to whatever this local .env happens to have, or a
// build made for local testing could get deployed with a dead API URL
// baked in. Falls back to the documented local-dev API port rather than
// `undefined` (which would silently send requests to relative paths on
// whatever origin is serving the frontend — confusing 404s with no clear
// cause, instead of an obviously-wrong-but-at-least-intentional default).
const DEV_API_URL = 'http://localhost:3333';
const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const resolvedApiUrl = configuredApiUrl || DEV_API_URL;

if (import.meta.env.PROD && /localhost|127\.0\.0\.1/.test(resolvedApiUrl)) {
  console.error(
    `VITE_API_URL is "${resolvedApiUrl}" in a production build — every API request from a real ` +
      "visitor's browser will try to reach their own localhost and fail. Set VITE_API_URL in the " +
      'deployment platform\'s environment variables and rebuild.',
  );
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({ baseURL: resolvedApiUrl });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api, AUTH_TOKEN_KEY };
