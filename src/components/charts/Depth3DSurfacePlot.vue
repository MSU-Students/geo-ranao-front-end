<template>
  <div class="surface3d">
    <canvas ref="canvasEl" class="surface3d__canvas" @wheel.prevent="onWheel" />
    <!-- CSS2DRenderer's output lands in here — axis tick labels (months,
         depths, value range) that track the 3D grid as you rotate/zoom. -->
    <div ref="labelLayerEl" class="surface3d__label-layer" />
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

    <!-- Legend: height AND color both map to this same value range — the
         wireframe box's floor grid lines up with the Time/Depth axis labels
         (rendered in the label layer above), the vertical corner posts with
         the value ticks at their base/top. -->
    <div v-if="hasMesh && legendRange" class="surface3d__legend">
      <span class="surface3d__legend-caption">Height &amp; color:</span>
      <span class="surface3d__legend-label">{{ legendRange.min.toFixed(decimals) }}{{ unit }}</span>
      <div class="surface3d__legend-gradient" />
      <span class="surface3d__legend-label">{{ legendRange.max.toFixed(decimals) }}{{ unit }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

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
const labelLayerEl = ref<HTMLDivElement | null>(null);
const hasMesh = ref(false);
const legendRange = ref<{ min: number; max: number } | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let labelRenderer: CSS2DRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let mesh: THREE.Mesh | null = null;
let axesLines: THREE.LineSegments | null = null;
let labelObjects: CSS2DObject[] = [];
let animId: number | null = null;

let isDragging = false;
let lastX = 0;
let lastY = 0;
// Pulled back slightly further (radius 3.2 -> 3.6) than a bare mesh needs,
// so the axis labels — which sit just outside the wireframe box — have room
// to breathe instead of clipping against the canvas edge.
const cam = { phi: 1.05, theta: 0.75, radius: 3.6 };

// Grid footprint shared between the mesh and the reference box/labels built
// around it — kept at module scope (rather than local to buildMesh) so
// buildAxes can reuse the exact same coordinate math.
const SCALE_XZ = 2.4;
const SCALE_Y = 0.7;

function depthLabel(d: number): string {
  return d === 0 ? 'Surface' : `${d}m`;
}

// Thins a long list of tick positions down to at most maxTicks, always
// keeping the first and last — avoids 9 overlapping depth labels or 12
// overlapping month labels crowding the same small box edge.
function pickTickIndices(length: number, maxTicks: number): number[] {
  if (length <= 0) return [];
  if (length <= maxTicks) return Array.from({ length }, (_, i) => i);
  const picked = new Set<number>();
  for (let i = 0; i < maxTicks; i++) {
    picked.add(Math.round((i * (length - 1)) / (maxTicks - 1)));
  }
  return [...picked].sort((a, b) => a - b);
}

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
  clearAxes();
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
  buildAxes(cols, allDepths, depthMax, valueMin, valueMax);
}

// Wireframe reference box + tick labels around the mesh — without this the
// surface is just a colored blob floating in empty space with no way to
// tell which direction is time, which is depth, or what the axis values
// actually are. The floor grid lines land exactly on each month column and
// depth row (same xFor/zFor math buildMesh uses), so every tick label lines
// up with real data, not an arbitrary ruler.
function addLabel(text: string, x: number, y: number, z: number, className: string) {
  if (!scene) return;
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  const obj = new CSS2DObject(el);
  obj.position.set(x, y, z);
  scene.add(obj);
  labelObjects.push(obj);
}

function clearAxes() {
  if (axesLines) {
    scene?.remove(axesLines);
    axesLines.geometry.dispose();
    (axesLines.material as THREE.Material).dispose();
    axesLines = null;
  }
  labelObjects.forEach((obj) => {
    scene?.remove(obj);
    obj.element.remove();
  });
  labelObjects = [];
}

function buildAxes(
  cols: Surface3DColumn[],
  depths: number[],
  depthMax: number,
  valueMin: number,
  valueMax: number,
) {
  if (!scene) return;

  const xMin = -SCALE_XZ / 2;
  const xMax = SCALE_XZ / 2;
  const zMin = 0;
  const zMax = SCALE_XZ * 0.6;
  const xFor = (ci: number) => (ci / Math.max(cols.length - 1, 1) - 0.5) * SCALE_XZ;
  const zFor = (depth: number) => (depth / depthMax) * SCALE_XZ * 0.6;

  // Floor border + a vertical post at each corner (an open box, no ceiling,
  // so it frames the surface without hiding it), plus a floor gridline at
  // every actual month column and depth row.
  const linePositions: number[] = [];
  const addLine = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
    linePositions.push(x1, y1, z1, x2, y2, z2);
  };
  addLine(xMin, 0, zMin, xMax, 0, zMin);
  addLine(xMax, 0, zMin, xMax, 0, zMax);
  addLine(xMax, 0, zMax, xMin, 0, zMax);
  addLine(xMin, 0, zMax, xMin, 0, zMin);
  addLine(xMin, 0, zMin, xMin, SCALE_Y, zMin);
  addLine(xMax, 0, zMin, xMax, SCALE_Y, zMin);
  addLine(xMax, 0, zMax, xMax, SCALE_Y, zMax);
  addLine(xMin, 0, zMax, xMin, SCALE_Y, zMax);
  cols.forEach((_, ci) => addLine(xFor(ci), 0, zMin, xFor(ci), 0, zMax));
  depths.forEach((d) => addLine(xMin, 0, zFor(d), xMax, 0, zFor(d)));

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 });
  axesLines = new THREE.LineSegments(geometry, material);
  scene.add(axesLines);

  // Time (month) ticks along the front edge, thinned to avoid overlap.
  pickTickIndices(cols.length, 6).forEach((ci) => {
    addLabel(cols[ci]!.month, xFor(ci), 0, zMin, 'surface3d-tick surface3d-tick--time');
  });
  addLabel('TIME →', xMax + 0.22, 0, zMin, 'surface3d-axis-title');

  // Depth ticks along the left edge — Surface at the front, deepest at back.
  pickTickIndices(depths.length, 6).forEach((di) => {
    const d = depths[di]!;
    addLabel(depthLabel(d), xMin, 0, zFor(d), 'surface3d-tick surface3d-tick--depth');
  });
  addLabel('DEPTH ↓', xMin, 0, zMax + 0.22, 'surface3d-axis-title');

  // Value ticks running up the back-right corner post — reinforces that
  // height means the same thing the color legend already shows.
  addLabel(`${valueMin.toFixed(props.decimals)}${props.unit}`, xMax, 0, zMax, 'surface3d-tick surface3d-tick--value');
  addLabel(`${valueMax.toFixed(props.decimals)}${props.unit}`, xMax, SCALE_Y, zMax, 'surface3d-tick surface3d-tick--value');
}

function animate() {
  animId = requestAnimationFrame(animate);
  if (renderer && scene && camera) renderer.render(scene, camera);
  if (labelRenderer && scene && camera) labelRenderer.render(scene, camera);
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
  labelRenderer?.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

onMounted(() => {
  const canvas = canvasEl.value;
  if (!canvas) return;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  labelLayerEl.value?.appendChild(labelRenderer.domElement);

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
  clearAxes();
  if (mesh) {
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  }
  renderer?.dispose();
  labelRenderer?.domElement.remove();
  labelRenderer = null;
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

.surface3d__label-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
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
  max-width: 260px;
  pointer-events: none;
}

.surface3d__legend-caption {
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
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

<!-- Not scoped, deliberately: these tick/title elements are created
     imperatively via document.createElement for Three.js's CSS2DRenderer,
     so they never receive the scoped data-v-* attribute Vue stamps on
     template-rendered nodes — a scoped rule would silently never match them. -->
<style>
.surface3d-tick {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.88);
  background: rgba(15, 15, 15, 0.62);
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;
  font-family: Roboto, sans-serif;
}
.surface3d-tick--time {
  color: #90caf9;
}
.surface3d-tick--depth {
  color: #ffcc80;
}
.surface3d-tick--value {
  color: rgba(255, 255, 255, 0.95);
}
.surface3d-axis-title {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  background: rgba(38, 166, 154, 0.6);
  padding: 2px 7px;
  border-radius: 4px;
  white-space: nowrap;
  font-family: Roboto, sans-serif;
}
</style>
