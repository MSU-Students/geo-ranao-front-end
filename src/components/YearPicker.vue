<template>
  <q-btn
    outline
    dense
    no-caps
    icon="event"
    :label="String(modelValue)"
    :color="dark ? 'grey-4' : 'grey-8'"
    class="year-picker-trigger"
  >
    <q-menu anchor="bottom left" self="top left" @show="onOpen">
      <div class="year-picker-panel" :class="{ 'year-picker-panel--dark': dark }">
        <div class="year-picker-header">
          <q-btn flat dense round icon="chevron_left" :disable="!canGoPrevDecade" @click="prevDecade" />
          <span class="year-picker-range">{{ viewDecadeStart }} – {{ viewDecadeStart + 9 }}</span>
          <q-btn flat dense round icon="chevron_right" @click="nextDecade" />
        </div>
        <div class="year-picker-grid">
          <q-btn
            v-for="y in yearsInView"
            :key="y"
            :flat="y !== modelValue"
            :unelevated="y === modelValue"
            :color="y === modelValue ? 'teal' : undefined"
            :disable="y < minYear"
            dense
            no-caps
            :label="String(y)"
            class="year-picker-year-btn"
            v-close-popup
            @click="selectYear(y)"
          />
        </div>
      </div>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    /** Years before this are shown disabled — the platform has no data before 2025. No upper bound at all: "next decade" always works. */
    minYear?: number;
    dark?: boolean;
  }>(),
  { minYear: 2025, dark: false },
);

const emit = defineEmits<{
  'update:modelValue': [year: number];
  /** Fires right before selecting a year, so the caller can grow any
   * precomputed year/month lists (e.g. useWaterQualityModel's
   * ensureReadingYearsCoverage) before selectedYear actually changes. */
  'need-coverage': [year: number];
}>();

function decadeStartFor(year: number): number {
  return Math.floor(year / 10) * 10;
}

const viewDecadeStart = ref(decadeStartFor(props.modelValue));

function onOpen() {
  viewDecadeStart.value = decadeStartFor(props.modelValue);
}

const yearsInView = computed(() => Array.from({ length: 10 }, (_, i) => viewDecadeStart.value + i));
const canGoPrevDecade = computed(() => viewDecadeStart.value > decadeStartFor(props.minYear));

function prevDecade() {
  if (canGoPrevDecade.value) viewDecadeStart.value -= 10;
}
function nextDecade() {
  viewDecadeStart.value += 10; // no ceiling — you can always go one decade further
}

function selectYear(year: number) {
  if (year < props.minYear) return;
  emit('need-coverage', year);
  emit('update:modelValue', year);
}
</script>

<style scoped>
.year-picker-panel {
  padding: 12px;
  min-width: 230px;
}

.year-picker-panel--dark {
  background: #1a2332;
  color: #fff;
}

.year-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.year-picker-range {
  font-weight: 700;
  font-size: 0.85rem;
}

.year-picker-panel--dark .year-picker-header :deep(.q-btn) {
  color: rgba(255, 255, 255, 0.8);
}

.year-picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.year-picker-year-btn {
  min-width: 0;
}

.year-picker-panel--dark .year-picker-year-btn:not(.q-btn--unelevated) {
  color: rgba(255, 255, 255, 0.75);
}
</style>
