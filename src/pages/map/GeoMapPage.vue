<template>
  <q-page class="row items-center justify-evenly">
    <div class="col-12 col-md-6">
      <h1 class="text-h2 text-center">Welcome to GeoRanao</h1>
      <p class="text-subtitle2 text-center">Discover the beauty of Ranao through our interactive map and comprehensive information.</p>
      <div class="row justify-center">
        <q-btn label="Get Started" color="primary" class="q-mt-md" @click="$router.push('/landing')" />
      </div>
    </div>
    <div class="col-12 col-md-6">
      <img src="~/assets/quasar-logo-vertical.svg" alt="Landing Image" class="full-width" />
    </div>
  </q-page>
</template>
