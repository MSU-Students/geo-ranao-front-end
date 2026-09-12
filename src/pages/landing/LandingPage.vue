<template>
  <div class="dive-world">
    <!-- Lake photo — the surface, fading down into the dive gradient below -->
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="hero-photo-layer"
      fit="cover"
      style="filter: brightness(0.4)"
    />
    <div class="hero-photo-fade" aria-hidden="true" />

    <!-- Animated water surface wave — transition between hero and water section -->
    <div class="wave-transition" aria-hidden="true">
      <!-- Wave layer 1 (foreground, fastest) -->
      <svg class="wave-layer wave-layer--1" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path
          d="M0,40 C120,80 240,10 360,50 C480,90 600,20 720,55 C840,90 960,15 1080,50 C1200,85 1320,25 1440,40 L1440,120 L0,120 Z"
        />
      </svg>
      <!-- Wave layer 2 (middle, medium speed) -->
      <svg class="wave-layer wave-layer--2" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path
          d="M0,55 C160,20 280,75 420,35 C560,0 680,70 840,40 C1000,10 1120,65 1280,30 C1360,15 1400,45 1440,55 L1440,120 L0,120 Z"
        />
      </svg>
      <!-- Wave layer 3 (background, slowest) -->
      <svg class="wave-layer wave-layer--3" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path
          d="M0,60 C200,30 320,80 480,45 C640,10 760,75 960,50 C1100,30 1240,70 1440,60 L1440,120 L0,120 Z"
        />
      </svg>
      <!-- Crest highlight shimmer -->
      <svg class="wave-layer wave-highlight" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path
          d="M0,42 C120,78 240,14 360,48 C480,82 600,22 720,53 C840,84 960,18 1080,48 C1200,80 1320,28 1440,42"
        />
      </svg>
    </div>

    <!-- Ambient life — the water section below the hero.
         Fish, bubbles, and seaweed live here.
         Clipped in its own layer (a SIBLING of .dive-layout, not an ancestor) so
         its overflow:hidden never becomes the fisherman rail's scrolling
         ancestor — that would silently break its position:sticky. -->
    <div class="ambient-clip" aria-hidden="true">
      <div class="ambient-bubbles">
        <div v-for="n in 45" :key="n" class="bubble" :style="ambientBubbleStyle(n)" />
      </div>

      <svg
        v-for="fish in ambientFish"
        :key="fish.id"
        class="ambient-fish"
        :class="{ 'ambient-fish--flip': fish.flip }"
        :style="{
          top: fish.top,
          animationDuration: fish.duration,
          animationDelay: fish.delay,
          width: fish.size + 'px',
        }"
        viewBox="0 0 120 52"
      >
        <defs>
          <linearGradient :id="'fishGrad' + fish.id" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="fish.colorTop" />
            <stop offset="100%" :stop-color="fish.colorBottom" />
          </linearGradient>
        </defs>

        <!-- Tail (caudal fin) — forked -->
        <path
          d="M95,26 Q105,10 115,4 Q106,20 108,26 Q106,32 115,48 Q105,42 95,26 Z"
          :fill="fish.finColor"
          opacity="0.7"
          class="fish-tail"
        />

        <!-- Body — streamlined oval -->
        <ellipse cx="52" cy="26" rx="46" ry="18" :fill="`url(#fishGrad${fish.id})`" />

        <!-- Lateral line -->
        <path
          d="M14,27 Q35,24 60,26 Q80,28 96,26"
          fill="none"
          :stroke="fish.colorTop"
          stroke-width="0.5"
          opacity="0.4"
        />

        <!-- Dorsal fin -->
        <path d="M38,9 Q48,0 62,4 Q56,10 44,10 Z" :fill="fish.finColor" opacity="0.65" />

        <!-- Anal fin -->
        <path d="M58,43 Q64,50 72,46 Q68,42 60,42 Z" :fill="fish.finColor" opacity="0.5" />

        <!-- Pectoral fin -->
        <path d="M30,30 Q26,40 34,44 Q36,36 32,30 Z" :fill="fish.finColor" opacity="0.55" />

        <!-- Gill arc -->
        <path d="M26,16 Q22,26 26,36" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="0.8" />

        <!-- Belly highlight -->
        <ellipse cx="45" cy="32" rx="28" ry="7" fill="rgba(255,255,255,0.08)" />

        <!-- Eye -->
        <circle cx="16" cy="22" r="4" fill="white" opacity="0.9" />
        <circle cx="16" cy="22" r="2.8" :fill="fish.eyeColor" />
        <circle cx="16" cy="22" r="1.6" fill="#0a0a0a" />
        <circle cx="14.8" cy="20.8" r="0.7" fill="white" opacity="0.85" />

        <!-- Mouth -->
        <path
          d="M6,25 Q8,27 6,28"
          fill="none"
          stroke="rgba(0,0,0,0.25)"
          stroke-width="0.6"
          stroke-linecap="round"
        />
      </svg>

      <!-- Sharks — large, slow, deep swimmers -->
      <svg
        v-for="shark in ambientSharks"
        :key="'shark-' + shark.id"
        class="ambient-shark"
        :class="{ 'ambient-shark--flip': shark.flip }"
        :style="{
          top: shark.top,
          animationDuration: shark.duration,
          animationDelay: shark.delay,
          width: shark.size + 'px',
          opacity: shark.opacity,
        }"
        viewBox="0 0 220 70"
      >
        <defs>
          <linearGradient :id="'sharkGrad' + shark.id" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="shark.colorTop" />
            <stop offset="100%" :stop-color="shark.colorBottom" />
          </linearGradient>
        </defs>

        <!-- Crescent tail -->
        <path
          d="M190,35 Q200,15 215,8 Q205,28 207,35 Q205,42 215,62 Q200,55 190,35 Z"
          :fill="shark.colorTop"
          opacity="0.6"
          class="shark-tail"
        />

        <!-- Body — torpedo shape -->
        <path
          d="M8,35 Q30,8 80,10 Q140,12 175,25 Q195,32 195,35 Q195,38 175,45 Q140,58 80,60 Q30,62 8,35 Z"
          :fill="`url(#sharkGrad${shark.id})`"
        />

        <!-- Dorsal fin — tall and iconic -->
        <path d="M85,12 Q95,-5 115,8 Q105,14 90,14 Z" :fill="shark.colorTop" opacity="0.8" />

        <!-- Pectoral fins -->
        <path d="M65,48 Q55,62 72,65 Q74,55 68,48 Z" :fill="shark.colorTop" opacity="0.5" />

        <!-- Gill slits -->
        <line x1="42" y1="25" x2="44" y2="40" stroke="rgba(0,0,0,0.12)" stroke-width="0.6" />
        <line x1="47" y1="24" x2="49" y2="41" stroke="rgba(0,0,0,0.12)" stroke-width="0.6" />
        <line x1="52" y1="23" x2="54" y2="42" stroke="rgba(0,0,0,0.12)" stroke-width="0.6" />

        <!-- Belly highlight -->
        <ellipse cx="100" cy="42" rx="55" ry="10" fill="rgba(255,255,255,0.06)" />

        <!-- Eye -->
        <circle cx="22" cy="32" r="3" fill="rgba(255,255,255,0.8)" />
        <circle cx="22" cy="32" r="2" fill="#1a3a4a" />
        <circle cx="21" cy="31" r="0.6" fill="white" opacity="0.7" />
      </svg>

      <!-- Swordfish — sleek, fast swimmers -->
      <svg
        v-for="sword in ambientSwordfish"
        :key="'sword-' + sword.id"
        class="ambient-swordfish"
        :class="{ 'ambient-swordfish--flip': sword.flip }"
        :style="{
          top: sword.top,
          animationDuration: sword.duration,
          animationDelay: sword.delay,
          width: sword.size + 'px',
          opacity: sword.opacity,
        }"
        viewBox="0 0 200 55"
      >
        <defs>
          <linearGradient :id="'swordGrad' + sword.id" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="sword.colorTop" />
            <stop offset="100%" :stop-color="sword.colorBottom" />
          </linearGradient>
        </defs>

        <!-- Forked tail -->
        <path
          d="M170,27 Q180,12 192,6 Q182,22 184,27 Q182,32 192,48 Q180,42 170,27 Z"
          :fill="sword.colorTop"
          opacity="0.6"
          class="swordfish-tail"
        />

        <!-- Body — streamlined -->
        <path
          d="M35,27 Q55,10 90,12 Q135,14 160,22 Q175,26 175,27 Q175,28 160,32 Q135,40 90,42 Q55,44 35,27 Z"
          :fill="`url(#swordGrad${sword.id})`"
        />

        <!-- Sword/bill -->
        <path d="M35,27 Q20,26 2,26.5 Q20,28 35,27 Z" :fill="sword.colorTop" opacity="0.7" />

        <!-- Tall dorsal fin -->
        <path d="M70,13 Q80,-2 100,8 Q90,14 75,14 Z" :fill="sword.colorTop" opacity="0.7" />

        <!-- Pectoral fin -->
        <path d="M60,35 Q52,46 66,48 Q66,40 62,35 Z" :fill="sword.colorTop" opacity="0.45" />

        <!-- Lateral line -->
        <path
          d="M40,28 Q80,25 130,27 Q160,29 170,27"
          fill="none"
          :stroke="sword.colorTop"
          stroke-width="0.4"
          opacity="0.35"
        />

        <!-- Eye -->
        <circle cx="42" cy="25" r="3" fill="rgba(255,255,255,0.85)" />
        <circle cx="42" cy="25" r="2" :fill="sword.eyeColor" />
        <circle cx="42" cy="25" r="1.2" fill="#0a0a0a" />
        <circle cx="41" cy="24" r="0.5" fill="white" opacity="0.8" />
      </svg>

      <!-- Jellyfish — gentle floating with pulsing bell -->
      <svg
        v-for="jelly in ambientJellyfish"
        :key="'jelly-' + jelly.id"
        class="ambient-jellyfish"
        :style="{
          left: jelly.left,
          animationDuration: jelly.driftDuration,
          animationDelay: jelly.delay,
          width: jelly.size + 'px',
          opacity: jelly.opacity,
        }"
        viewBox="0 0 60 100"
      >
        <defs>
          <linearGradient :id="'jellyGrad' + jelly.id" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" :stop-color="jelly.colorTop" />
            <stop offset="100%" :stop-color="jelly.colorBottom" />
          </linearGradient>
        </defs>

        <!-- Bell / dome -->
        <path
          d="M5,38 Q5,5 30,3 Q55,5 55,38 Q45,42 30,42 Q15,42 5,38 Z"
          :fill="`url(#jellyGrad${jelly.id})`"
          class="jelly-bell"
        />

        <!-- Bell highlight -->
        <ellipse cx="25" cy="18" rx="12" ry="8" fill="rgba(255,255,255,0.1)" />

        <!-- Oral arms -->
        <path
          d="M20,42 Q18,55 22,68 Q20,75 18,82"
          fill="none"
          :stroke="jelly.tentColor"
          stroke-width="1.2"
          stroke-linecap="round"
          class="jelly-tentacle"
        />
        <path
          d="M30,42 Q32,58 28,72 Q30,80 29,90"
          fill="none"
          :stroke="jelly.tentColor"
          stroke-width="1"
          stroke-linecap="round"
          class="jelly-tentacle jelly-tentacle--t2"
        />
        <path
          d="M40,42 Q42,54 38,66 Q40,76 42,85"
          fill="none"
          :stroke="jelly.tentColor"
          stroke-width="1.2"
          stroke-linecap="round"
          class="jelly-tentacle jelly-tentacle--t3"
        />

        <!-- Thin trailing tentacles -->
        <path
          d="M15,40 Q12,52 16,65 Q13,78 15,92"
          fill="none"
          :stroke="jelly.tentColor"
          stroke-width="0.5"
          opacity="0.5"
          class="jelly-tentacle jelly-tentacle--t4"
        />
        <path
          d="M45,40 Q48,53 44,67 Q47,79 45,95"
          fill="none"
          :stroke="jelly.tentColor"
          stroke-width="0.5"
          opacity="0.5"
          class="jelly-tentacle jelly-tentacle--t5"
        />
      </svg>

      <div class="seaweed-bed">
        <svg
          v-for="(blade, i) in seaweedBlades"
          :key="i"
          class="seaweed-blade"
          :style="{ left: blade.left, animationDelay: blade.delay, height: blade.height }"
          viewBox="0 0 20 120"
          preserveAspectRatio="none"
        >
          <path
            d="M10,120 C-2,90 18,70 6,45 C-2,25 14,15 10,0"
            fill="none"
            :stroke="blade.color"
            stroke-width="5"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </div>

    <!-- Two-column layout: the fisherman stays with you as you scroll, -->
    <!-- information flows down the right the whole way to the bottom.  -->
    <div class="dive-layout">
      <div class="info-column">
        <!-- HERO TEXT — sits over the lake photo -->
        <div class="hero-block">
          <q-avatar size="90px" class="hero-logo-avatar q-mb-lg">
            <q-icon name="water_drop" size="50px" color="white" />
          </q-avatar>

          <h1 class="hero-title q-mb-none">GEO RANAO</h1>
          <div class="hero-divider q-mx-auto q-my-md" />
          <p class="hero-subtitle q-mb-xs">A Unified GIS Platform for Lake Lanao</p>
          <p class="hero-description q-mb-xl">
            Combining Water Quality Monitoring (AquaLanaoGIS) and Fish Biodiversity Mapping (Ranao
            FishNet)
          </p>

          <q-btn unelevated rounded size="lg" class="explore-btn q-px-xl" @click="enterDashboard">
            <q-icon name="travel_explore" class="q-mr-sm" size="sm" />
            Explore the Map
          </q-btn>

          <div class="row q-gutter-xl justify-center q-mt-xl">
            <div class="hero-stat" v-for="stat in heroStats" :key="stat.label">
              <div class="hero-stat-value">{{ stat.value }}</div>
              <div class="hero-stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <!-- INTRO — one platform, two missions -->
        <div class="info-block">
          <div class="dive-reveal" :ref="addRevealRef">
            <div class="text-overline dive-eyebrow">
              College of Information and Computing Sciences · MSU Main Campus
              <div class="text-overline dive-eyebrow">
                College of Fisheries and Aquatic Sciences · MSU Main Campus
              </div>
            </div>

            <h2 class="dive-heading">One Platform, Two Missions</h2>
            <p class="dive-body">
              <strong>Geo Ranao</strong> brings together two capstone research projects, both
              dedicated to understanding and protecting Lake Lanao — the largest lake in Mindanao,
              and one of the 17 ancient lakes on Earth. Using data gathered by environmental
              researchers, one team studies the chemistry of the water while the other studies the
              fish that live in it. Together, their findings are integrated into a single
              interactive map.
            </p>
          </div>

          <div class="row q-col-gutter-lg q-mt-xl dive-reveal" :ref="addRevealRef">
            <div class="col-12 col-sm-6">
              <div class="project-card project-card--water">
                <q-icon name="opacity" size="34px" class="q-mb-sm" />
                <div class="project-card-title">AquaLanaoGIS</div>
                <div class="project-card-subtitle">Water Quality &amp; Visualization</div>
                <p class="project-card-text">
                  Physico-chemical and nutrient monitoring, visualized through interpolated and
                  water quality station mapping.
                </p>
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="project-card project-card--fish">
                <q-icon name="phishing" size="34px" class="q-mb-sm" />
                <div class="project-card-title">Ranao FishNet</div>
                <div class="project-card-subtitle">Fish Profiling &amp; Mapping</div>
                <p class="project-card-text">
                  Cataloguing endemic, invasive, and general fish species observed across the lake.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- AQUALANAOGIS SPOTLIGHT -->
        <div class="info-block">
          <div class="dive-reveal" :ref="addRevealRef">
            <q-icon name="opacity" size="40px" class="dive-scene-icon" />
            <h2 class="dive-heading">AquaLanaoGIS</h2>
            <p class="dive-subheading">Water Quality and Visualization in Lake Lanao</p>
            <p class="dive-body">
              AquaLanaoGIS consolidates and visualizes the lake's physico-chemical parameters —
              Dissolved Oxygen, Temperature, pH, Turbidity, Conductivity, Total Dissolved Solids,
              Total Suspended Solids, and Chlorophyll — alongside its nutrient indicators —
              Phosphate, Ammonia, Nitrite, Nitrate, and Sulfate. Field readings are mapped using
              proportional symbol layers and interpolated surfaces clipped to the lake boundary.
              This gives Local Government Units (LGUs), the Department of Environment and Natural
              Resources (DENR), researchers, and local communities an intuitive, evidence-based
              picture of the lake's health.
            </p>
            <div class="row q-gutter-sm q-mt-md flex flex-center">
              <div class="stat-chip">13 Parameters Tracked</div>
              <div class="stat-chip">24 Monitoring Sites</div>
              <div class="stat-chip">GIS Interpolation &amp; Heatmaps</div>
            </div>
            <p class="dive-credit">By Al-moain U. Algamar &amp; Huamza M. Ampaso</p>
            <p class="dive-credit-adviser">Adviser: Prof. Jasmine Janette C. Mama</p>
            <p class="dive-credit-adviser">Co-Adviser: Prof.Lucman M. Abdulrachman</p>
            <p class="dive-credit-adviser">Technical Adviser: Prof. Jollymar M. Capistrano</p>
          </div>
        </div>

        <!-- RANAO FISHNET SPOTLIGHT -->
        <div class="info-block">
          <div class="dive-reveal" :ref="addRevealRef">
            <q-icon name="phishing" size="40px" class="dive-scene-icon" />
            <h2 class="dive-heading">Ranao FishNet</h2>
            <p class="dive-subheading">Profiling and Mapping of Lake Lanao Fishes</p>
            <p class="dive-body">
              Lake Lanao is home to a unique flock of <strong>endemic Cyprinid</strong> species
              found nowhere else on Earth — now under pressure from introduced,
              <strong>invasive</strong> species. Ranao FishNet catalogues and maps every observation
              — endemic, invasive, and general catch records alike — to support fisheries management
              and the conservation of the lake's native biodiversity.
            </p>
            <div class="row q-gutter-md q-mt-lg flex flex-center">
              <div class="hero-stat" v-for="stat in fishStats" :key="stat.label">
                <div class="hero-stat-value">{{ stat.value }}</div>
                <div class="hero-stat-label">{{ stat.label }}</div>
              </div>
            </div>
            <p class="dive-credit">By Abduljabbar A. Batara &amp; Sainoor T. Saud</p>
            <p class="dive-credit-adviser">Adviser: Prof. Jogie A. Vistal</p>
            <p class="dive-credit-adviser">Co-Adviser: Prof. Johaira Isra</p>
            <p class="dive-credit-adviser">Technical Adviser: Prof. Jollymar M. Capistrano</p>
          </div>
        </div>

        <!-- CTA / FOOTER -->
        <div class="info-block info-block--cta">
          <div class="dive-reveal" :ref="addRevealRef">
            <h2 class="dive-heading dive-heading--light">Ready to explore Lake Lanao?</h2>
            <q-btn unelevated rounded size="lg" class="explore-btn q-px-xl" @click="enterDashboard">
              <q-icon name="travel_explore" class="q-mr-sm" size="sm" />
              Explore the Interactive Map
            </q-btn>
            <p class="footer-credit">
              AquaLanaoGIS &amp; Ranao FishNet — Capstone Projects, College of Information and
              Computing Sciences, Mindanao State University – Main Campus · December 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, type ComponentPublicInstance } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const heroStats = [
  { value: '24', label: 'Water Quality Sites' },
  { value: '13', label: 'Parameters Tracked' },
  { value: '24', label: 'Fish Species' },
];

const fishStats = [
  { value: '24', label: 'Species Recorded' },
  { value: '18', label: 'Endemic Cyprinids' },
  { value: '6', label: 'Invasive Species' },
  { value: '12', label: 'Critically Endangered' },
];

const seaweedColors = ['rgba(38,166,154,0.55)', 'rgba(0,121,107,0.55)', 'rgba(77,182,172,0.45)'];
const seaweedBlades = Array.from({ length: 11 }, (_, i) => ({
  left: `${3 + i * 9}%`,
  delay: `${(i % 4) * 0.6}s`,
  height: `${70 + ((i * 17) % 40)}px`,
  color: seaweedColors[i % seaweedColors.length]!,
}));

// Fish species color palettes for realism
const fishSpecies = [
  {
    colorTop: 'rgba(60,150,140,0.7)',
    colorBottom: 'rgba(160,220,200,0.5)',
    finColor: 'rgba(40,120,110,0.6)',
    eyeColor: '#2a6e5e',
  },
  {
    colorTop: 'rgba(180,130,90,0.6)',
    colorBottom: 'rgba(230,200,160,0.45)',
    finColor: 'rgba(160,110,70,0.55)',
    eyeColor: '#7a5a30',
  },
  {
    colorTop: 'rgba(80,130,170,0.65)',
    colorBottom: 'rgba(170,210,230,0.5)',
    finColor: 'rgba(60,110,150,0.55)',
    eyeColor: '#3a6a8e',
  },
  {
    colorTop: 'rgba(120,170,100,0.6)',
    colorBottom: 'rgba(190,220,170,0.45)',
    finColor: 'rgba(90,140,75,0.55)',
    eyeColor: '#4a7a3e',
  },
  {
    colorTop: 'rgba(170,120,140,0.55)',
    colorBottom: 'rgba(220,190,200,0.4)',
    finColor: 'rgba(140,90,110,0.5)',
    eyeColor: '#7a4a5e',
  },
];

const ambientFish = Array.from({ length: 8 }, (_, i) => {
  const species = fishSpecies[i % fishSpecies.length]!;
  return {
    id: i,
    top: `${15 + ((i * 11 + 3) % 70)}%`,
    duration: `${20 + (i % 5) * 6}s`,
    delay: `${-(i * 3.5)}s`,
    flip: i % 2 === 1,
    size: 50 + ((i * 13) % 50), // 50px to 100px
    ...species,
  };
});

// Sharks — large, slow, deep swimmers (only 2 to keep it premium)
const ambientSharks = [
  {
    id: 0,
    top: '55%',
    duration: '45s',
    delay: '-8s',
    flip: false,
    size: 160,
    opacity: 0.4,
    colorTop: 'rgba(60,80,100,0.6)',
    colorBottom: 'rgba(130,160,180,0.4)',
  },
  {
    id: 1,
    top: '72%',
    duration: '55s',
    delay: '-25s',
    flip: true,
    size: 130,
    opacity: 0.3,
    colorTop: 'rgba(50,70,90,0.5)',
    colorBottom: 'rgba(120,150,170,0.35)',
  },
];

// Swordfish — sleek, fast passes (3, varied speeds)
const ambientSwordfish = [
  {
    id: 0,
    top: '25%',
    duration: '12s',
    delay: '-3s',
    flip: false,
    size: 110,
    opacity: 0.5,
    colorTop: 'rgba(70,120,160,0.65)',
    colorBottom: 'rgba(160,200,220,0.45)',
    eyeColor: '#2a5a7e',
  },
  {
    id: 1,
    top: '48%',
    duration: '15s',
    delay: '-9s',
    flip: true,
    size: 90,
    opacity: 0.4,
    colorTop: 'rgba(80,110,140,0.55)',
    colorBottom: 'rgba(150,190,210,0.4)',
    eyeColor: '#3a6a8e',
  },
  {
    id: 2,
    top: '65%',
    duration: '10s',
    delay: '-6s',
    flip: false,
    size: 100,
    opacity: 0.35,
    colorTop: 'rgba(60,100,130,0.5)',
    colorBottom: 'rgba(140,180,200,0.35)',
    eyeColor: '#2a5070',
  },
];

// Jellyfish — gentle floaters with vertical drift (4, varied sizes)
const ambientJellyfish = [
  {
    id: 0,
    left: '12%',
    driftDuration: '30s',
    delay: '0s',
    size: 40,
    opacity: 0.35,
    colorTop: 'rgba(140,200,220,0.4)',
    colorBottom: 'rgba(100,170,200,0.2)',
    tentColor: 'rgba(140,200,220,0.25)',
  },
  {
    id: 1,
    left: '55%',
    driftDuration: '36s',
    delay: '-10s',
    size: 30,
    opacity: 0.3,
    colorTop: 'rgba(180,160,210,0.35)',
    colorBottom: 'rgba(140,130,180,0.18)',
    tentColor: 'rgba(170,150,200,0.22)',
  },
  {
    id: 2,
    left: '80%',
    driftDuration: '28s',
    delay: '-18s',
    size: 35,
    opacity: 0.25,
    colorTop: 'rgba(120,190,180,0.35)',
    colorBottom: 'rgba(90,160,150,0.18)',
    tentColor: 'rgba(120,190,180,0.2)',
  },
  {
    id: 3,
    left: '35%',
    driftDuration: '40s',
    delay: '-28s',
    size: 25,
    opacity: 0.2,
    colorTop: 'rgba(160,180,220,0.3)',
    colorBottom: 'rgba(130,150,190,0.15)',
    tentColor: 'rgba(160,180,220,0.18)',
  },
];

// Bubbles are scattered across the whole page height (not just one screen),
// so they read as continuous ambience rather than a per-section effect.
function ambientBubbleStyle(seed: number) {
  const size = 3 + Math.random() * 5;
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${Math.random() * 100}%`,
    top: `${(seed * 173) % 100}%`,
    animationDelay: `${Math.random() * 6}s`,
    animationDuration: `${5 + Math.random() * 6}s`,
  };
}

function enterDashboard() {
  router.push('/map').catch((err) => {
    console.error('Navigation error:', err);
  });
}

// Scroll-reveal: fade/slide each panel in the first time it enters view.
const revealEls: HTMLElement[] = [];
function addRevealRef(el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement && !revealEls.includes(el)) {
    revealEls.push(el);
  }
}

let observer: IntersectionObserver | null = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer?.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );
  revealEls.forEach((el) => observer?.observe(el));
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>

<style scoped>
/* ═══════════════════════════════════ */
/* THE DIVE WORLD — one continuous     */
/* gradient from surface to lakebed,   */
/* no hard section boundaries.         */
/* ═══════════════════════════════════ */
.dive-world {
  position: relative;
  background: linear-gradient(
    180deg,
    #1a3d45 0%,
    #1d4550 5%,
    #245a62 10%,
    #2e6c78 16%,
    #357380 20%,
    #2e6c78 26%,
    #256a6a 32%,
    #1f5f5a 42%,
    #16544a 54%,
    #0f4438 66%,
    #0a2e28 78%,
    #071c19 90%,
    #040c0f 100%
  );
}

.hero-photo-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  z-index: 0;
}
.hero-photo-fade {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  z-index: 0;
  background: linear-gradient(
    to bottom,
    transparent 35%,
    rgba(0, 0, 0, 0.25) 55%,
    rgba(0, 0, 0, 0.5) 70%,
    rgba(0, 0, 0, 0.75) 85%,
    rgba(0, 0, 0, 0.92) 100%
  );
}

/* ═══════════════════════════════════ */
/* ANIMATED WATER SURFACE TRANSITION   */
/* 3-layer wave at the hero/water      */
/* boundary with crest highlights      */
/* ═══════════════════════════════════ */
.wave-transition {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100vh - 60px);
  height: 120px;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.wave-layer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 100%;
}

.wave-layer--1 {
  fill: #245a62;
  opacity: 0.9;
  animation: wave-scroll 12s linear infinite;
}
.wave-layer--2 {
  fill: #2e6c78;
  opacity: 0.6;
  animation: wave-scroll 16s linear infinite reverse;
}
.wave-layer--3 {
  fill: #1d4550;
  opacity: 0.4;
  animation: wave-scroll 20s linear infinite;
}

.wave-highlight {
  fill: none;
  stroke: rgba(180, 230, 225, 0.3);
  stroke-width: 1.2;
  opacity: 0.7;
  animation: wave-scroll 12s linear infinite;
  filter: blur(0.5px);
}

@keyframes wave-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

/* ═══════════════════════════════════ */
/* AMBIENT LIFE — the water section    */
/* below the hero (starts at 100vh).   */
/* Sibling of .dive-layout so its own  */
/* overflow:hidden never touches the   */
/* fisherman rail's sticky ancestry.   */
/* ═══════════════════════════════════ */
.ambient-clip {
  position: absolute;
  top: 100vh;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
}
.ambient-bubbles {
  position: absolute;
  inset: 0;
}
.bubble {
  position: absolute;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  animation: bubble-bob ease-in-out infinite;
}
@keyframes bubble-bob {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.15;
  }
  50% {
    transform: translateY(-26px) scale(1.15);
    opacity: 0.55;
  }
}

/* The fish artwork noses left (its eye sits near the shape's left edge), so
   by default it must swim right-to-left to face the way it's moving. The
   --flip variant mirrors it to nose right, and swims left-to-right instead —
   without both changing together, half the fish would appear to swim
   backwards. */
.ambient-fish {
  position: absolute;
  width: 70px;
  z-index: 1;
  pointer-events: none;
  animation-name: fish-drift-reverse;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}
.ambient-fish .fish-tail {
  transform-origin: 95px 26px;
  animation: tail-wiggle 0.6s ease-in-out infinite alternate;
}
.ambient-fish--flip {
  transform: scaleX(-1);
  animation-name: fish-drift-forward;
}
@keyframes tail-wiggle {
  0% {
    transform: rotate(-6deg) scaleX(0.95);
  }
  100% {
    transform: rotate(6deg) scaleX(1.05);
  }
}
@keyframes fish-drift-forward {
  0% {
    left: -120px;
  }
  100% {
    left: 110%;
  }
}
@keyframes fish-drift-reverse {
  0% {
    left: 110%;
  }
  100% {
    left: -120px;
  }
}

/* ═══════════════════════════════════ */
/* SHARKS — large, slow, graceful      */
/* ═══════════════════════════════════ */
.ambient-shark {
  position: absolute;
  width: 160px;
  z-index: 1;
  pointer-events: none;
  animation-name: fish-drift-reverse;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.2));
}
.ambient-shark .shark-tail {
  transform-origin: 195px 35px;
  animation: shark-tail-sweep 1.8s ease-in-out infinite alternate;
}
.ambient-shark--flip {
  transform: scaleX(-1);
  animation-name: fish-drift-forward;
}
@keyframes shark-tail-sweep {
  0% {
    transform: rotate(-4deg);
  }
  100% {
    transform: rotate(4deg);
  }
}

/* ═══════════════════════════════════ */
/* SWORDFISH — sleek, fast             */
/* ═══════════════════════════════════ */
.ambient-swordfish {
  position: absolute;
  width: 100px;
  z-index: 1;
  pointer-events: none;
  animation-name: fish-drift-reverse;
  animation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
  animation-iteration-count: infinite;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.15));
}
.ambient-swordfish .swordfish-tail {
  transform-origin: 175px 27px;
  animation: tail-wiggle 0.4s ease-in-out infinite alternate;
}
.ambient-swordfish--flip {
  transform: scaleX(-1);
  animation-name: fish-drift-forward;
}

/* ═══════════════════════════════════ */
/* JELLYFISH — gentle floating         */
/* ═══════════════════════════════════ */
.ambient-jellyfish {
  position: absolute;
  width: 40px;
  z-index: 1;
  pointer-events: none;
  animation: jelly-drift linear infinite;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.1));
}
.jelly-bell {
  transform-origin: 30px 25px;
  animation: jelly-pulse 3s ease-in-out infinite;
}
.jelly-tentacle {
  animation: jelly-sway 4s ease-in-out infinite alternate;
}
.jelly-tentacle--t2 {
  animation-delay: 0.4s;
}
.jelly-tentacle--t3 {
  animation-delay: 0.8s;
}
.jelly-tentacle--t4 {
  animation-delay: 1.2s;
}
.jelly-tentacle--t5 {
  animation-delay: 1.6s;
}

@keyframes jelly-drift {
  0% {
    top: 90%;
    transform: translateX(0);
  }
  25% {
    transform: translateX(20px);
  }
  50% {
    transform: translateX(-15px);
  }
  75% {
    transform: translateX(10px);
  }
  100% {
    top: -15%;
    transform: translateX(0);
  }
}
@keyframes jelly-pulse {
  0%,
  100% {
    transform: scaleX(1) scaleY(1);
  }
  50% {
    transform: scaleX(1.12) scaleY(0.88);
  }
}
@keyframes jelly-sway {
  0% {
    transform: rotate(-5deg) translateX(-2px);
  }
  100% {
    transform: rotate(5deg) translateX(2px);
  }
}

.seaweed-bed {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 140px;
  z-index: 1;
  pointer-events: none;
}
.seaweed-blade {
  position: absolute;
  bottom: -4px;
  width: 20px;
  transform-origin: bottom center;
  animation: seaweed-sway 4.5s ease-in-out infinite;
}
@keyframes seaweed-sway {
  0%,
  100% {
    transform: rotate(-6deg);
  }
  50% {
    transform: rotate(6deg);
  }
}

/* ═══════════════════════════════════ */
/* LAYOUT                              */
/* ═══════════════════════════════════ */
.dive-layout {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: stretch;
}

.info-column {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0 24px;
}

.info-block {
  max-width: 720px;
  margin: 0 auto;
  padding: 80px 8px 20px 8px;
  text-align: center;
}
.info-block--cta {
  padding-bottom: 110px;
}

/* ── Hero text block ── */
.hero-block {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px 8px;
}

.hero-logo-avatar {
  background: linear-gradient(135deg, #00695c, #26a69a) !important;
  box-shadow: 0 4px 30px rgba(38, 166, 154, 0.4);
}

.hero-title {
  font-size: 3.4rem;
  font-weight: 900;
  color: white;
  letter-spacing: 6px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
  margin: 0;
}

.hero-divider {
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #26a69a, transparent);
}

.hero-subtitle {
  font-size: 1.25rem;
  font-weight: 400;
  color: #e0e0e0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}

.hero-description {
  font-size: 0.92rem;
  color: #cfd8dc;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.explore-btn {
  background: linear-gradient(135deg, #00695c 0%, #26a69a 100%) !important;
  color: white;
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 1rem;
  box-shadow: 0 4px 25px rgba(38, 166, 154, 0.5);
  transition: all 0.3s ease;
}
.explore-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 35px rgba(38, 166, 154, 0.7);
}

.hero-stat {
  text-align: center;
}
.hero-stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #26a69a;
  text-shadow: 0 0 20px rgba(38, 166, 154, 0.3);
}
.hero-stat-label {
  font-size: 0.7rem;
  color: #cfd8dc;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* ═══════════════════════════════════ */
/* SCROLL-REVEAL PANELS                */
/* ═══════════════════════════════════ */
.dive-reveal {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.8s cubic-bezier(0.25, 0.8, 0.25, 1),
    transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.dive-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.dive-eyebrow {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 700;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
  margin-top: 0;
}

.dive-scene-icon {
  color: #fff;
  opacity: 0.9;
  margin-bottom: 8px;
}

.dive-heading {
  font-size: 2.1rem;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
  margin: 0 0 8px;
}
.dive-heading--light {
  color: #e0f2f1;
}

.dive-subheading {
  font-size: 1.02rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 18px;
}

.dive-body {
  font-size: 0.98rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.25);
}

.dive-credit {
  margin-top: 22px;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  margin-bottom: 4px;
}

.dive-credit-adviser {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

.stat-chip {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  padding: 6px 16px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #fff;
}

/* Project cards */
.project-card {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 24px 20px;
  color: #fff;
  height: 100%;
  text-align: center;
  transition:
    transform 0.25s ease-out,
    background 0.25s ease-out;
}
.project-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.18);
}
.project-card-title {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.project-card-subtitle {
  font-size: 0.78rem;
  font-weight: 600;
  opacity: 0.85;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.project-card-text {
  font-size: 0.85rem;
  line-height: 1.5;
  opacity: 0.9;
  margin: 0;
}

.footer-credit {
  margin-top: 20px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
}

/* ═══════════════════════════════════ */
/* RESPONSIVE                         */
/* ═══════════════════════════════════ */
@media (max-width: 760px) {
  .info-column {
    padding: 0 20px;
  }
  .hero-title {
    font-size: 2.3rem;
    letter-spacing: 3px;
  }
  .dive-heading {
    font-size: 1.6rem;
  }
}
</style>
