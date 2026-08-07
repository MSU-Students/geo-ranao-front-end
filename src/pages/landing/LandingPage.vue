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

    <!-- Ambient life — spread across the whole scroll, not boxed into one scene.
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
        :style="{ top: fish.top, animationDuration: fish.duration, animationDelay: fish.delay }"
        viewBox="0 0 60 30"
      >
        <path
          d="M2,15 C8,2 32,2 42,15 C32,28 8,28 2,15 Z M42,15 L58,4 L58,26 Z"
          :fill="fish.color"
        />
        <circle cx="12" cy="13" r="1.6" fill="rgba(10,20,20,0.7)" />
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
            <div class="row q-gutter-sm q-mt-md">
              <div class="stat-chip">13 Parameters Tracked</div>
              <div class="stat-chip">24 Monitoring Sites</div>
              <div class="stat-chip">GIS Interpolation &amp; Heatmaps</div>
            </div>
            <p class="dive-credit">By Al-moain U. Algamar &amp; Huamza M. Ampaso</p>
            <p class="dive-credit-adviser">Adviser: Prof. Jasmine Janette C. Mama</p>
            <p class="dive-credit-adviser">Co-Advised: Prof.Lucman M. Abdulrachman</p>
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
            <div class="row q-gutter-md q-mt-lg">
              <div class="hero-stat" v-for="stat in fishStats" :key="stat.label">
                <div class="hero-stat-value">{{ stat.value }}</div>
                <div class="hero-stat-label">{{ stat.label }}</div>
              </div>
            </div>
            <p class="dive-credit">
              Sibling capstone project · College of Information and Computing Sciences, MSU Main
              Campus
            </p>
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

const fishColors = ['rgba(94,234,212,0.55)', 'rgba(255,171,145,0.5)', 'rgba(94,234,212,0.35)'];
const ambientFish = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  top: `${18 + i * 15}%`,
  duration: `${18 + (i % 4) * 5}s`,
  delay: `${-(i * 4)}s`,
  flip: i % 2 === 1,
  color: fishColors[i % fishColors.length]!,
}));

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
    #6f97a3 0%,
    #5c8f9c 8%,
    #457f8c 18%,
    #2e6c78 30%,
    #1f5f5a 44%,
    #16544a 56%,
    #0f4438 68%,
    #0a2e28 80%,
    #071c19 92%,
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
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 45%, #457f8c 96%);
}

/* ═══════════════════════════════════ */
/* AMBIENT LIFE — spread across the    */
/* whole scrollable height. This is a  */
/* sibling of .dive-layout, so its own */
/* overflow:hidden never touches the   */
/* fisherman rail's sticky ancestry.   */
/* ═══════════════════════════════════ */
.ambient-clip {
  position: absolute;
  inset: 0;
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
  width: 60px;
  z-index: 1;
  pointer-events: none;
  animation-name: fish-drift-reverse;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
.ambient-fish--flip {
  transform: scaleX(-1);
  animation-name: fish-drift-forward;
}
@keyframes fish-drift-forward {
  0% {
    left: -80px;
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
    left: -80px;
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
  padding: 90px 8px;
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
  font-size: 0.78rem;
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
