import * as THREE from 'three';
import JSZip from 'jszip';
import { kml } from '@tmcw/togeojson';
import Delaunator from 'delaunator';

export async function parseKMZ(file: File) {
  let kmlText = '';

  if (file.name.toLowerCase().endsWith('.kmz')) {
    const zip = await JSZip.loadAsync(file);
    // Find the kml file inside
    let kmlFile = null;
    for (const [filename, fileObj] of Object.entries(zip.files)) {
      if (filename.toLowerCase().endsWith('.kml')) {
        kmlFile = fileObj;
        break;
      }
    }
    if (!kmlFile) throw new Error('No KML file found inside the KMZ archive.');
    kmlText = await kmlFile.async('text');
  } else if (file.name.toLowerCase().endsWith('.kml')) {
    kmlText = await file.text();
  } else {
    throw new Error('Unsupported file type. Please upload a .kml or .kmz file.');
  }

  // Parse KML to GeoJSON
  const parser = new DOMParser();
  const xml = parser.parseFromString(kmlText, 'text/xml');
  const geojson = kml(xml);

  // Extract all coordinates with Z
  const points: { x: number; y: number; z: number }[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function extractCoords(coords: any[]) {
    if (coords.length === 0) return;
    if (typeof coords[0] === 'number') {
      if (coords.length >= 3) {
        points.push({ x: coords[0], y: coords[1], z: coords[2] });
      } else {
        // If no Z, assume 0
        points.push({ x: coords[0], y: coords[1], z: 0 });
      }
    } else {
      for (const c of coords) extractCoords(c);
    }
  }

  for (const feature of geojson.features) {
    if (feature.geometry) {
      if (feature.geometry.type === 'GeometryCollection') {
         for(const geom of feature.geometry.geometries) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             extractCoords((geom as any).coordinates);
         }
      } else {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         extractCoords((feature.geometry as any).coordinates);
      }
    }
  }

  if (points.length < 3) {
    throw new Error('Not enough 3D points found in the file to create a surface.');
  }

  return points;
}

export function buildGeometryFromPoints(points: { x: number; y: number; z: number }[]) {
  // Normalize coordinates to fit in a 1.6 x 1.6 box (similar to the lake scale)
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const rangeZ = maxZ - minZ || 1;
  
  // Scale X and Y so the maximum dimension is 1.6
  const scale = 1.6 / Math.max(rangeX, rangeY);

  const flatPoints: number[][] = [];
  const normalizedPoints = points.map(p => {
    const nx = (p.x - minX - rangeX / 2) * scale;
    const ny = (p.y - minY - rangeY / 2) * scale;
    // We want the surface on XZ plane, so Y becomes Z in 3D
    flatPoints.push([nx, ny]);
    return { nx, ny, origZ: p.z };
  });

  // Triangulate
  const delaunay = Delaunator.from(flatPoints);
  
  // Build BufferGeometry
  const geometry = new THREE.BufferGeometry();
  
  // Each triangle has 3 vertices, each vertex has x, y, z
  const vertices = new Float32Array(delaunay.triangles.length * 3);
  const colors = new Float32Array(delaunay.triangles.length * 3);
  const origZs = new Float32Array(delaunay.triangles.length);

  // Depth-based color mapping (blue gradient: light to dark)
  // minZ = lightest blue, maxZ = darkest blue
  // Wait, if it's bathymetry (depth), Garmin might record negative or positive depth.
  // We'll map Z linearly.
  const colorScale = (val: number): [number, number, number] => {
    const t = (val - minZ) / rangeZ; 
    // Light blue to dark blue
    // Light blue: #E3F2FD (227, 242, 253)
    // Dark blue: #0D47A1 (13, 71, 161)
    
    // To match typical depth maps: high elevation/shallow is light, deep is dark.
    // Let's assume lower Z means deeper.
    // If Z is depth (larger positive = deeper), then it might be reversed.
    // We'll just map t=0 to dark blue and t=1 to light blue
    const r = 13 + (227 - 13) * t;
    const g = 71 + (242 - 71) * t;
    const b = 161 + (253 - 161) * t;
    return [r / 255, g / 255, b / 255];
  };

  const VERTICAL_EXAGGERATION = 0.45;

  for (let i = 0; i < delaunay.triangles.length; i++) {
    const ptIdx = delaunay.triangles[i] as number;
    const pt = normalizedPoints[ptIdx];
    
    // Three.js coordinates: x=nx, y=Z value (up), z=-ny
    vertices[i * 3] = pt.nx;
    // Normalize Z for visualization
    const normZ = (pt.origZ - minZ) / rangeZ;
    vertices[i * 3 + 1] = normZ * VERTICAL_EXAGGERATION; 
    vertices[i * 3 + 2] = -pt.ny; // flip Y for 3D Z axis

    const [r, g, b] = colorScale(pt.origZ);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
    
    origZs[i] = pt.origZ;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('origZ', new THREE.BufferAttribute(origZs, 1));
  geometry.computeVertexNormals();

  return { geometry, minZ, maxZ, colorScale };
}
