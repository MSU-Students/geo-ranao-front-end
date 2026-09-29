<template>
  <div class="pca-biplot">
    <svg :viewBox="`0 0 ${vbWidth} ${vbHeight}`" class="pca-biplot__svg">
      <line :x1="padLeft" :x2="vbWidth - padRight" :y1="yFor(0)" :y2="yFor(0)" class="pca-biplot__axis" />
      <line :x1="xFor(0)" :x2="xFor(0)" :y1="padTop" :y2="vbHeight - padBottom" class="pca-biplot__axis" />
      <text :x="vbWidth - padRight" :y="yFor(0) - 6" text-anchor="end" class="pca-biplot__axis-label">PC1 →</text>
      <text :x="xFor(0) + 6" :y="padTop + 10" class="pca-biplot__axis-label">↑ PC2</text>

      <g v-for="p in points" :key="p.key">
        <line :x1="xFor(0)" :y1="yFor(0)" :x2="xFor(p.pc1)" :y2="yFor(p.pc2)" class="pca-biplot__vector" />
        <circle :cx="xFor(p.pc1)" :cy="yFor(p.pc2)" r="3" class="pca-biplot__point" />
        <text :x="xFor(p.pc1)" :y="yFor(p.pc2) + (p.pc2 >= 0 ? -7 : 14)" text-anchor="middle" class="pca-biplot__label">
          {{ p.label }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface PCAPoint {
  key: string;
  label: string;
  pc1: number;
  pc2: number;
}

const props = defineProps<{ points: PCAPoint[] }>();

const vbWidth = 520;
const vbHeight = 420;
const padLeft = 20;
const padRight = 20;
const padTop = 20;
const padBottom = 20;

const range = computed(() => {
  const all = props.points.flatMap((p) => [Math.abs(p.pc1), Math.abs(p.pc2)]);
  const max = all.length ? Math.max(...all) : 1;
  return max * 1.25 || 1;
});

function xFor(v: number): number {
  const r = range.value;
  return padLeft + ((v + r) / (2 * r)) * (vbWidth - padLeft - padRight);
}
function yFor(v: number): number {
  const r = range.value;
  return padTop + (1 - (v + r) / (2 * r)) * (vbHeight - padTop - padBottom);
}
const points = computed(() => props.points);
</script>

<style scoped>
.pca-biplot__svg {
  width: 100%;
  height: 420px;
  display: block;
}

.pca-biplot__axis {
  stroke: rgba(255, 255, 255, 0.25);
  stroke-width: 1;
}

.pca-biplot__axis-label {
  fill: rgba(255, 255, 255, 0.5);
  font-size: 10px;
}

.pca-biplot__vector {
  stroke: #4fc3f7;
  stroke-width: 1.25;
  opacity: 0.7;
}

.pca-biplot__point {
  fill: #4fc3f7;
}

.pca-biplot__label {
  fill: rgba(255, 255, 255, 0.85);
  font-size: 9px;
  font-weight: 600;
}
</style>
