<template>
  <div class="surface3d">
    <canvas ref="canvasEl" class="surface3d__canvas" @wheel.prevent="onWheel" />
    <div class="surface3d__hint">Drag to rotate · Scroll to zoom</div>

    <!-- The canvas renders nothing when there isn't at least one fully-
         sampled 2x2 (month x depth) patch to build a surface from — that
         used to look like the chart was simply broken, with no explanation.
         This makes the empty state explicit instead of a blank canvas. -->
    <div v-if="!hasMesh" class="surface3d__empty">
      <q-icon name="grid_off" size="28px" color="grey-6" />
      <div class="q-mt-xs">Not enough overlapping depth/month data to build a 3D surface here.</div>
      <div class="text-grey-6 q-mt-xs" style="font-size: 0.7rem;">
        Try a different station or parameter, or use the Depth-Time Isopleth view instead (works with less data).
      </div>
    </div>

    <!-- Legend: height and color both map to this value range. -->
    <div v-if="hasMesh && legendRange" class="surface3d__legend">
      <span class="surface3d__legend-label">{{ legendRange.min.toFixed(decimals) }}{{ unit }}</span>
      <div class="surface3d__legend-gradient" />
      <span class="surface3d__legend-label">{{ legendRange.max.toFixed(decimals) }}{{ unit }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';

export interface Surface3DPoint {
  depth: number;
  value: number;
}
export interface Surface3DColumn {
  month: string;
  points: Surface3DPoint[]; // sorted by depth ascending
}

const props = withDefaults(
  defineProps<{
    columns: Surface3DColumn[];
    decimals?: number;
    unit?: string;
  }>(),
  { decimals: 1, unit: '' },
);

const canvasEl = ref<HTMLCanvasElement | null>(null);
const hasMesh = ref(false);
const legendRange = ref<{ min: number; max: number } | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let mesh: THREE.Mesh | null = null;
let animId: number | null = null;

let isDragging = false;
let lastX = 0;
let lastY = 0;
const cam = { phi: 1.0, theta: 0.7, radius: 3.2 };

function updateCameraPosition() {
  if (!camera) return;
  const x = cam.radius * Math.sin(cam.phi) * Math.sin(cam.theta);
  const y = cam.radius * Math.cos(cam.phi);
  const z = cam.radius * Math.sin(cam.phi) * Math.cos(cam.theta);
  camera.position.set(x, y, z);
  camera.lookAt(0, 0, 0);
}

// Same sequential blue -> tan -> red heat scale as DepthTimeIsopleth — kept
// local rather than shared, matching this codebase's convention of
// self-contained chart components over a shared chart-utils module.
const HEAT_STOPS: [number, [number, number, number]][] = [
  [0, [33, 102, 172]],
  [0.25, [103, 169, 207]],
  [0.5, [223, 194, 125]],
  [0.75, [230, 140, 55]],
  [1, [178, 24, 43]],
];
function heatColor(t: number): [number, number, number] {
  const clamped = Math.min(Math.max(t, 0), 1);
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const stop0 = HEAT_STOPS[i]!;
    const stop1 = HEAT_STOPS[i + 1]!;
    if (clamped >= stop0[0] && clamped <= stop1[0]) {
      const span = stop1[0] - stop0[0] || 1;
      const localT = (clamped - stop0[0]) / span;
      return [
        (stop0[1][0] + (stop1[1][0] - stop0[1][0]) * localT) / 255,
        (stop0[1][1] + (stop1[1][1] - stop0[1][1]) * localT) / 255,
        (stop0[1][2] + (stop1[1][2] - stop0[1][2]) * localT) / 255,
      ];
    }
  }
  return [0.7, 0.7, 0.7];
}

function buildMesh() {
  if (!scene) return;
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
    mesh = null;
  }
  hasMesh.value = false;
  legendRange.value = null;

  const cols = props.columns;
  const allDepths = [...new Set(cols.flatMap((c) => c.points.map((p) => p.depth)))].sort((a, b) => a - b);
  const allValues = cols.flatMap((c) => c.points.map((p) => p.value));
  if (cols.length < 2 || allDepths.length < 2 || allValues.length === 0) return;

  const valueMin = Math.min(...allValues);
  const valueMax = Math.max(...allValues);
  const valueSpan = valueMax - valueMin || 1;
  const depthMax = Math.max(...allDepths) || 1;

  // Grid lookup: value at (columnIndex, depth), null when not sampled.
  function valueAt(ci: number, depth: number): number | null {
    const point = cols[ci]!.points.find((p) => p.depth === depth);
    return point ? point.value : null;
  }

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  // vertexIndex[ci][di] — undefined where that grid point has no data.
  const vertexIndex: (number | undefined)[][] = cols.map(() => []);

  const SCALE_XZ = 2.4;
  const SCALE_Y = 0.7;

  cols.forEach((_, ci) => {
    allDepths.forEach((depth, di) => {
      const value = valueAt(ci, depth);
      if (value === null) return;
      const x = (ci / (cols.length - 1) - 0.5) * SCALE_XZ;
      const z = (depth / depthMax) * SCALE_XZ * 0.6; // depth axis, 0 (surface) at z=0
      const norm = (value - valueMin) / valueSpan;
      const y = norm * SCALE_Y;
      vertexIndex[ci]![di] = positions.length / 3;
      positions.push(x, y, z);
      const [r, g, b] = heatColor(norm);
      colors.push(r, g, b);
    });
  });

  // Only triangulate a quad when all 4 corners have real data — an honest
  // "hole" where the underlying month/depth wasn't sampled, rather than
  // interpolating a value nobody measured.
  for (let ci = 0; ci < cols.length - 1; ci++) {
    for (let di = 0; di < allDepths.length - 1; di++) {
      const a = vertexIndex[ci]?.[di];
      const b = vertexIndex[ci + 1]?.[di];
      const c = vertexIndex[ci]?.[di + 1];
      const d = vertexIndex[ci + 1]?.[di + 1];
      if (a === undefined || b === undefined || c === undefined || d === undefined) continue;
      indices.push(a, b, c, b, d, c);
    }
  }

  if (indices.length === 0) return;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    roughness: 0.6,
    metalness: 0.1,
  });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  hasMesh.value = true;
  legendRange.value = { min: valueMin, max: valueMax };
}

function animate() {
  animId = requestAnimationFrame(animate);
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function onPointerDown(e: PointerEvent) {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
}
function onPointerMove(e: PointerEvent) {
  if (!isDragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  cam.theta -= dx * 0.008;
  cam.phi = Math.min(Math.max(cam.phi - dy * 0.008, 0.15), Math.PI - 0.15);
  updateCameraPosition();
}
function onPointerUp() {
  isDragging = false;
}
function onWheel(e: WheelEvent) {
  cam.radius = Math.min(Math.max(cam.radius + e.deltaY * 0.002, 1.2), 8);
  updateCameraPosition();
}
function onResize() {
  const canvas = canvasEl.value;
  if (!canvas || !renderer || !camera) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

onMounted(() => {
  const canvas = canvasEl.value;
  if (!canvas) return;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.01, 100);
  updateCameraPosition();

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(2, 3, 2);
  scene.add(dirLight);

  buildMesh();

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('resize', onResize);

  animate();
});

onBeforeUnmount(() => {
  if (animId !== null) cancelAnimationFrame(animId);
  if (mesh) {
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  }
  renderer?.dispose();
  canvasEl.value?.removeEventListener('pointerdown', onPointerDown);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('resize', onResize);
});

// Rebuild the mesh whenever the underlying data changes (new parameter,
// station, or Reading Period selected) — the scene/camera/renderer
// themselves stay alive, only the geometry is swapped.
watch(() => props.columns, buildMesh, { deep: true });
</script>

<style scoped>
.surface3d {
  position: relative;
  width: 100%;
  height: 340px;
}

.surface3d__canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
  touch-action: none;
}

.surface3d__hint {
  position: absolute;
  bottom: 8px;
  right: 10px;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

.surface3d__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.8rem;
  pointer-events: none;
}

.surface3d__legend {
  position: absolute;
  top: 8px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 220px;
  pointer-events: none;
}

.surface3d__legend-label {
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

.surface3d__legend-gradient {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(
    to right,
    rgb(33, 102, 172),
    rgb(103, 169, 207),
    rgb(223, 194, 125),
    rgb(230, 140, 55),
    rgb(178, 24, 43)
  );
}
</style>
