<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" class="sparkline">
    <polyline :points="points" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <circle :cx="lastPoint.x" :cy="lastPoint.y" r="2.5" :fill="color" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    values: number[];
    color?: string;
    width?: number;
    height?: number;
  }>(),
  {
    color: '#26a69a',
    width: 64,
    height: 24,
  },
);

const scaled = computed(() => {
  const min = Math.min(...props.values);
  const max = Math.max(...props.values);
  const range = max - min || 1;
  const step = props.width / Math.max(props.values.length - 1, 1);
  const pad = 3;
  return props.values.map((v, i) => ({
    x: i * step,
    y: pad + (1 - (v - min) / range) * (props.height - pad * 2),
  }));
});

const points = computed(() => scaled.value.map((p) => `${p.x},${p.y}`).join(' '));
const lastPoint = computed(() => scaled.value[scaled.value.length - 1] ?? { x: 0, y: 0 });
</script>

<style scoped>
.sparkline {
  display: block;
}
</style>
