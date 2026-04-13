<template>
  <q-page class="q-pa-md bg-grey-1 column">
    <div
      class="row justify-between items-center q-mb-lg animate-fade-up"
      style="animation-delay: 0.1s"
    >
      <div>
        <h1 class="text-h4 text-weight-bolder q-my-none text-primary">
          Lake Lanao Quality Dashboard
        </h1>
        <p class="text-subtitle1 text-grey-7 q-mt-sm">
          Real-time profile and key performance indicators
        </p>
      </div>
      <q-chip
        icon="location_on"
        color="blue-grey-2"
        text-color="black"
        label="Surface Level - Station 1"
      />
    </div>

    <div class="text-h6 text-grey-8 q-mb-md animate-fade-up" style="animation-delay: 0.2s">
      Physico-Chemical Attributes
    </div>
    <div class="row q-col-gutter-lg q-mb-xl">
      <div class="col-12 col-sm-6 col-md-3 animate-fade-up" style="animation-delay: 0.3s">
        <q-card class="kpi-card hover-lift shadow-2 rounded-borders flex column justify-between">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-avatar
                icon="opacity"
                color="blue-1"
                text-color="blue"
                size="50px"
                class="q-mr-md"
              />
              <div class="text-subtitle2 text-grey-8">Dissolved Oxygen (DO)</div>
            </div>
            <div class="row items-baseline">
              <span class="text-h3 text-weight-bolder q-mr-xs">{{ metrics.do.toFixed(2) }}</span>
              <span class="text-subtitle1 text-grey-7">mg/L</span>
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section class="q-py-sm">
            <q-chip
              :color="getStatusColor(metrics.do, 7.5, 6.0)"
              text-color="white"
              label="Status: Excellent"
              dense
            />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3 animate-fade-up" style="animation-delay: 0.4s">
        <q-card class="kpi-card hover-lift shadow-2 rounded-borders flex column justify-between">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-avatar
                icon="science"
                color="green-1"
                text-color="green"
                size="50px"
                class="q-mr-md"
              />
              <div class="text-subtitle2 text-grey-8">pH Level</div>
            </div>
            <div class="row items-baseline">
              <span class="text-h3 text-weight-bolder q-mr-xs">{{ metrics.pH.toFixed(2) }}</span>
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section class="q-py-sm">
            <q-chip
              :color="getStatusColor(metrics.pH, 7.8, 7.0)"
              text-color="white"
              label="Status: Good"
              dense
            />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3 animate-fade-up" style="animation-delay: 0.5s">
        <q-card class="kpi-card hover-lift shadow-2 rounded-borders flex column justify-between">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-avatar
                icon="thermostat"
                color="orange-1"
                text-color="orange"
                size="50px"
                class="q-mr-md"
              />
              <div class="text-subtitle2 text-grey-8">Temperature</div>
            </div>
            <div class="row items-baseline">
              <span class="text-h3 text-weight-bolder q-mr-xs">{{
                metrics.temperature.toFixed(1)
              }}</span>
              <span class="text-subtitle1 text-grey-7">°C</span>
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section class="q-py-sm">
            <q-chip
              :color="getStatusColor(metrics.temperature, 26, 30)"
              text-color="white"
              label="Status: Normal"
              dense
            />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3 animate-fade-up" style="animation-delay: 0.6s">
        <q-card class="kpi-card hover-lift shadow-2 rounded-borders flex column justify-between">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-avatar
                icon="visibility"
                color="grey-3"
                text-color="grey"
                size="50px"
                class="q-mr-md"
              />
              <div class="text-subtitle2 text-grey-8">Turbidity</div>
            </div>
            <div class="row items-baseline">
              <span class="text-h3 text-weight-bolder q-mr-xs">{{
                metrics.turbidity.toFixed(1)
              }}</span>
              <span class="text-subtitle1 text-grey-7">NTU</span>
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section class="q-py-sm">
            <q-chip
              :color="getStatusColor(metrics.turbidity, 1, 5, true)"
              text-color="white"
              label="Status: Clear"
              dense
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="text-h6 text-grey-8 q-mb-md animate-fade-up" style="animation-delay: 0.7s">
      Nutrient Profile
    </div>
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-sm-4 animate-fade-up" style="animation-delay: 0.8s">
        <q-card class="nutrient-card hover-lift shadow-2 rounded-borders">
          <q-card-section>
            <div class="text-subtitle2 text-grey-7 q-mb-sm">Sulfate</div>
            <div class="row items-baseline justify-between">
              <span class="text-h5 text-weight-bold">{{ metrics.sulfate.toFixed(2) }} mg/L</span>
              <q-circular-progress
                show-value
                :value="metrics.sulfate"
                size="45px"
                :thickness="0.2"
                color="purple"
                track-color="grey-2"
              >
                <q-icon name="trending_up" size="xs" />
              </q-circular-progress>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-4 animate-fade-up" style="animation-delay: 0.9s">
        <q-card class="nutrient-card hover-lift shadow-2 rounded-borders">
          <q-card-section>
            <div class="text-subtitle2 text-grey-7 q-mb-sm">Ammonia</div>
            <div class="row items-baseline justify-between">
              <span class="text-h5 text-weight-bold">{{ metrics.ammonia.toFixed(3) }} mg/L</span>
              <q-circular-progress
                show-value
                :value="metrics.ammonia * 100"
                size="45px"
                :thickness="0.2"
                color="teal"
                track-color="grey-2"
              >
                <q-icon name="trending_flat" size="xs" />
              </q-circular-progress>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-4 animate-fade-up" style="animation-delay: 1s">
        <q-card class="nutrient-card hover-lift shadow-2 rounded-borders">
          <q-card-section>
            <div class="text-subtitle2 text-grey-7 q-mb-sm">Phosphate</div>
            <div class="row items-baseline justify-between">
              <span class="text-h5 text-weight-bold">{{ metrics.phosphate.toFixed(3) }} mg/L</span>
              <q-circular-progress
                show-value
                :value="metrics.phosphate * 100"
                size="45px"
                :thickness="0.2"
                color="amber-10"
                track-color="grey-2"
              >
                <q-icon name="trending_down" size="xs" />
              </q-circular-progress>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const metrics = reactive({
  do: 8.5,
  pH: 7.9,
  temperature: 28.1,
  turbidity: 2.1,
  sulfate: 18.2,
  ammonia: 0.03,
  phosphate: 0.01,
});

function getStatusColor(val: number, goodLimit: number, warnLimit: number, lowerIsBetter = false) {
  if (!lowerIsBetter) {
    if (val >= goodLimit) return 'positive';
    if (val <= warnLimit) return 'negative';
    return 'warning';
  } else {
    if (val <= goodLimit) return 'positive';
    if (val >= warnLimit) return 'negative';
    return 'warning';
  }
}
</script>

<style scoped>
.rounded-borders {
  border-radius: 12px;
}

.kpi-card {
  height: 180px;
}

.nutrient-card {
  height: 110px;
}

/* --- NEW ANIMATION STYLES --- */

/* 1. Staggered Fade Up Entrance */
.animate-fade-up {
  opacity: 0;
  transform: translateY(20px);
  /* 'forwards' ensures it stays visible after the animation finishes */
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 2. Hover Lift Effect */
.hover-lift {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-6px);
  /* Makes the shadow slightly darker and more spread out when lifted */
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15) !important;
}
</style>
