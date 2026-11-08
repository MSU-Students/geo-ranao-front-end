<template>
  <transition name="water-loader-fade">
    <div v-if="active" class="water-loader" :style="{ zIndex }">
      <div class="water-loader__backdrop" />

      <!-- A fish swims across the whole overlay every few seconds, at a
           random height/speed/direction, independent of the spinner size. -->
      <div
        v-if="fishVisible"
        :key="fishKey"
        class="water-loader__fish"
        :class="fishDirection === 'rtl' ? 'water-loader__fish--rtl' : 'water-loader__fish--ltr'"
        :style="{ top: fishTop + '%', animationDuration: fishDuration + 's' }"
      >
        <svg viewBox="0 0 100 50" class="water-loader__fish-svg">
          <g class="water-loader__fish-tail">
            <path d="M72 25 L96 8 L96 42 Z" />
          </g>
          <path
            class="water-loader__fish-body"
            d="M74 25 C74 8 52 2 26 9 C33 15 33 20 27 25 C33 30 33 35 26 41 C52 48 74 42 74 25 Z"
          />
          <path class="water-loader__fish-fin" d="M46 10 C50 4 58 3 62 6 C56 10 52 12 46 10 Z" />
          <circle class="water-loader__fish-eye" cx="58" cy="18" r="2.8" />
        </svg>
      </div>

      <div class="water-loader__box">
        <div class="water-loader__spinner" :style="{ width: size + 'px', height: size + 'px' }">
          <div class="water-loader__ripple water-loader__ripple--1" />
          <div class="water-loader__ripple water-loader__ripple--2" />

          <svg class="water-loader__ring" viewBox="0 0 100 100">
            <defs>
              <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#5eead4" />
                <stop offset="100%" stop-color="#0e7490" />
              </linearGradient>
            </defs>
            <circle class="water-loader__ring-track" cx="50" cy="50" r="42" />
            <circle class="water-loader__ring-arc" cx="50" cy="50" r="42" :style="{ stroke: `url(#${gradientId})` }" />
          </svg>

          <div class="water-loader__fill-mask">
            <div class="water-loader__fill-wrap">
              <svg class="water-loader__wave" viewBox="0 0 440 24" preserveAspectRatio="none">
                <path
                  d="M0 12 C 27.5 22, 55 2, 82.5 12 S 137.5 22, 165 12 S 220 2, 247.5 12 S 302.5 22, 330 12 S 385 2, 412.5 12 S 440 12, 440 12 L 440 24 L 0 24 Z"
                />
              </svg>
              <svg class="water-loader__wave water-loader__wave--back" viewBox="0 0 440 24" preserveAspectRatio="none">
                <path
                  d="M0 12 C 27.5 22, 55 2, 82.5 12 S 137.5 22, 165 12 S 220 2, 247.5 12 S 302.5 22, 330 12 S 385 2, 412.5 12 S 440 12, 440 12 L 440 24 L 0 24 Z"
                />
              </svg>
            </div>
          </div>

          <q-icon name="water_drop" class="water-loader__drop" :style="{ fontSize: Math.round(size * 0.26) + 'px' }" />
        </div>
        <div v-if="label" class="water-loader__label">{{ label }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';

// A reusable "watery" indeterminate loading overlay — a rotating gradient
// ring plus expanding ripples (the "circling" motion) around a circular
// liquid-fill animation (two scrolling sine waves, rising and falling) with
// a bobbing water-drop icon at the center, and a small fish that swims
// across the whole overlay every few seconds. Fixed to the viewport, so
// callers just toggle `active` from anywhere on the page.
const props = withDefaults(
  defineProps<{
    active: boolean;
    label?: string;
    size?: number;
    zIndex?: number;
  }>(),
  { label: '', size: 120, zIndex: 50 },
);

// Unique per instance so multiple overlays on the same page don't collide on
// the <linearGradient> id.
const gradientId = `water-loader-gradient-${Math.random().toString(36).slice(2, 10)}`;

// ── Random fish passing by ──
// A single fish element whose position/speed/direction is re-randomized
// (via the `fishKey` remount) each time it's spawned, so consecutive passes
// genuinely look different rather than repeating one fixed CSS loop.
const fishVisible = ref(false);
const fishKey = ref(0);
const fishTop = ref(50);
const fishDuration = ref(7);
const fishDirection = ref<'ltr' | 'rtl'>('ltr');
let swimTimer: ReturnType<typeof setTimeout> | null = null;
let spawnTimer: ReturnType<typeof setTimeout> | null = null;

function clearFishTimers() {
  if (swimTimer) clearTimeout(swimTimer);
  if (spawnTimer) clearTimeout(spawnTimer);
  swimTimer = null;
  spawnTimer = null;
}

function scheduleNextFish(delayMs: number) {
  if (spawnTimer) clearTimeout(spawnTimer);
  spawnTimer = setTimeout(() => {
    fishTop.value = 12 + Math.random() * 62;
    fishDuration.value = 5 + Math.random() * 3.5;
    fishDirection.value = Math.random() < 0.5 ? 'ltr' : 'rtl';
    fishKey.value += 1;
    fishVisible.value = true;

    if (swimTimer) clearTimeout(swimTimer);
    swimTimer = setTimeout(() => {
      fishVisible.value = false;
    }, fishDuration.value * 1000);

    scheduleNextFish(3000 + Math.random() * 5000);
  }, delayMs);
}

watch(
  () => props.active,
  (isActive) => {
    if (isActive) {
      scheduleNextFish(800 + Math.random() * 1400);
    } else {
      clearFishTimers();
      fishVisible.value = false;
    }
  },
  { immediate: true },
);

onBeforeUnmount(clearFishTimers);
</script>

<style scoped>
/* Fixed to the viewport, not the (possibly much taller, scrollable) page it's
   placed in — so it always lands centered on whatever is actually on screen,
   not centered inside the full scrollable content height. */
.water-loader {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.water-loader__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(8, 20, 28, 0.38);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.water-loader__box {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.water-loader__spinner {
  position: relative;
}

/* ── Expanding ripples ("circling around") ── */
.water-loader__ripple {
  position: absolute;
  inset: -14%;
  border-radius: 50%;
  border: 2px solid rgba(94, 234, 212, 0.45);
  animation: water-loader-ripple 2.6s ease-out infinite;
}

.water-loader__ripple--2 {
  animation-delay: 1.3s;
}

@keyframes water-loader-ripple {
  0% {
    transform: scale(0.82);
    opacity: 0.55;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

/* ── Rotating ring ("circling") ── */
.water-loader__ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  animation: water-loader-spin 1.15s linear infinite;
}

.water-loader__ring-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.22);
  stroke-width: 7;
}

.water-loader__ring-arc {
  fill: none;
  stroke-width: 7;
  stroke-linecap: round;
  stroke-dasharray: 165 100;
}

@keyframes water-loader-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Liquid fill ("watery") ── */
.water-loader__fill-mask {
  position: absolute;
  inset: 13%;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(14, 116, 144, 0.16);
}

.water-loader__fill-wrap {
  position: absolute;
  left: 0;
  width: 200%;
  height: 60%;
  bottom: 0;
  animation: water-loader-rise 2.6s ease-in-out infinite alternate;
}

.water-loader__wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50%;
  height: 100%;
  fill: rgba(45, 212, 191, 0.55);
  animation: water-loader-scroll 3.2s linear infinite;
}

.water-loader__wave--back {
  left: 50%;
  fill: rgba(14, 116, 144, 0.5);
  animation-duration: 4.4s;
  animation-direction: reverse;
  opacity: 0.85;
}

@keyframes water-loader-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}

@keyframes water-loader-rise {
  from {
    transform: translateY(8%);
  }
  to {
    transform: translateY(-6%);
  }
}

/* ── Center droplet ── */
.water-loader__drop {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #f0fdfa;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35));
  animation: water-loader-bob 1.8s ease-in-out infinite;
}

@keyframes water-loader-bob {
  0%,
  100% {
    transform: translate(-50%, -50%);
  }
  50% {
    transform: translate(-50%, calc(-50% - 3px));
  }
}

.water-loader__label {
  color: #f0fdfa;
  font-size: 0.95rem;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  letter-spacing: 0.01em;
}

/* ── Fish passing by ── */
.water-loader__fish {
  position: absolute;
  left: 0;
  width: 130px;
  height: 65px;
  pointer-events: none;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

.water-loader__fish--ltr {
  animation-name: water-loader-fish-ltr;
}

.water-loader__fish--rtl {
  animation-name: water-loader-fish-rtl;
}

@keyframes water-loader-fish-ltr {
  from {
    transform: translateX(-150px);
  }
  to {
    transform: translateX(calc(100vw + 150px));
  }
}

@keyframes water-loader-fish-rtl {
  from {
    transform: translateX(calc(100vw + 150px)) scaleX(-1);
  }
  to {
    transform: translateX(-150px) scaleX(-1);
  }
}

.water-loader__fish-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
}

.water-loader__fish-body {
  fill: #2dd4bf;
}

.water-loader__fish-fin {
  fill: #0e7490;
  opacity: 0.85;
}

.water-loader__fish-eye {
  fill: #0f172a;
}

.water-loader__fish-tail {
  fill: #0e7490;
  transform-origin: 76px 25px;
  animation: water-loader-fish-wag 0.4s ease-in-out infinite alternate;
}

@keyframes water-loader-fish-wag {
  from {
    transform: rotate(-16deg);
  }
  to {
    transform: rotate(16deg);
  }
}

/* ── Transition ── */
.water-loader-fade-enter-active,
.water-loader-fade-leave-active {
  transition: opacity 0.2s ease;
}

.water-loader-fade-enter-from,
.water-loader-fade-leave-to {
  opacity: 0;
}
</style>
