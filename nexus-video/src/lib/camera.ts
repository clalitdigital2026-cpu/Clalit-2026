/**
 * Minimal perspective camera for Canvas2D scenes. World units ≈ pixels at z = focal.
 */
export type Vec3 = {x: number; y: number; z: number};
export type Camera = {
  x: number;
  y: number;
  z: number;
  yaw?: number; // rotation around Y (radians)
  pitch?: number; // rotation around X
  roll?: number; // rotation around Z
  focal?: number;
  cx?: number;
  cy?: number;
};

export type Projected = {x: number; y: number; s: number; z: number};

export const project = (p: Vec3, cam: Camera, near = 20): Projected | null => {
  let x = p.x - cam.x;
  let y = p.y - cam.y;
  let z = p.z - cam.z;
  const yaw = cam.yaw ?? 0;
  const pitch = cam.pitch ?? 0;
  const roll = cam.roll ?? 0;
  if (yaw) {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const nx = x * c - z * s;
    z = x * s + z * c;
    x = nx;
  }
  if (pitch) {
    const c = Math.cos(pitch);
    const s = Math.sin(pitch);
    const ny = y * c - z * s;
    z = y * s + z * c;
    y = ny;
  }
  if (roll) {
    const c = Math.cos(roll);
    const s = Math.sin(roll);
    const nx = x * c - y * s;
    y = x * s + y * c;
    x = nx;
  }
  if (z < near) return null;
  const f = cam.focal ?? 1000;
  const s = f / z;
  return {x: (cam.cx ?? 960) + x * s, y: (cam.cy ?? 540) + y * s, s, z};
};

/** Fog factor: 1 near, 0 far. */
export const fog = (z: number, start: number, end: number) => {
  if (z <= start) return 1;
  if (z >= end) return 0;
  return 1 - (z - start) / (end - start);
};
