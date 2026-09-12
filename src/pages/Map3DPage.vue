<template>
  <q-page class="map3d-page">
    <!-- Loading overlay -->
    <transition name="fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-content">
          <div class="pulse-ring"></div>
          <q-icon name="water_drop" class="loading-icon" size="48px" color="teal-3" />
          <p class="loading-text">{{ isCustomModel ? 'Building Custom Surfer Model…' : 'Building 3D Bathymetry Model…' }}</p>
          <p class="loading-sub">{{ isCustomModel ? 'Parsing KMZ and computing surface' : 'Fetching satellite imagery & terrain elevation data…' }}</p>
          <q-linear-progress
            :value="loadProgress"
            color="teal"
            track-color="transparent"
            class="loading-bar q-mt-md"
            rounded
          />
        </div>
      </div>
    </transition>

    <!-- Error state -->
    <div v-if="errorMsg && !isLoading" class="error-overlay">
      <q-icon name="error_outline" size="64px" color="red-4" />
      <p class="error-text">{{ errorMsg }}</p>
      <q-btn unelevated rounded color="teal" label="Go to 2D Map" icon="map" @click="$router.push('/map')" />
    </div>

    <!-- Canvas -->
    <canvas ref="canvasEl" class="three-canvas" />

    <!-- ── LEFT SIDE: Toggle button + Drawer ───────────────────────────────── -->
    <transition name="slide-up">
      <div v-if="!isLoading && !errorMsg" class="left-hud">
        <!-- Toggle button (only visible when controls drawer is closed) -->
        <q-btn
          v-if="!drawerOpen"
          id="btn-toggle-drawer"
          unelevated
          round
          color="teal-9"
          icon="menu"
          class="drawer-toggle"
          @click="drawerOpen = true"
        >
          <q-tooltip anchor="center right" self="center left">Open Controls</q-tooltip>
        </q-btn>

        <!-- Slide-out action drawer -->
        <transition name="drawer-slide">
          <div v-if="drawerOpen" class="action-drawer">
            <div class="drawer-header-row">
              <div class="drawer-title">
                <q-icon name="tune" size="16px" class="q-mr-xs" />
                Controls
              </div>
              <q-btn
                flat
                round
                dense
                size="xs"
                icon="close"
                class="text-grey-5"
                @click="drawerOpen = false"
              >
                <q-tooltip anchor="top middle" self="bottom middle">Close Controls</q-tooltip>
              </q-btn>
            </div>

            <!-- KMZ upload — admin only -->
            <template v-if="isAdmin">
              <input type="file" ref="fileInput" accept=".kmz,.kml" style="display: none" @change="onFileUploaded" />
              <q-btn
                id="btn-upload-kmz"
                unelevated
                rounded
                dense
                color="primary"
                icon="upload"
                label="Upload KMZ"
                class="drawer-btn"
                @click="triggerFileUpload"
              >
                <q-tooltip anchor="center right" self="center left">Upload custom KMZ/KML bathymetry model (Admin only)</q-tooltip>
              </q-btn>
            </template>
            <q-btn
              id="btn-reset-camera"
              unelevated
              rounded
              dense
              color="teal-8"
              icon="center_focus_strong"
              label="Reset View"
              class="drawer-btn"
              @click="resetCamera"
            />
            <q-separator dark class="q-my-xs" />
            <div class="drawer-subtitle">
              <q-icon name="palette" size="14px" class="q-mr-xs" />
              Surface & Color
            </div>
            <!-- Google Earth Satellite style -->
            <q-btn
              id="btn-style-satellite"
              unelevated
              rounded
              dense
              :color="colorMode === 'satellite' ? 'teal-7' : 'blue-grey-9'"
              icon="public"
              label="Google Earth Style"
              class="drawer-btn"
              @click="setMode('satellite')"
            >
              <q-tooltip anchor="center right" self="center left">Realistic Google Earth satellite imagery with 3D terrain</q-tooltip>
            </q-btn>
            <!-- Classic Blue Bathymetry scheme -->
            <q-btn
              id="btn-scheme-blue"
              unelevated
              rounded
              dense
              :color="colorMode === 'bathymetry' && bathyScheme === 'blue' ? 'cyan-7' : 'blue-grey-9'"
              icon="water"
              label="Classic Blue Depth"
              class="drawer-btn"
              @click="setMode('bathymetry', 'blue')"
            >
              <q-tooltip anchor="center right" self="center left">Clear nautical blue gradient highlighting shallow to deep trenches</q-tooltip>
            </q-btn>
            <!-- Viridis Bathymetry scheme -->
            <q-btn
              id="btn-scheme-viridis"
              unelevated
              rounded
              dense
              :color="colorMode === 'bathymetry' && bathyScheme === 'viridis' ? 'green-7' : 'blue-grey-9'"
              icon="nature"
              label="Viridis Topo Depth"
              class="drawer-btn"
              @click="setMode('bathymetry', 'viridis')"
            >
              <q-tooltip anchor="center right" self="center left">Scientific Viridis heatmap: yellow shallows to deep purple trenches</q-tooltip>
            </q-btn>
            <!-- Turbo / Rainbow Bathymetry scheme -->
            <q-btn
              id="btn-scheme-rainbow"
              unelevated
              rounded
              dense
              :color="colorMode === 'bathymetry' && bathyScheme === 'rainbow' ? 'deep-orange-7' : 'blue-grey-9'"
              icon="gradient"
              label="Turbo Rainbow Depth"
              class="drawer-btn"
              @click="setMode('bathymetry', 'rainbow')"
            >
              <q-tooltip anchor="center right" self="center left">High-contrast Turbo rainbow heatmap for maximum underwater bathymetric visibility</q-tooltip>
            </q-btn>
            <q-separator dark class="q-my-xs" />
            <q-btn
              id="btn-toggle-wireframe"
              unelevated
              rounded
              dense
              :color="showWireframe ? 'amber-8' : 'blue-grey-7'"
              icon="grid_on"
              :label="showWireframe ? 'Wireframe ON' : 'Wireframe'"
              class="drawer-btn"
              @click="toggleWireframe"
            />
            <q-separator dark class="q-my-sm" />
            <q-btn
              id="btn-goto-2d"
              unelevated
              rounded
              dense
              color="indigo-8"
              icon="map"
              label="2D Map"
              class="drawer-btn"
              @click="$router.push('/map')"
            />
          </div>
        </transition>
      </div>
    </transition>

    <!-- ── RIGHT SIDE: Info Panels ─────────────────────────────────────────── -->
    <transition name="slide-up">
      <div v-if="!isLoading && !errorMsg" class="right-hud">
        <!-- Depth Legend -->
        <div class="info-card">
          <div class="info-title">
            <q-icon :name="colorMode === 'satellite' ? 'public' : 'water'" size="16px" class="q-mr-xs" />
            {{ colorMode === 'satellite' ? 'Google Earth Satellite' : (bathyScheme === 'blue' ? 'Classic Blue Depth (m)' : (bathyScheme === 'viridis' ? 'Viridis Topo Depth (m)' : 'Turbo Rainbow Depth (m)')) }}
          </div>
          <div
            class="legend-gradient"
            :class="{
              'legend-gradient--viridis': colorMode === 'bathymetry' && bathyScheme === 'viridis',
              'legend-gradient--rainbow': colorMode === 'bathymetry' && bathyScheme === 'rainbow',
              'legend-gradient--satellite': colorMode === 'satellite'
            }"
            :style="customLegendStyle"
          />
          <div class="legend-labels">
            <span>{{ legendMin }}</span>
            <span v-if="!isCustomModel">55</span>
            <span v-if="isCustomModel">{{ legendMid }}</span>
            <span>{{ legendMax }}</span>
          </div>
        </div>

        <!-- Toggle Button: Instructions -->
        <div class="hud-toggle-row">
          <q-btn
            unelevated
            rounded
            dense
            no-caps
            :color="showInstructions ? 'cyan-9' : 'blue-grey-10'"
            :icon="showInstructions ? 'close' : 'help_outline'"
            label="Instructions"
            class="hud-toggle-btn"
            @click="showInstructions = !showInstructions"
          >
            <q-tooltip anchor="bottom middle" self="top middle">
              {{ showInstructions ? 'Hide 3D Controls Instructions (H)' : 'Show 3D Controls Instructions (H)' }}
            </q-tooltip>
          </q-btn>
        </div>

        <!-- Mouse Controls Guide + Keyboard Shortcuts (Collapsible) -->
        <transition name="drawer-slide">
          <div v-if="showInstructions" class="info-card">
            <div class="card-header-row">
              <div class="info-title">
                <q-icon name="touch_app" size="16px" class="q-mr-xs" />
                Mouse Controls
              </div>
              <q-btn
                flat
                round
                dense
                size="xs"
                icon="close"
                class="text-grey-5"
                @click="showInstructions = false"
              >
                <q-tooltip anchor="top middle" self="bottom middle">Close</q-tooltip>
              </q-btn>
            </div>
            <div class="control-row"><span class="control-key">Drag</span><span>Rotate</span></div>
            <div class="control-row"><span class="control-key">Scroll</span><span>Zoom</span></div>
            <div class="control-row"><span class="control-key">Right-drag</span><span>Pan</span></div>

            <div class="info-title q-mt-sm">
              <q-icon name="keyboard" size="16px" class="q-mr-xs" />
              Keyboard Shortcuts
            </div>
            <div class="control-row"><span class="control-key">↑ ↓ ← →</span><span>Rotate</span></div>
            <div class="control-row"><span class="control-key">W A S D</span><span>Pan</span></div>
            <div class="control-row"><span class="control-key">+ / -</span><span>Zoom</span></div>
            <div class="control-row"><span class="control-key">R</span><span>Reset view</span></div>
            <div class="control-row"><span class="control-key">F</span><span>Wireframe</span></div>
            <div class="control-row"><span class="control-key">C</span><span>Toggle Color Mode</span></div>
            <div class="control-row"><span class="control-key">H / I</span><span>Toggle Instructions</span></div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- ── LEFT SIDE: 3D Navigation Control Pad (with Toggle Button) ────────────────── -->
    <transition name="slide-up">
      <div v-if="!isLoading && !errorMsg" class="nav-pad-container">
        <!-- Floating Toggle Button for 3D Controls (only shown when panel is closed) -->
        <q-btn
          v-if="!navPadOpen"
          id="btn-toggle-nav-pad"
          round
          unelevated
          dense
          color="cyan-9"
          icon="sports_esports"
          class="nav-pad-toggle"
          @click="navPadOpen = true"
        >
          <q-tooltip anchor="center right" self="center left">
            Show 3D Navigation Controls
          </q-tooltip>
        </q-btn>

        <!-- Collapsible Navigation Control Pad -->
        <transition name="drawer-slide">
          <div v-if="navPadOpen" class="nav-pad">
            <div class="nav-pad-header">
              <q-icon name="3d_rotation" size="16px" class="q-mr-xs" />
              <span>3D Navigation</span>
              <q-space />
              <q-btn
                flat
                round
                dense
                size="xs"
                icon="close"
                class="q-ml-xs text-grey-5"
                @click="navPadOpen = false"
              >
                <q-tooltip anchor="top middle" self="bottom middle">Hide Controls</q-tooltip>
              </q-btn>
            </div>

            <!-- Rotate / Tilt d-pad -->
            <div class="nav-section">
              <div class="nav-label">Rotate & Tilt</div>
              <div class="nav-dpad">
                <div class="dpad-row">
                  <q-btn round unelevated dense class="nav-btn" @click="rotateTiltUp" aria-label="Tilt Up">
                    <q-icon name="keyboard_arrow_up" size="18px" />
                    <q-tooltip anchor="top middle" self="bottom middle">Tilt Up (↑)</q-tooltip>
                  </q-btn>
                </div>
                <div class="dpad-row">
                  <q-btn round unelevated dense class="nav-btn" @click="rotateLeft" aria-label="Rotate Left">
                    <q-icon name="keyboard_arrow_left" size="18px" />
                    <q-tooltip anchor="center left" self="center right">Rotate Left (←)</q-tooltip>
                  </q-btn>
                  <q-btn round unelevated dense class="nav-btn nav-btn--center" @click="resetCamera" aria-label="Reset View">
                    <q-icon name="my_location" size="16px" />
                    <q-tooltip anchor="top middle" self="bottom middle">Reset View (R)</q-tooltip>
                  </q-btn>
                  <q-btn round unelevated dense class="nav-btn" @click="rotateRight" aria-label="Rotate Right">
                    <q-icon name="keyboard_arrow_right" size="18px" />
                    <q-tooltip anchor="center right" self="center left">Rotate Right (→)</q-tooltip>
                  </q-btn>
                </div>
                <div class="dpad-row">
                  <q-btn round unelevated dense class="nav-btn" @click="rotateTiltDown" aria-label="Tilt Down">
                    <q-icon name="keyboard_arrow_down" size="18px" />
                    <q-tooltip anchor="bottom middle" self="top middle">Tilt Down (↓)</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>

            <!-- Pan and Zoom row -->
            <div class="nav-section">
              <div class="nav-label">Pan & Zoom</div>
              <div class="nav-row-controls">
                <!-- Pan buttons -->
                <div class="nav-pan-grid">
                  <div class="dpad-row">
                    <q-btn round unelevated dense class="nav-btn" @click="panForward" aria-label="Pan Up">
                      <q-icon name="north" size="15px" />
                      <q-tooltip anchor="top middle" self="bottom middle">Pan Up (W)</q-tooltip>
                    </q-btn>
                  </div>
                  <div class="dpad-row">
                    <q-btn round unelevated dense class="nav-btn" @click="panLeft" aria-label="Pan Left">
                      <q-icon name="west" size="15px" />
                      <q-tooltip anchor="center left" self="center right">Pan Left (A)</q-tooltip>
                    </q-btn>
                    <q-btn round unelevated dense class="nav-btn" @click="panBack" aria-label="Pan Down">
                      <q-icon name="south" size="15px" />
                      <q-tooltip anchor="bottom middle" self="top middle">Pan Down (S)</q-tooltip>
                    </q-btn>
                    <q-btn round unelevated dense class="nav-btn" @click="panRight" aria-label="Pan Right">
                      <q-icon name="east" size="15px" />
                      <q-tooltip anchor="center right" self="center left">Pan Right (D)</q-tooltip>
                    </q-btn>
                  </div>
                </div>

                <!-- Zoom column -->
                <div class="nav-zoom-col">
                  <q-btn round unelevated dense class="nav-btn" @click="zoomIn" aria-label="Zoom In">
                    <q-icon name="add" size="16px" />
                    <q-tooltip anchor="top middle" self="bottom middle">Zoom In (+)</q-tooltip>
                  </q-btn>
                  <q-btn round unelevated dense class="nav-btn" @click="zoomOut" aria-label="Zoom Out">
                    <q-icon name="remove" size="16px" />
                    <q-tooltip anchor="bottom middle" self="top middle">Zoom Out (-)</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>

            <!-- Quick display mode toggle row -->
            <div class="nav-section q-mt-xs">
              <q-btn
                unelevated
                rounded
                dense
                no-caps
                :color="colorMode === 'satellite' ? 'teal-8' : (bathyScheme === 'blue' ? 'cyan-9' : (bathyScheme === 'viridis' ? 'green-9' : 'deep-orange-9'))"
                :icon="colorMode === 'satellite' ? 'public' : 'palette'"
                :label="colorMode === 'satellite' ? 'Google Earth Style' : (bathyScheme === 'blue' ? 'Blue Depth Mode' : (bathyScheme === 'viridis' ? 'Viridis Depth' : 'Rainbow Depth'))"
                class="nav-mode-btn"
                @click="cycleColorStyle"
              >
                <q-tooltip anchor="top middle" self="bottom middle">Cycle through Satellite (Google Earth) & Depth Color maps (C)</q-tooltip>
              </q-btn>
            </div>

          </div>
        </transition>
      </div>
    </transition>

    <!-- Info tooltip on hover -->
    <div v-if="hoveredDepth !== null && !isLoading" class="depth-tooltip" :style="tooltipStyle">
      <q-icon name="water_drop" size="14px" class="q-mr-xs" />
      ~{{ isCustomModel ? hoveredDepth.toFixed(1) : Math.round(hoveredDepth) }} m
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import * as THREE from 'three';
import { buildDepthGrid, colorForDepth, extractPolygonRings, pointInRing, CONTOUR_MAX_DEPTH_M } from 'src/composables/useBathymetry';
import { parseKMZ, buildGeometryFromPoints } from 'src/composables/useSurfer3D';

// ─── Auth ────────────────────────────────────────────────────────────────────
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === 'Admin');

// ─── Refs ───────────────────────────────────────────────────────────────────
const canvasEl = ref<HTMLCanvasElement | null>(null);
const isLoading = ref(true);
const loadProgress = ref(0);
const errorMsg = ref('');
const showWireframe = ref(false);
const hoveredDepth = ref<number | null>(null);
const tooltipStyle = ref({ left: '0px', top: '0px' });
const drawerOpen = ref(false);
const navPadOpen = ref(false);
const showInstructions = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const customLegendStyle = ref('');
const legendMin = ref('0');
const legendMid = ref('55');
const legendMax = ref('110+');
const isCustomModel = ref(false);
const colorMode = ref<'satellite' | 'bathymetry'>('satellite');
const bathyScheme = ref<'blue' | 'viridis' | 'rainbow'>('blue');

// ─── Three.js state ──────────────────────────────────────────────────────────
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let lakeMesh: THREE.Mesh | null = null;
// Islands currently render as displaced/colored vertices on lakeMesh itself
// (see isIslandVertex/islandWeight below), not as separate objects — this
// stays null, so the cleanup in onFileUploaded() is a safe no-op rather
// than a dangling reference.
const islandGroup: THREE.Group | null = null;
let waterMesh: THREE.Mesh | null = null;
let satelliteMaterial: THREE.MeshStandardMaterial | null = null;
let bathymetryMaterial: THREE.MeshStandardMaterial | null = null;
let animId: number | null = null;
let raycaster: THREE.Raycaster | null = null;
let mouse: THREE.Vector2 | null = null;

// Vertex meta array to dynamically re-color the 3D surface on scheme change
interface VertexMeta {
  isIsland: boolean;
  isLake: boolean;
  depth: number;
  norm: number;
  islandWeight: number;
}
let vertexMetaList: VertexMeta[] | null = null;

// Orbit-control state
let isMouseDown = false;
let isRightMouseDown = false;
let lastMouse = { x: 0, y: 0 };
const CAM_DEFAULT = { phi: 0.9, theta: 0.0, radius: 6.5, target: new THREE.Vector3(0, 0, 0) };
const cam = { ...CAM_DEFAULT, target: new THREE.Vector3() };

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  window.addEventListener('keydown', onKeyDown);
  try {
    await buildScene();
  } catch (e) {
    errorMsg.value = 'Failed to build the 3D model. Please try refreshing.';
    console.error(e);
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  if (animId !== null) cancelAnimationFrame(animId);
  renderer?.dispose();
  window.removeEventListener('resize', onResize);
  window.removeEventListener('keydown', onKeyDown);
});

// ─── Scene construction ──────────────────────────────────────────────────────
async function buildScene() {
  const canvas = canvasEl.value;
  if (!canvas) return;

  // 1. Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  loadProgress.value = 0.1;

  // 2. Scene & Fog
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1628);
  scene.fog = new THREE.FogExp2(0x0a1628, 0.04);

  // 3. Camera
  camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.01, 100);
  updateCameraPosition();

  loadProgress.value = 0.2;

  // 4. Lights
  const ambientLight = new THREE.AmbientLight(0x8ab4f8, 0.6);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.8);
  sunLight.position.set(2, 4, 2);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 0.1;
  sunLight.shadow.camera.far = 30;
  sunLight.shadow.camera.left = -5;
  sunLight.shadow.camera.right = 5;
  sunLight.shadow.camera.top = 5;
  sunLight.shadow.camera.bottom = -5;
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0x00cfff, 0.5);
  rimLight.position.set(-2, 1, -2);
  scene.add(rimLight);

  loadProgress.value = 0.3;

  // 5. Load GeoJSON and build depth grid
  const geojson = await fetch('/geo/lake-lanao.geojson').then((r) => r.json());
  const rings = extractPolygonRings(geojson);
  // Island hole rings (rings[1..n]) — used for direct per-vertex geographic check
  const islandHoleRings = rings.slice(1);

  // Pre-calculate island centers, max extent radii, and effective influence radius
  // This ensures small islands (like Balut, Balut Maito) that are smaller than the 350m grid spacing
  // reliably catch their nearest vertices and emerge visibly above water.
  const islandsInfo = islandHoleRings.map((hole) => {
    let sumLat = 0;
    let sumLng = 0;
    for (const p of hole) {
      sumLat += p[0];
      sumLng += p[1];
    }
    const cLat = sumLat / hole.length;
    const cLng = sumLng / hole.length;
    let maxRadiusM = 0;
    for (const p of hole) {
      const dM = Math.hypot((p[0] - cLat) * 111000, (p[1] - cLng) * 111000 * Math.cos(cLat * (Math.PI / 180)));
      if (dM > maxRadiusM) maxRadiusM = dM;
    }
    // Effective influence radius: at least 320m to guarantee adjacent grid vertices catch it
    const influenceRadiusM = Math.max(maxRadiusM * 1.35, 320);
    return { cLat, cLng, maxRadiusM, influenceRadiusM, hole };
  });

  loadProgress.value = 0.4;

  const grid = await new Promise<ReturnType<typeof buildDepthGrid>>((resolve) => {
    // Yield to the event loop so the loading UI can update
    setTimeout(() => resolve(buildDepthGrid(rings, true)), 50);
  });

  if (!grid) throw new Error('Could not build depth grid');
  loadProgress.value = 0.75;

  const { width, height, values, minLat, maxLat, minLng, maxLng } = grid;

  // 6. Build PlaneGeometry and displace vertices
  // SCALE_XZ = 6.0 so the plane is large enough to show surrounding municipalities
  const SCALE_XZ = 6.0;
  const SCALE_Y  = 0.55;
  // PAD: how much land to add around the lake on each side (fraction of lake size)
  const PAD = 0.8;
  // Aspect ratio uses the original lake bounds (width/height cells approximate lat/lng ratio)
  const lakeAspect = height / width;

  // ── Satellite texture via Esri World Imagery ────────────────────────────────
  // Compute the padded bounding box that matches the full 3D terrain plane
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const paddedMinLng = minLng - lngSpan * PAD;
  const paddedMaxLng = maxLng + lngSpan * PAD;
  const paddedMinLat = minLat - latSpan * PAD;
  const paddedMaxLat = maxLat + latSpan * PAD;

  const bbox = `${paddedMinLng},${paddedMinLat},${paddedMaxLng},${paddedMaxLat}`;
  const imgW = 2048;
  const imgH = Math.round(imgW * ((paddedMaxLat - paddedMinLat) / (paddedMaxLng - paddedMinLng)));
  const esriUrl =
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export` +
    `?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=${imgW},${imgH}&format=jpg&f=image`;

  let mapTexture: THREE.Texture | null = null;
  try {
    mapTexture = await new Promise<THREE.Texture>((resolve, reject) => {
      new THREE.TextureLoader().load(esriUrl, resolve, undefined, reject);
    });
    mapTexture.colorSpace = THREE.SRGBColorSpace;
    mapTexture.flipY = false; // Esri image origin is top-left, matching UV
  } catch {
    console.warn('Satellite texture failed to load; falling back to vertex colours.');
  }

  // ── Real terrain elevation via AWS Terrarium tiles ────────────────────────
  // Each tile pixel encodes: elevation_m = R*256 + G + B/256 - 32768
  // Zoom 9 gives ~78 m/pixel resolution, enough for realistic mountains.
  const ZOOM = 9;

  function lngToTileX(lng: number, z: number) {
    return Math.floor(((lng + 180) / 360) * Math.pow(2, z));
  }
  function latToTileY(lat: number, z: number) {
    const r = (lat * Math.PI) / 180;
    return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z));
  }
  function tileToLng(x: number, z: number) { return (x / Math.pow(2, z)) * 360 - 180; }
  function tileToLat(y: number, z: number) {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  const txMin = lngToTileX(paddedMinLng, ZOOM);
  const txMax = lngToTileX(paddedMaxLng, ZOOM);
  const tyMin = latToTileY(paddedMaxLat, ZOOM); // note: y is inverted
  const tyMax = latToTileY(paddedMinLat, ZOOM);

  const TILE_PX = 256;
  const stitchW = (txMax - txMin + 1) * TILE_PX;
  const stitchH = (tyMax - tyMin + 1) * TILE_PX;

  // Build stitched heightmap on an OffscreenCanvas
  const hCanvas = new OffscreenCanvas(stitchW, stitchH);
  const hCtx = hCanvas.getContext('2d')!;

  await Promise.all(
    Array.from({ length: tyMax - tyMin + 1 }, (_, dy) =>
      Array.from({ length: txMax - txMin + 1 }, async (_, dx) => {
        const tx = txMin + dx;
        const ty = tyMin + dy;
        const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${ZOOM}/${tx}/${ty}.png`;
        try {
          const img = await createImageBitmap(
            await fetch(url).then((res) => res.blob())
          );
          hCtx.drawImage(img, dx * TILE_PX, dy * TILE_PX, TILE_PX, TILE_PX);
        } catch { /* tile fetch failed — leave blank (sea level) */ }
      })
    ).flat()
  );

  const hData = hCtx.getImageData(0, 0, stitchW, stitchH).data;

  // Geo extents of stitched canvas
  const stitchNorth = tileToLat(tyMin, ZOOM);
  const stitchSouth = tileToLat(tyMax + 1, ZOOM);
  const stitchWest  = tileToLng(txMin, ZOOM);
  const stitchEast  = tileToLng(txMax + 1, ZOOM);

  function sampleElevation(lat: number, lng: number): number {
    const px = Math.floor(((lng - stitchWest) / (stitchEast - stitchWest)) * stitchW);
    const py = Math.floor(((stitchNorth - lat) / (stitchNorth - stitchSouth)) * stitchH);
    const cx = Math.max(0, Math.min(stitchW - 1, px));
    const cy = Math.max(0, Math.min(stitchH - 1, py));
    const idx = (cy * stitchW + cx) * 4;
    const R = hData[idx]!;
    const G = hData[idx + 1]!;
    const B = hData[idx + 2]!;
    return R * 256 + G + B / 256 - 32768;
  }

  // Auto-calibrate lake baseline from actual Terrarium data at lake centre.
  const lakeCenterLat = (minLat + maxLat) / 2;
  const lakeCenterLng = (minLng + maxLng) / 2;
  const LAKE_ELEV_M = sampleElevation(lakeCenterLat, lakeCenterLng);

  // Scan a 21×21 coarse grid over the full padded bbox to find the real elevation range.
  let maxTerrainElev = LAKE_ELEV_M;
  for (let sy = 0; sy <= 20; sy++) {
    for (let sx = 0; sx <= 20; sx++) {
      const slat = paddedMinLat + (sy / 20) * (paddedMaxLat - paddedMinLat);
      const slng = paddedMinLng + (sx / 20) * (paddedMaxLng - paddedMinLng);
      const e = sampleElevation(slat, slng);
      if (e > maxTerrainElev) maxTerrainElev = e;
    }
  }
  const ELEV_RANGE_M   = Math.max(300, maxTerrainElev - LAKE_ELEV_M);
  const VERT_EXAG      = 1.5;  // slight exaggeration without distortion
  const SCALE_LAND_MAX = 0.55; // max land height in scene units (same as lake depth)

  // Grid resolution: keep same as lake data
  const GRID_W = width;
  const GRID_H = height;
  const geometry = new THREE.PlaneGeometry(SCALE_XZ, SCALE_XZ * lakeAspect, GRID_W - 1, GRID_H - 1);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes['position'] as THREE.BufferAttribute;
  const colors    = new Float32Array(positions.count * 3);
  const colAttr   = new THREE.BufferAttribute(colors, 3);
  vertexMetaList  = [];

  for (let i = 0; i < positions.count; i++) {
    const row = Math.floor(i / GRID_W);
    const col = i % GRID_W;
    // Normalized 0..1 within the EXTENDED (padded) grid
    const nx = col / (GRID_W - 1);
    const ny = row / (GRID_H - 1);

    // Actual lat/lng for this vertex
    const vLat = paddedMaxLat - ny * (paddedMaxLat - paddedMinLat);
    const vLng = paddedMinLng + nx * (paddedMaxLng - paddedMinLng);

    // Map to the original lake grid coordinates
    const lakeNx = (nx - PAD / (1 + 2 * PAD)) / (1 / (1 + 2 * PAD));
    const lakeNy = (ny - PAD / (1 + 2 * PAD)) / (1 / (1 + 2 * PAD));
    const lakeCol = Math.round(lakeNx * (width - 1));
    const lakeRow = Math.round(lakeNy * (height - 1));
    const inLake = lakeCol >= 0 && lakeCol < width && lakeRow >= 0 && lakeRow < height;
    const lakeIdx = inLake ? lakeRow * width + lakeCol : -1;
    const depth = lakeIdx >= 0 && values[lakeIdx] ? values[lakeIdx] : 0;
    const isLakeCell = lakeIdx >= 0 && depth > 0.5;

    let isIslandVertex = false;
    let islandWeight = 0; // 0..1 factor of island presence

    // Check if vertex is inside or immediately adjacent to any island
    for (const info of islandsInfo) {
      if (pointInRing(vLat, vLng, info.hole)) {
        isIslandVertex = true;
        islandWeight = 1.0;
        break;
      }
      const distM = Math.hypot(
        (vLat - info.cLat) * 111000,
        (vLng - info.cLng) * 111000 * Math.cos(info.cLat * (Math.PI / 180)),
      );
      if (distM <= info.influenceRadiusM) {
        isIslandVertex = true;
        // Smooth dome falloff from island center towards shoreline
        const w = 1.0 - distM / info.influenceRadiusM;
        if (w > islandWeight) islandWeight = w;
      }
    }

    let yPos: number;
    let r: number, g: number, b: number;

    if (isIslandVertex) {
      // Island land mass: elevate visibly above water surface (y = 0.0)
      const elevM = sampleElevation(vLat, vLng);
      const relElev = Math.max(0, elevM - LAKE_ELEV_M);
      const norm = Math.min((relElev * VERT_EXAG) / ELEV_RANGE_M, 1.0);
      // Ensure islands cleanly stand proud with a clear dome (+0.025 to +0.06 scene units)
      const islandBaseHeight = 0.025 + islandWeight * 0.035;
      yPos = Math.max(islandBaseHeight, norm * SCALE_LAND_MAX);

      const shade = 0.45 + islandWeight * 0.35;
      r = 0.20 + shade * 0.25;
      g = 0.32 + shade * 0.35;
      b = 0.12 + shade * 0.1;
    } else if (isLakeCell) {
      // Lake: depress by bathymetric depth
      yPos = -(depth / CONTOUR_MAX_DEPTH_M) * SCALE_Y;
      const rgb = colorForDepth(depth);
      r = rgb[0] / 255;
      g = rgb[1] / 255;
      b = rgb[2] / 255;
    } else {
      // Mainland terrain: real elevation from AWS terrain tiles
      const elevM = sampleElevation(vLat, vLng);
      const relElev = Math.max(0, elevM - LAKE_ELEV_M); // metres above lake surface
      const norm = Math.min((relElev * VERT_EXAG) / ELEV_RANGE_M, 1.0);
      yPos = norm * SCALE_LAND_MAX;
      // Colour: vertex colour used as fallback only (texture overrides)
      const shade = 0.35 + norm * 0.45;
      r = 0.15 + shade * 0.25;
      g = 0.25 + shade * 0.35;
      b = 0.10 + shade * 0.1;
    }

    positions.setY(i, yPos);
    colors[i * 3]     = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;

    vertexMetaList.push({
      isIsland: isIslandVertex,
      isLake: isLakeCell,
      depth,
      norm: isIslandVertex || !isLakeCell ? Math.min((Math.max(0, sampleElevation(vLat, vLng) - LAKE_ELEV_M) * VERT_EXAG) / ELEV_RANGE_M, 1.0) : 0,
      islandWeight,
    });
  }

  positions.needsUpdate = true;
  geometry.setAttribute('color', colAttr);
  geometry.computeVertexNormals();

  loadProgress.value = 0.88;

  // 7. Materials — both satellite and bathymetric depth heatmap available for toggle
  satelliteMaterial = new THREE.MeshStandardMaterial(
    mapTexture
      ? {
          map: mapTexture,
          vertexColors: false,
          color: 0xffffff,
          roughness: 0.85,
          metalness: 0.05,
          side: THREE.DoubleSide,
        }
      : {
          vertexColors: true,
          roughness: 0.55,
          metalness: 0.1,
          side: THREE.DoubleSide,
        }
  );

  bathymetryMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.45,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });

  const activeMaterial = colorMode.value === 'bathymetry' ? bathymetryMaterial : satelliteMaterial;
  lakeMesh = new THREE.Mesh(geometry, activeMaterial);
  lakeMesh.receiveShadow = true;
  lakeMesh.castShadow = false;
  scene.add(lakeMesh);

  // 8. Water-surface plane (semi-transparent) — covers only the lake extent
  const lakeW = SCALE_XZ / (1 + 2 * PAD);
  const lakeH = lakeW * (height / width);
  const waterGeo = new THREE.PlaneGeometry(lakeW * 1.02, lakeH * 1.02);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x1de9b6,
    transparent: true,
    opacity: colorMode.value === 'bathymetry' ? 0.04 : 0.18,
    roughness: 0.1,
    metalness: 0.4,
    side: THREE.DoubleSide,
  });
  waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = 0.0;
  scene.add(waterMesh);

  // 9. Stars (particle field)
  addStars();

  // 10. Raycaster for hover depth readout
  raycaster = new THREE.Raycaster();
  mouse     = new THREE.Vector2(-9999, -9999);

  loadProgress.value = 1.0;

  // 11. Events
  attachEvents(canvas);
  window.addEventListener('resize', onResize);

  // 12. Animate
  animate();
}

function addStars() {
  const starGeo = new THREE.BufferGeometry();
  const count = 1200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = Math.random() * 8 + 1;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.015, sizeAttenuation: true });
  scene?.add(new THREE.Points(starGeo, starMat));
}

// ─── Animation ────────────────────────────────────────────────────────────────
function animate() {
  animId = requestAnimationFrame(animate);

  // Subtle water shimmer
  const t = Date.now() * 0.001;
  if (lakeMesh) lakeMesh.rotation.y = Math.sin(t * 0.08) * 0.003;

  // Hover raycasting
  if (raycaster && mouse && camera && lakeMesh) {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(lakeMesh);
    if (hits.length > 0 && hits[0]) {
      const face = hits[0].face;
      if (face) {
        const idx = face.a;
        if (isCustomModel.value && lakeMesh.geometry.attributes.origZ) {
          hoveredDepth.value = lakeMesh.geometry.attributes.origZ.getX(idx);
        } else {
          // vertexMetaList is indexed 1:1 with the rendered mesh's vertices
          // (built in the same loop as the geometry itself), unlike the raw
          // depth grid — that grid is un-padded, so a rendered vertex index
          // doesn't line up with a grid index directly once the terrain
          // plane extends past the lake (PAD). Only report a reading over
          // actual water; land/island vertices have no meaningful "depth".
          const meta = vertexMetaList?.[idx];
          hoveredDepth.value = meta?.isLake ? meta.depth : null;
        }
      }
    } else {
      hoveredDepth.value = null;
    }
  }

  if (renderer && scene && camera) renderer.render(scene, camera);
}

// ─── Camera helpers ───────────────────────────────────────────────────────────
function updateCameraPosition() {
  if (!camera) return;
  const x = cam.radius * Math.sin(cam.phi) * Math.sin(cam.theta);
  const y = cam.radius * Math.cos(cam.phi);
  const z = cam.radius * Math.sin(cam.phi) * Math.cos(cam.theta);
  camera.position.set(x + cam.target.x, y + cam.target.y, z + cam.target.z);
  camera.lookAt(cam.target);
}

function resetCamera() {
  cam.phi    = CAM_DEFAULT.phi;
  cam.theta  = CAM_DEFAULT.theta;
  cam.radius = CAM_DEFAULT.radius;
  cam.target.set(0, 0, 0);
  updateCameraPosition();
}

function toggleWireframe() {
  showWireframe.value = !showWireframe.value;
  if (lakeMesh) {
    (lakeMesh.material as THREE.MeshStandardMaterial).wireframe = showWireframe.value;
  }
}

// ─── Color Scheme Algorithms ──────────────────────────────────────────────────
// Viridis: Yellow -> Green -> Teal -> Purple -> Deep Navy
function viridisForDepth(d: number, maxD = CONTOUR_MAX_DEPTH_M): [number, number, number] {
  const t = Math.max(0, Math.min(1, d / maxD));
  // 0: [253, 231, 37], 0.25: [93, 201, 99], 0.5: [33, 145, 140], 0.75: [59, 82, 139], 1.0: [68, 1, 84]
  if (t < 0.25) {
    const f = t / 0.25;
    return [Math.round(253 + f * (93 - 253)), Math.round(231 + f * (201 - 231)), Math.round(37 + f * (99 - 37))];
  } else if (t < 0.5) {
    const f = (t - 0.25) / 0.25;
    return [Math.round(93 + f * (33 - 93)), Math.round(201 + f * (145 - 201)), Math.round(99 + f * (140 - 99))];
  } else if (t < 0.75) {
    const f = (t - 0.5) / 0.25;
    return [Math.round(33 + f * (59 - 33)), Math.round(145 + f * (82 - 145)), Math.round(140 + f * (139 - 140))];
  } else {
    const f = (t - 0.75) / 0.25;
    return [Math.round(59 + f * (68 - 59)), Math.round(82 + f * (1 - 82)), Math.round(139 + f * (84 - 139))];
  }
}

// Turbo / Rainbow: Red/Orange shallows -> Yellow -> Green -> Cyan -> Deep Blue/Violet trenches
function rainbowForDepth(d: number, maxD = CONTOUR_MAX_DEPTH_M): [number, number, number] {
  const t = Math.max(0, Math.min(1, d / maxD));
  // 0: [239, 83, 80], 0.25: [255, 238, 88], 0.5: [38, 198, 218], 0.75: [66, 165, 245], 1.0: [49, 27, 146]
  if (t < 0.25) {
    const f = t / 0.25;
    return [Math.round(239 + f * (255 - 239)), Math.round(83 + f * (238 - 83)), Math.round(80 + f * (88 - 80))];
  } else if (t < 0.5) {
    const f = (t - 0.25) / 0.25;
    return [Math.round(255 + f * (38 - 255)), Math.round(238 + f * (198 - 238)), Math.round(88 + f * (218 - 88))];
  } else if (t < 0.75) {
    const f = (t - 0.5) / 0.25;
    return [Math.round(38 + f * (66 - 38)), Math.round(198 + f * (165 - 198)), Math.round(218 + f * (245 - 218))];
  } else {
    const f = (t - 0.75) / 0.25;
    return [Math.round(66 + f * (49 - 66)), Math.round(165 + f * (27 - 165)), Math.round(245 + f * (146 - 245))];
  }
}

function updateMeshColors(scheme: 'blue' | 'viridis' | 'rainbow') {
  if (!lakeMesh || !vertexMetaList) return;
  const colAttr = lakeMesh.geometry.attributes['color'] as THREE.BufferAttribute;
  if (!colAttr) return;

  const arr = colAttr.array as Float32Array;
  for (let i = 0; i < vertexMetaList.length; i++) {
    const meta = vertexMetaList[i];
    if (!meta) continue;
    let r = 0, g = 0, b = 0;

    if (meta.isIsland) {
      const shade = 0.45 + meta.islandWeight * 0.35;
      r = 0.20 + shade * 0.25;
      g = 0.32 + shade * 0.35;
      b = 0.12 + shade * 0.1;
    } else if (meta.isLake) {
      let rgb: [number, number, number];
      if (scheme === 'viridis') {
        rgb = viridisForDepth(meta.depth);
      } else if (scheme === 'rainbow') {
        rgb = rainbowForDepth(meta.depth);
      } else {
        rgb = colorForDepth(meta.depth);
      }
      r = rgb[0] / 255;
      g = rgb[1] / 255;
      b = rgb[2] / 255;
    } else {
      const shade = 0.35 + meta.norm * 0.45;
      r = 0.15 + shade * 0.25;
      g = 0.25 + shade * 0.35;
      b = 0.10 + shade * 0.1;
    }

    arr[i * 3]     = r;
    arr[i * 3 + 1] = g;
    arr[i * 3 + 2] = b;
  }
  colAttr.needsUpdate = true;
}

function setMode(mode: 'satellite' | 'bathymetry', scheme?: 'blue' | 'viridis' | 'rainbow') {
  colorMode.value = mode;
  if (scheme) {
    bathyScheme.value = scheme;
    updateMeshColors(scheme);
  }

  if (lakeMesh) {
    const nextMat = colorMode.value === 'bathymetry' ? bathymetryMaterial : satelliteMaterial;
    if (nextMat) {
      nextMat.wireframe = showWireframe.value;
      lakeMesh.material = nextMat;
    }
  }

  if (waterMesh) {
    (waterMesh.material as THREE.MeshStandardMaterial).opacity =
      colorMode.value === 'bathymetry' ? 0.04 : 0.18;
  }
}

function cycleColorStyle() {
  if (colorMode.value === 'satellite') {
    setMode('bathymetry', 'blue');
  } else if (bathyScheme.value === 'blue') {
    setMode('bathymetry', 'viridis');
  } else if (bathyScheme.value === 'viridis') {
    setMode('bathymetry', 'rainbow');
  } else {
    setMode('satellite');
  }
}

// ─── Button-driven camera controls ────────────────────────────────────────────
const ROT_STEP  = 0.08;  // radians per button click (rotate)
const TILT_STEP = 0.06;  // radians per button click (tilt)
const ZOOM_STEP = 0.35;  // scene units per zoom click
const PAN_STEP  = 0.06;  // scene units per pan click

function rotateLeft()     { cam.theta += ROT_STEP;  updateCameraPosition(); }
function rotateRight()    { cam.theta -= ROT_STEP;  updateCameraPosition(); }
function rotateTiltUp()   { cam.phi = Math.max(0.1, cam.phi - TILT_STEP); updateCameraPosition(); }
function rotateTiltDown() { cam.phi = Math.min(Math.PI * 0.85, cam.phi + TILT_STEP); updateCameraPosition(); }
function zoomIn()         { cam.radius = Math.max(0.5, cam.radius - ZOOM_STEP); updateCameraPosition(); }
function zoomOut()        { cam.radius = Math.min(12, cam.radius + ZOOM_STEP);  updateCameraPosition(); }
function panLeft()        { cam.target.x -= PAN_STEP; updateCameraPosition(); }
function panRight()       { cam.target.x += PAN_STEP; updateCameraPosition(); }
function panForward()     { cam.target.z -= PAN_STEP; updateCameraPosition(); }
function panBack()        { cam.target.z += PAN_STEP; updateCameraPosition(); }

// ─── Keyboard shortcuts ────────────────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent) {
  // Ignore when focus is on an input/textarea
  const tag = (e.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  switch (e.key) {
    case 'ArrowLeft':  rotateLeft();     e.preventDefault(); break;
    case 'ArrowRight': rotateRight();    e.preventDefault(); break;
    case 'ArrowUp':    rotateTiltUp();   e.preventDefault(); break;
    case 'ArrowDown':  rotateTiltDown(); e.preventDefault(); break;
    case '+': case '=': zoomIn();        break;
    case '-': case '_': zoomOut();       break;
    case 'a': case 'A': panLeft();       break;
    case 'd': case 'D': panRight();      break;
    case 'w': case 'W': panForward();    break;
    case 's': case 'S': panBack();       break;
    case 'r': case 'R': resetCamera();   break;
    case 'f': case 'F': toggleWireframe(); break;
    case 'c': case 'C': cycleColorStyle(); break;
    case 'h': case 'H': case 'i': case 'I': case '?': showInstructions.value = !showInstructions.value; break;
  }
}

// ─── Event handlers ───────────────────────────────────────────────────────────
function triggerFileUpload() {
  fileInput.value?.click();
}

async function onFileUploaded(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;
  const file = target.files[0];
  if (!file) return;

  isLoading.value = true;
  loadProgress.value = 0.2;
  errorMsg.value = '';
  try {
    const points = await parseKMZ(file);
    loadProgress.value = 0.5;
    const { geometry, minZ, maxZ } = buildGeometryFromPoints(points);
    loadProgress.value = 0.9;

    if (lakeMesh) {
      scene?.remove(lakeMesh);
      lakeMesh.geometry.dispose();
      (lakeMesh.material as THREE.Material).dispose();
    }

    if (islandGroup) {
      scene?.remove(islandGroup);
      islandGroup.clear();
    }

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.55,
      metalness: 0.1,
      side: THREE.DoubleSide,
      wireframe: showWireframe.value,
    });

    lakeMesh = new THREE.Mesh(geometry, material);
    lakeMesh.receiveShadow = true;
    lakeMesh.castShadow = false;
    scene?.add(lakeMesh);

    isCustomModel.value = true;
    customLegendStyle.value = 'background: linear-gradient(to right, #0D47A1, #E3F2FD);';
    legendMin.value = minZ.toFixed(1);
    legendMid.value = ((minZ + maxZ) / 2).toFixed(1);
    legendMax.value = maxZ.toFixed(1);

    resetCamera();
    drawerOpen.value = false;
  } catch (e) {
    errorMsg.value = 'Failed to load custom 3D model. ' + (e as Error).message;
  } finally {
    loadProgress.value = 1.0;
    setTimeout(() => { isLoading.value = false; }, 300);
    target.value = '';
  }
}

function attachEvents(canvas: HTMLCanvasElement) {
  canvas.addEventListener('mousedown',  onMouseDown);
  canvas.addEventListener('mousemove',  onMouseMove);
  canvas.addEventListener('mouseup',    onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);
  canvas.addEventListener('wheel',      onWheel, { passive: false });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function onMouseDown(e: MouseEvent) {
  if (e.button === 0) isMouseDown = true;
  if (e.button === 2) isRightMouseDown = true;
  lastMouse = { x: e.clientX, y: e.clientY };
}

function onMouseMove(e: MouseEvent) {
  // Update raycaster mouse
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  if (mouse) {
    mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
  }
  tooltipStyle.value = { left: e.clientX + 14 + 'px', top: e.clientY - 30 + 'px' };

  if (!isMouseDown && !isRightMouseDown) return;
  const dx = e.clientX - lastMouse.x;
  const dy = e.clientY - lastMouse.y;
  lastMouse = { x: e.clientX, y: e.clientY };

  if (isMouseDown) {
    cam.theta -= dx * 0.005;
    cam.phi    = Math.max(0.1, Math.min(Math.PI * 0.85, cam.phi + dy * 0.005));
    updateCameraPosition();
  } else if (isRightMouseDown) {
    // Pan in camera's XZ plane
    const panSpeed = cam.radius * 0.001;
    cam.target.x -= dx * panSpeed;
    cam.target.z -= dy * panSpeed * 0.5;
    updateCameraPosition();
  }
}

function onMouseUp() {
  isMouseDown = false;
  isRightMouseDown = false;
}

function onWheel(e: WheelEvent) {
  e.preventDefault();
  cam.radius = Math.max(0.5, Math.min(10, cam.radius + e.deltaY * 0.003));
  updateCameraPosition();
}

function onResize() {
  const canvas = canvasEl.value;
  if (!canvas || !renderer || !camera) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
</script>

<style scoped>
/* ── Page shell ────────────────────────────────────────────────────────────── */
.map3d-page {
  position: relative;
  width: 100%;
  height: calc(100vh - 52px);
  overflow: hidden;
  background: #0a1628;
  font-family: 'Inter', 'Roboto', sans-serif;
}

.three-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* ── Loading overlay ───────────────────────────────────────────────────────── */
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #0d2240 0%, #060d1a 100%);
  z-index: 10;
}

.loading-content {
  text-align: center;
  color: #e0f7fa;
  position: relative;
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 2px solid rgba(0, 229, 255, 0.3);
  animation: pulse 2s ease-out infinite;
}

@keyframes pulse {
  0%   { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2);   opacity: 0; }
}

.loading-icon {
  position: relative;
  z-index: 1;
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0);    }
  50%       { transform: translateY(-8px); }
}

.loading-text {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 16px 0 4px;
  letter-spacing: 0.5px;
}

.loading-sub {
  font-size: 0.85rem;
  color: #80cbc4;
  margin: 0;
}

.loading-bar {
  width: 280px;
  margin: 0 auto;
  height: 4px;
}

/* ── Error overlay ─────────────────────────────────────────────────────────── */
.error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 10;
  color: #fff;
}

.error-text {
  font-size: 1rem;
  color: #ef9a9a;
  max-width: 320px;
  text-align: center;
}

/* ── LEFT HUD (toggle + drawer) ────────────────────────────────────────────── */
.left-hud {
  position: absolute;
  top: 80px;
  left: 16px;
  z-index: 100;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
}

.drawer-toggle {
  width: 46px !important;
  height: 46px !important;
  box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.4), 0 6px 24px rgba(0,0,0,0.6);
  background: linear-gradient(135deg, #00bcd4, #006064) !important;
  transition: transform 0.2s, box-shadow 0.2s;
}
.drawer-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 0 0 4px rgba(0, 229, 255, 0.6), 0 8px 32px rgba(0,0,0,0.7);
}

.action-drawer {
  background: rgba(10, 22, 40, 0.88);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 160px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.drawer-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.drawer-header-row .drawer-title {
  margin-bottom: 0;
}

.drawer-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #80cbc4;
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.drawer-subtitle {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #80deea;
  display: flex;
  align-items: center;
  margin-top: 2px;
  margin-bottom: 4px;
}

.drawer-btn {
  font-size: 0.78rem !important;
  padding: 6px 14px !important;
  min-width: 130px;
  justify-content: flex-start;
}

/* ── RIGHT HUD (info panels) ───────────────────────────────────────────────── */
.right-hud {
  position: absolute;
  top: 20px;
  right: 16px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.info-card {
  background: rgba(10, 22, 40, 0.82);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 12px 16px;
  color: #e0f7fa;
  min-width: 200px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
}

.hud-toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hud-toggle-btn {
  font-size: 0.74rem !important;
  font-weight: 600;
  padding: 4px 12px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  letter-spacing: 0.3px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.hud-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
  border-color: rgba(0, 229, 255, 0.45);
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.card-header-row .info-title {
  margin-bottom: 0;
}

.info-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #80cbc4;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.info-text {
  font-size: 0.82rem;
  color: #e0f7fa;
  margin: 0 0 2px 0;
  font-weight: 600;
}

.info-sub {
  font-size: 0.72rem;
  color: #80cbc4;
  margin: 0;
}

.legend-gradient {
  width: 100%;
  height: 10px;
  border-radius: 6px;
  background: linear-gradient(to right, #e3f2fd, #90caf9, #42a5f5, #1565c0, #0d47a1);
  margin-bottom: 4px;
  transition: background 0.3s ease;
}

.legend-gradient--viridis {
  background: linear-gradient(to right, #fde725, #5dc963, #21918c, #3b528b, #440154) !important;
}

.legend-gradient--rainbow {
  background: linear-gradient(to right, #ef5350, #ffee58, #26c6da, #42a5f5, #311b92) !important;
}

.legend-gradient--satellite {
  background: linear-gradient(to right, #80cbc4, #26a69a, #00897b, #00695c, #004d40) !important;
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #b2dfdb;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: #b2dfdb;
  margin-bottom: 4px;
}

.control-key {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  padding: 1px 8px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #e0f7fa;
  min-width: 72px;
  text-align: center;
}

/* ── Depth tooltip ─────────────────────────────────────────────────────────── */
.depth-tooltip {
  position: fixed;
  background: rgba(10, 22, 40, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 10px;
  padding: 5px 12px;
  color: #b2ebf2;
  font-size: 0.8rem;
  font-weight: 600;
  pointer-events: none;
  z-index: 20;
  white-space: nowrap;
}

/* ── Transitions ───────────────────────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }

.slide-up-enter-active  { transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from    { opacity: 0; transform: translateY(-20px); }

.drawer-slide-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-slide-leave-active { transition: all 0.2s ease-in; }
.drawer-slide-enter-from   { opacity: 0; transform: translateX(-16px) scale(0.96); }
.drawer-slide-leave-to     { opacity: 0; transform: translateX(-12px) scale(0.97); }

/* ── Navigation Control Pad (bottom-left, collapsible) ─────────────────────── */
.nav-pad-container {
  position: absolute;
  bottom: 24px;
  left: 16px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.nav-pad-toggle {
  width: 44px !important;
  height: 44px !important;
  box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.4), 0 6px 20px rgba(0,0,0,0.6);
  background: linear-gradient(135deg, #00acc1, #006064) !important;
  transition: transform 0.2s, box-shadow 0.2s;
}
.nav-pad-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 0 0 4px rgba(0, 229, 255, 0.65), 0 8px 28px rgba(0,0,0,0.7);
}

.nav-pad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: rgba(10, 22, 40, 0.90);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: 10px 14px 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(0, 229, 255, 0.15);
}

.nav-pad-header {
  width: 100%;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #80cbc4;
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.nav-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #b2dfdb;
  text-transform: uppercase;
  opacity: 0.75;
}

.nav-dpad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.dpad-row {
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
  justify-content: center;
}

.nav-row-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.nav-pan-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.nav-zoom-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.nav-btn {
  width: 32px !important;
  height: 32px !important;
  background: rgba(0, 188, 212, 0.15) !important;
  border: 1px solid rgba(0, 229, 255, 0.25) !important;
  color: #b2ebf2 !important;
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s !important;
}
.nav-btn:hover {
  background: rgba(0, 188, 212, 0.35) !important;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.45) !important;
  transform: scale(1.1) !important;
  color: #e0f7fa !important;
}
.nav-btn:active {
  transform: scale(0.95) !important;
}

.nav-btn--center {
  background: rgba(0, 229, 255, 0.25) !important;
  border-color: rgba(0, 229, 255, 0.5) !important;
  color: #e0f7fa !important;
}
.nav-btn--center:hover {
  background: rgba(0, 229, 255, 0.45) !important;
}

.nav-mode-btn {
  font-size: 0.68rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.4px !important;
  padding: 4px 10px !important;
  width: 100% !important;
  border: 1px solid rgba(0, 229, 255, 0.3) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35) !important;
  transition: all 0.2s ease !important;
}
.nav-mode-btn:hover {
  background: rgba(0, 229, 255, 0.25) !important;
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.4) !important;
  transform: translateY(-1px);
}
</style>
