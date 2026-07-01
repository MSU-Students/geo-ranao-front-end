<template>
  <q-page class="flex flex-center">
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
      style="filter: brightness(0.6); z-index: 0"
    />
    <div class="text-center z-top text-white">
      <q-icon name="water_drop" size="100px" color="teal-3" />
      <h1 class="text-h2 text-weight-bolder q-mb-md">RANAO FISHNET</h1>
      <p class="text-h5 text-weight-light q-mb-xl">Water Quality Mapping & Fish Observation System for Lake Lanao</p>
      <q-btn
        size="lg"
        color="primary"
        label="Explore Interactive Map"
        icon-right="arrow_forward"
        unelevated
        rounded
        @click="$router.push('/map')"
      />
    </div>
  </q-page>
</template>
<script setup lang="ts"></script>
