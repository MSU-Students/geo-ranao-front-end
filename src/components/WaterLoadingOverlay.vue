<template>
  <transition name="water-loader-fade">
    <div v-if="active" class="water-loader" :style="{ zIndex }">
      <div class="water-loader__backdrop" />
      <div class="water-loader__box">
        <div class="water-loader__spinner" :style="{ width: size + 'px', height: size + 'px' }">
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
// A reusable "watery" indeterminate loading overlay — a rotating gradient
// ring (the "circling" motion) around a circular liquid-fill animation (two
// scrolling sine waves, rising and falling) with a bobbing water-drop icon
// at the center. Absolutely positioned to fill its nearest `position:
// relative` ancestor, so callers just wrap the area they want covered.
withDefaults(
  defineProps<{
    active: boolean;
    label?: string;
    size?: number;
    zIndex?: number;
  }>(),
  { label: '', size: 64, zIndex: 50 },
);

// Unique per instance so multiple overlays on the same page don't collide on
// the <linearGradient> id.
const gradientId = `water-loader-gradient-${Math.random().toString(36).slice(2, 10)}`;
</script>

<style scoped>
.water-loader {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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
  gap: 10px;
}

.water-loader__spinner {
  position: relative;
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
  font-size: 0.8rem;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  letter-spacing: 0.01em;
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
