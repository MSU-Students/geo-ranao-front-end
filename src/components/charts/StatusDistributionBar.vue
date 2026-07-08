<template>
  <div class="status-bar">
    <div class="status-bar__track">
      <div
        v-for="seg in segments"
        :key="seg.level"
        class="status-bar__segment"
        :style="{ width: seg.pct + '%', background: STATUS_COLORS[seg.level] }"
      >
        <q-tooltip>{{ STATUS_LABELS[seg.level] }}: {{ seg.count }} site(s)</q-tooltip>
      </div>
    </div>

    <div class="row q-gutter-md q-mt-sm">
      <div v-for="level in STATUS_LEVELS" :key="level" class="row items-center no-wrap">
        <span class="status-bar__dot" :style="{ background: STATUS_COLORS[level] }" />
        <span class="text-caption text-grey-4 q-ml-xs">
          {{ STATUS_LABELS[level] }} ({{ counts[level] }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_LEVELS,
  type StatusLevel,
} from 'src/composables/useWaterQualityModel';

const props = defineProps<{
  counts: Record<StatusLevel, number>;
}>();

const total = computed(() => STATUS_LEVELS.reduce((sum, l) => sum + props.counts[l], 0) || 1);

const segments = computed(() =>
  STATUS_LEVELS.filter((level) => props.counts[level] > 0).map((level) => ({
    level,
    count: props.counts[level],
    pct: (props.counts[level] / total.value) * 100,
  })),
);
</script>

<style scoped>
.status-bar__track {
  display: flex;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
}

.status-bar__segment {
  height: 100%;
  border-right: 2px solid rgba(0, 0, 0, 0.25);
}

.status-bar__segment:last-child {
  border-right: none;
}

.status-bar__dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
