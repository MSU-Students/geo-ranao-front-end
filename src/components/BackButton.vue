<template>
  <q-btn round unelevated icon="arrow_back" class="back-fab" :class="{ 'back-fab--offset': offset }" @click="handleClick">
    <q-tooltip anchor="center right" self="center left" :offset="[10, 0]">Back</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const props = withDefaults(defineProps<{ to: string; offset?: boolean }>(), {
  offset: true,
});

const router = useRouter();

function handleClick() {
  router.push(props.to).catch((err) => {
    console.error('Navigation error:', err);
  });
}
</script>

<style scoped>
.back-fab {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 2100;
  background: rgba(8, 18, 32, 0.55) !important;
  backdrop-filter: blur(10px);
  color: white !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  transition: all 0.2s ease;
}
.back-fab:hover {
  background: rgba(8, 18, 32, 0.8) !important;
}
/* Clears MainLayout's floating header (~64px tall) so the two never overlap */
.back-fab--offset {
  top: 72px;
}
</style>
