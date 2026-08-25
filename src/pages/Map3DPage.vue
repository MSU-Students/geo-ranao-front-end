<template>
  <q-page class="map3d-page">
    <!-- Loading overlay -->
    <transition name="fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-content">
          <div class="pulse-ring"></div>
          <q-icon name="water_drop" class="loading-icon" size="48px" color="teal-3" />
          <p class="loading-text">{{ isCustomModel ? 'Building Custom Surfer Model…' : 'Building 3D Bathymetry Model…' }}</p>
          <p class="loading-sub">{{ isCustomModel ? 'Parsing KMZ and computing surface' : 'Analysing lake shoreline and computing depth field' }}</p>
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
        <!-- Toggle button always visible -->
        <q-btn
          id="btn-toggle-drawer"
          unelevated
          round
          color="teal-9"
          :icon="drawerOpen ? 'close' : 'menu'"
          class="drawer-toggle"
          @click="drawerOpen = !drawerOpen"
        >
          <q-tooltip anchor="center right" self="center left">{{ drawerOpen ? 'Close Controls' : 'Open Controls' }}</q-tooltip>
        </q-btn>

        <!-- Slide-out action drawer -->
        <transition name="drawer-slide">
          <div v-if="drawerOpen" class="action-drawer">
            <div class="drawer-title">
              <q-icon name="tune" size="16px" class="q-mr-xs" />
              Controls
            </div>

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
            />
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
            <q-icon name="water" size="16px" class="q-mr-xs" />
            Depth / Elevation (m)
          </div>
          <div class="legend-gradient" :style="customLegendStyle" />
          <div class="legend-labels">
            <span>{{ legendMin }}</span>
            <span v-if="!isCustomModel">55</span>
            <span v-if="isCustomModel">{{ legendMid }}</span>
            <span>{{ legendMax }}</span>
          </div>
        </div>

        <!-- Mouse Controls Guide -->
        <div class="info-card">
          <div class="info-title">
            <q-icon name="touch_app" size="16px" class="q-mr-xs" />
            Navigation
          </div>
          <div class="control-row"><span class="control-key">Drag</span><span>Rotate</span></div>
          <div class="control-row"><span class="control-key">Scroll</span><span>Zoom</span></div>
          <div class="control-row"><span class="control-key">Right-drag</span><span>Pan</span></div>
        </div>

        <!-- Dataset info -->
        <div class="info-card">
          <div class="info-title">
            <q-icon name="info" size="16px" class="q-mr-xs" />
            Dataset
          </div>
          <p class="info-text">{{ isCustomModel ? 'Custom KMZ Upload' : 'Lake Lanao Bathymetry' }}</p>
          <p class="info-sub">{{ isCustomModel ? 'Garmin GPS Survey' : 'Surrounding Municipalities Included' }}</p>
        </div>
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
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { buildDepthGrid, colorForDepth, extractPolygonRings, CONTOUR_MAX_DEPTH_M } from 'src/composables/useBathymetry';
import { parseKMZ, buildGeometryFromPoints } from 'src/composables/useSurfer3D';

// ─── Refs ───────────────────────────────────────────────────────────────────
const canvasEl = ref<HTMLCanvasElement | null>(null);
const isLoading = ref(true);
const loadProgress = ref(0);
const errorMsg = ref('');
const showWireframe = ref(false);
const hoveredDepth = ref<number | null>(null);
const tooltipStyle = ref({ left: '0px', top: '0px' });
const drawerOpen = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const customLegendStyle = ref('');
const legendMin = ref('0');
const legendMid = ref('55');
const legendMax = ref('110+');
const isCustomModel = ref(false);

// ─── Three.js state ──────────────────────────────────────────────────────────
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let lakeMesh: THREE.Mesh | null = null;
let depthValues: Float32Array | null = null;
let animId: number | null = null;
let raycaster: THREE.Raycaster | null = null;
let mouse: THREE.Vector2 | null = null;

// Orbit-control state
let isMouseDown = false;
let isRightMouseDown = false;
let lastMouse = { x: 0, y: 0 };
const CAM_DEFAULT = { phi: 0.9, theta: 0.0, radius: 4.2, target: new THREE.Vector3(0, 0, 0) };
const cam = { ...CAM_DEFAULT, target: new THREE.Vector3() };

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
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
  scene.fog = new THREE.FogExp2(0x0a1628, 0.08);

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
  sunLight.shadow.camera.far = 20;
  sunLight.shadow.camera.left = -3;
  sunLight.shadow.camera.right = 3;
  sunLight.shadow.camera.top = 3;
  sunLight.shadow.camera.bottom = -3;
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0x00cfff, 0.5);
  rimLight.position.set(-2, 1, -2);
  scene.add(rimLight);

  loadProgress.value = 0.3;

  // 5. Load GeoJSON and build depth grid
  const geojson = await fetch('/geo/lake-lanao.geojson').then((r) => r.json());
  const rings = extractPolygonRings(geojson);

  loadProgress.value = 0.4;

  const grid = await new Promise<ReturnType<typeof buildDepthGrid>>((resolve) => {
    // Yield to the event loop so the loading UI can update
    setTimeout(() => resolve(buildDepthGrid(rings, true)), 50);
  });

  if (!grid) throw new Error('Could not build depth grid');
  loadProgress.value = 0.75;

  const { width, height, values } = grid;
  depthValues = values;

  // 6. Build PlaneGeometry and displace vertices
  // SCALE_XZ = 5.0 so the plane is large enough to show surrounding municipalities
  const SCALE_XZ = 3.8;
  const SCALE_Y  = 0.55;
  // PAD: how much land to add around the lake on each side (fraction of lake size)
  const PAD = 0.8;
  // Aspect ratio uses the original lake bounds (width/height cells approximate lat/lng ratio)
  const lakeAspect = height / width;

  // Simple value noise for land terrain elevation
  function terrainNoise(nx: number, ny: number): number {
    const s1 = Math.sin(nx * 7.3 + ny * 5.1) * 0.5 + 0.5;
    const s2 = Math.sin(nx * 13.7 - ny * 11.9) * 0.5 + 0.5;
    const s3 = Math.sin(nx * 3.1 + ny * 17.3) * 0.5 + 0.5;
    const s4 = Math.sin(nx * 23.1 - ny * 7.7) * 0.5 + 0.5;
    return (s1 * 0.45 + s2 * 0.3 + s3 * 0.15 + s4 * 0.1);
  }

  // Grid resolution: keep same as lake data
  const GRID_W = width;
  const GRID_H = height;
  const geometry = new THREE.PlaneGeometry(SCALE_XZ, SCALE_XZ * lakeAspect, GRID_W - 1, GRID_H - 1);
  geometry.rotateX(-Math.PI / 2);


  const positions = geometry.attributes['position'];
  const colors    = new Float32Array(positions.count * 3);
  const colAttr   = new THREE.BufferAttribute(colors, 3);

  for (let i = 0; i < positions.count; i++) {
    const row = Math.floor(i / GRID_W);
    const col = i % GRID_W;
    // Normalized 0..1 within the EXTENDED (padded) grid
    const nx = col / (GRID_W - 1);
    const ny = row / (GRID_H - 1);

    // Map to the original lake grid coordinates
    const lakeNx = (nx - PAD / (1 + 2 * PAD)) / (1 / (1 + 2 * PAD));
    const lakeNy = (ny - PAD / (1 + 2 * PAD)) / (1 / (1 + 2 * PAD));
    const lakeCol = Math.round(lakeNx * (width - 1));
    const lakeRow = Math.round(lakeNy * (height - 1));
    const inLake = lakeCol >= 0 && lakeCol < width && lakeRow >= 0 && lakeRow < height;
    const lakeIdx = inLake ? lakeRow * width + lakeCol : -1;
    const depth = (lakeIdx >= 0 && values[lakeIdx]) ? values[lakeIdx]! : 0;
    const isLakeCell = lakeIdx >= 0 && depth > 0.5;

    let yPos: number;
    let r: number, g: number, b: number;

    if (isLakeCell) {
      // Lake: depress by depth
      yPos = -(depth / CONTOUR_MAX_DEPTH_M) * SCALE_Y;
      const rgb = colorForDepth(depth);
      r = rgb[0] / 255; g = rgb[1] / 255; b = rgb[2] / 255;
    } else {
      // Land: procedural terrain elevation
      const noise = terrainNoise(nx * 4.0, ny * 4.0);
      const landElev = noise * 0.12 + 0.01; // gentle rolling hills
      yPos = landElev;
      // Green-ish land color with variation
      const shade = 0.35 + noise * 0.3;
      r = 0.15 + shade * 0.25;
      g = 0.25 + shade * 0.35;
      b = 0.10 + shade * 0.15;
    }

    positions.setY(i, yPos);
    colors[i * 3]     = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  positions.needsUpdate = true;
  geometry.setAttribute('color', colAttr);
  geometry.computeVertexNormals();

  loadProgress.value = 0.88;

  // 7. Material
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.55,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  lakeMesh = new THREE.Mesh(geometry, material);
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
    opacity: 0.18,
    roughness: 0.1,
    metalness: 0.4,
    side: THREE.DoubleSide,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = 0.005;
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
          hoveredDepth.value = depthValues?.[idx] ?? null;
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

    depthValues = null;

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
    cam.target.z += dy * panSpeed * 0.5;
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
</style>
