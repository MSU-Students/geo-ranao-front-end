<template>
  <q-page class="q-pa-md flex flex-center relative-position overflow-hidden">
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
      />

    <div class="column items-center text-center z-top q-pa-xl content-holder full-width">

      <div class="q-mb-xl">
        <h3 class="text-weight-bolder q-my-md text-white drop-shadow">
          RANAO AQUA PROJECT
        </h3>
        <p class="text-h6 text-grey-3 drop-shadow-soft text-weight-light">
          Water Quality & Fish Visualization System for Lake Lanao
        </p>
        <q-btn
          color="primary"
          label="Water Quality Dashboard"
          icon="waves"
          size="lg"
          unelevated
          rounded
          class="q-mt-md px-xl"
        />
        <q-btn
          color="primary"
          label="Fish Observation Dashboard"
          icon="phishing"
          size="lg"
          unelevated
          rounded
          class="q-mt-md px-xl q-mx-md"
        />
        <q-btn
          color="primary"
          label="Launch Interactive Map"
          icon="map"
          size="lg"
          unelevated
          rounded
          class="q-mt-md px-xl"
        />
      </div>


      <div class="row q-col-gutter-lg justify-center full-width" style="max-width: 1200px">

        <div class="col-12 col-md-4">
          <q-card class="feature-card glass-morph">
            <q-card-section>
              <q-icon name="opacity" color="blue" size="lg" class="q-mb-sm" />
              <div class="text-h6 text-white">Water Quality</div>
              <p class="text-grey-4">Analyze Physico-Chemical and Nutrient levels across sampling sites.</p>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="feature-card glass-morph">
            <q-card-section>
              <q-icon name="layers" color="primary" size="lg" class="q-mb-sm" />
              <div class="text-h6 text-white">Fish Observation</div>
              <p class="text-grey-4">Visualize the distribution and habitat health of Lake Lanao’s fish species through 2D thematic maps.</p>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="feature-card glass-morph">
            <q-card-section>
              <q-icon name="dashboard" color="green" size="lg" class="q-mb-sm" />
              <div class="text-h6 text-white">Data Analytics</div>
              <p class="text-grey-4">View temporal charts and statistics for evidence-based decisions.</p>
            </q-card-section>
          </q-card>
        </div>

      </div>
    </div>
  </q-page>
</template>

<style scoped>
.drop-shadow {
  text-shadow: 0px 4px 10px rgba(0, 0, 0, 0.6);
}

.drop-shadow-soft {
  text-shadow: 0px 2px 5px rgba(0, 0, 0, 0.4);
}

.content-holder {
  background: radial-gradient(circle, rgba(0,20,40,0.5) 0%, rgba(0,0,0,0) 80%);
}

/* Modern Glassmorphism Effect for Features */
.glass-morph {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  transition: transform 0.3s ease;
}

.glass-morph:hover {
  transform: translateY(-10px);
  background: rgba(255, 255, 255, 0.15) !important;
}

.feature-card {
  min-height: 200px;
}
</style>
