<template>
  <q-expansion-item dense expand-separator class="layer-toggle-item rounded-borders q-mb-xs" header-class="q-pa-sm">
    <template #header>
      <q-item-section avatar>
        <q-toggle :model-value="layer.active" color="teal" @update:model-value="setActive" @click.stop />
      </q-item-section>
      <q-item-section>
        <q-item-label class="text-grey-9" style="font-size: 0.8rem">{{ layer.name }}</q-item-label>
        <q-item-label caption class="text-grey-6" style="font-size: 0.7rem">{{ layer.description }}</q-item-label>
      </q-item-section>
    </template>

    <q-card flat class="bg-grey-2">
      <q-card-section class="q-pt-sm q-pb-md">
        <div class="row items-center no-wrap q-gutter-sm">
          <q-icon name="opacity" size="16px" color="grey-7" />
          <span class="text-caption text-grey-7">Opacity</span>
          <q-space />
          <span class="text-caption text-grey-8 text-weight-medium">{{ layer.opacity }}%</span>
        </div>
        <q-slider
          :model-value="layer.opacity"
          @update:model-value="setOpacity"
          :min="0"
          :max="100"
          :step="5"
          color="teal"
          dense
        />
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { mapLayers, type MapLayer } from 'src/composables/useMapLayersState';

// `layer` is only read for display here — writes go through the shared
// mapLayers ref directly (looked up by id), not by mutating the prop
// object itself (vue/no-mutating-props). This matches how every other
// layer toggle in this app already changes mapLayers: through the shared
// ref, never through a value handed down as a prop.
const props = defineProps<{ layer: MapLayer }>();

function setActive(value: boolean) {
  const target = mapLayers.value.find((l) => l.id === props.layer.id);
  if (target) target.active = value;
}
function setOpacity(value: number | null) {
  const target = mapLayers.value.find((l) => l.id === props.layer.id);
  if (target) target.opacity = value ?? 100;
}
</script>

<style scoped>
.layer-toggle-item {
  background: rgba(0, 0, 0, 0.03);
}
</style>
