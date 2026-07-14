<template>
  <div class="relative-position overflow-hidden hero-page">
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
      fit="cover"
      style="filter: brightness(0.4)"
    />

    <div class="particles-container absolute-full">
      <div v-for="n in 20" :key="n" class="particle" :style="particleStyle()" />
    </div>

    <div class="absolute-full flex flex-center">
      <div class="text-center q-pa-xl hero-content" style="position: relative; z-index: 5">
        <div class="q-mb-lg">
          <q-avatar size="90px" class="hero-logo-avatar">
            <q-icon name="water_drop" size="50px" color="white" />
          </q-avatar>
        </div>

        <h1 class="hero-title q-mb-none">RANAO FISHNET</h1>
        <div class="hero-divider q-mx-auto q-my-md" />
        <p class="hero-subtitle q-mb-xs">Profiling and Mapping of Lake Lanao Fishes</p>
        <p class="hero-description q-mb-xl">
          A Web-Based GIS Platform for Ecological Research and Conservation
        </p>

        <q-btn unelevated rounded size="lg" class="explore-btn q-px-xl" @click="enterDashboard">
          <q-icon name="travel_explore" class="q-mr-sm" size="sm" />
          Explore the Map
        </q-btn>

        <div class="row q-gutter-xl justify-center q-mt-xl">
          <div class="hero-stat" v-for="stat in heroStats" :key="stat.label">
            <div class="hero-stat-value">{{ stat.value }}</div>
            <div class="hero-stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

// Once a visitor has entered the dashboard this session, skip straight past
// the splash on any later visit to "/" (e.g. the browser back button, or a
// stray redirect) instead of showing it again.
const VISITED_KEY = 'ranao-fishnet-visited';

if (sessionStorage.getItem(VISITED_KEY) === 'true') {
  router.replace('/map').catch((err) => {
    console.error('Navigation error:', err);
  });
}

const heroStats = [
  { value: '24', label: 'Species Recorded' },
  { value: '18', label: 'Endemic Cyprinids' },
  { value: '6', label: 'Invasive Species' },
  { value: '12', label: 'Critically Endangered' },
];

function particleStyle() {
  const size = 2 + Math.random() * 4;
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 8}s`,
    animationDuration: `${6 + Math.random() * 10}s`,
  };
}

function enterDashboard() {
  sessionStorage.setItem(VISITED_KEY, 'true');
  router.push('/map').catch((err) => {
    console.error('Navigation error:', err);
  });
}
</script>

<style scoped>
.hero-page {
  min-height: 100vh;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 900;
  color: white;
  letter-spacing: 6px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
}

.hero-divider {
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #26a69a, transparent);
}

.hero-subtitle {
  font-size: 1.3rem;
  font-weight: 400;
  color: #e0e0e0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}

.hero-description {
  font-size: 0.95rem;
  color: #9e9e9e;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.hero-logo-avatar {
  background: linear-gradient(135deg, #00695c, #26a69a) !important;
  box-shadow: 0 4px 30px rgba(38, 166, 154, 0.4);
}

.explore-btn {
  background: linear-gradient(135deg, #00695c 0%, #26a69a 100%) !important;
  color: white;
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 1rem;
  box-shadow: 0 4px 25px rgba(38, 166, 154, 0.5);
  transition: all 0.3s ease;
}
.explore-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 35px rgba(38, 166, 154, 0.7);
}

.hero-stat {
  text-align: center;
}
.hero-stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #26a69a;
  text-shadow: 0 0 20px rgba(38, 166, 154, 0.3);
}
.hero-stat-label {
  font-size: 0.7rem;
  color: #9e9e9e;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Floating Particles */
.particles-container {
  pointer-events: none;
  z-index: 1;
}
.particle {
  position: absolute;
  background: rgba(38, 166, 154, 0.3);
  border-radius: 50%;
  animation: float-particle linear infinite;
}
@keyframes float-particle {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) scale(0.3);
    opacity: 0;
  }
}
</style>
