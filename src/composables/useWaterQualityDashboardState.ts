import { ref } from 'vue';
import { allWaterQualityParams } from 'src/composables/useWaterQualityModel';

// Module-level, not component-level — a ref declared inside the dashboard
// page's <script setup> gets re-created (and reset to its initial value)
// every time the page mounts, since Vue Router destroys the previous page
// component when you navigate away (no <keep-alive> wraps the router-view).
// This module's top-level code runs once, on first import; every later
// import — including a freshly-mounted page instance after you navigate
// back — reuses this same ref, so the selection survives the trip.
export const selectedParamKey = ref(allWaterQualityParams[0]!.key);
