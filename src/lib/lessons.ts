import * as THREE from 'three';
import type { CameraState, Lesson, LessonCheck, Point3, ProjectedPoint } from './types';

export const DEFAULT_STATE: CameraState = { dist: 6, h: 1.6, f: 35, rot: 0, tilt: 0, roll: 0 };

export const CAMERA_CONTROLS: [
  keyof CameraState,
  string,
  number,
  number,
  number,
  string,
  number,
][] = [
  ['dist', 'Distance', 1, 14, 0.1, 'm', 0.25],
  ['h', 'Height', 0.2, 8, 0.05, 'm', 0.1],
  ['f', 'Focal length', 14, 200, 1, 'mm', 5],
  ['rot', 'Rotation', -70, 70, 0.5, '°', 1],
  ['tilt', 'Tilt', -50, 50, 0.5, '°', 1],
  ['roll', 'Roll', -30, 30, 0.5, '°', 1],
];

const radians = Math.PI / 180;
const degrees = (value: number) => value / radians;
const subject: Point3 = [0.9, 1.68, 0];
const nearestPowerPoint = (point: ProjectedPoint) => Math.min(...[1 / 3, 2 / 3].flatMap((x) => [1 / 3, 2 / 3].map((y) => Math.hypot(point.sx - x, point.sy - y))));
const inFrame = (point: ProjectedPoint, margin = 0.95) => point.visible && Math.abs(point.x) < margin && Math.abs(point.y) < margin;

const levelHorizon: LessonCheck = [
  'Horizon is level (±1.5°)',
  (metrics) => Math.abs(metrics.roll) < 1.5,
  (metrics) => `${metrics.roll.toFixed(1)}°`,
];

function aim(state: CameraState, point: Point3, x: number, y: number, lockTilt = false): CameraState {
  const target = { ...state, rot: 0, tilt: 0 };
  const camera = new THREE.PerspectiveCamera(50, 1.5, 0.1, 500);
  
  for (let index = 0; index < 90; index += 1) {
    camera.position.set(0, target.h, target.dist);
    camera.rotation.set(target.tilt * radians, -target.rot * radians, target.roll * radians, 'YXZ');
    camera.fov = (2 * Math.atan(12 / target.f)) / radians;
    camera.aspect = 1.5;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    const projected = new THREE.Vector3(...point).project(camera);
    target.rot += (projected.x - x) * degrees(Math.atan(18 / target.f)) * 0.8;
    if (!lockTilt) target.tilt += (projected.y - y) * degrees(Math.atan(12 / target.f)) * 0.8;
  }

  return target;
}

export const LESSONS: Lesson[] = [
  {
    name: 'Level horizon',
    description: 'A tilted horizon looks accidental. Use Roll until the horizon line turns green.',
    initial: { roll: 11, tilt: -3 },
    checks: [levelHorizon],
    solution: (state) => ({ ...state, roll: 0, tilt: -3 }),
  },
  {
    name: 'Horizon on a third',
    description: 'Don’t cut the picture in half. Tilt the camera so the horizon sits on a third line: tilt down = more road, up = more sky.',
    initial: {},
    checks: [
      levelHorizon,
      [
        'Horizon on a third line',
        (metrics) => metrics.horizonPosition > 0.1 && Math.min(Math.abs(metrics.horizonPosition - 1 / 3), Math.abs(metrics.horizonPosition - 2 / 3)) < 0.04,
        (metrics) => `${Math.round(metrics.horizonPosition * 100)}% from top`,
      ],
    ],
    solution: (state) => ({ ...state, rot: 0, roll: 0, tilt: -degrees(Math.atan(12 / state.f / 3)) }),
  },
  {
    name: 'Strong point',
    description: 'Put the head on a power point, where two third-lines cross. Pan with Rotation/Tilt or drag the frame.',
    initial: { rot: -8, tilt: 4 },
    checks: [
      levelHorizon,
      ['Head on a power point', (metrics) => metrics.head.visible && nearestPowerPoint(metrics.head) < 0.06, (metrics) => metrics.head.visible ? `off by ${Math.round(nearestPowerPoint(metrics.head) * 100)}%` : 'not in view'],
    ],
    solution: (state) => aim({ ...state, dist: 5, h: 1.6, f: 50, roll: 0 }, subject, 1 / 3, 1 / 3),
  },
  {
    name: 'Leading lines',
    description: 'Roads pull the eye. Get the vanishing point of the road into the frame, on the centre or a third line, from a low camera.',
    initial: { dist: 10, h: 3.5, tilt: -20 },
    checks: [
      levelHorizon,
      ['Vanishing point in frame', (metrics) => metrics.vanishingPoint.visible && inFrame(metrics.vanishingPoint, 0.8)],
      ['VP on centre or a third', (metrics) => metrics.vanishingPoint.visible && [1 / 3, 0.5, 2 / 3].some((value) => Math.abs(metrics.vanishingPoint.sx - value) < 0.05)],
      ['Camera low (≤ 2.5 m)', (metrics) => metrics.state.h <= 2.5, (metrics) => `${metrics.state.h.toFixed(1)} m`],
    ],
    solution: (state) => aim({ ...state, dist: 9, h: 1, f: 28, roll: 0 }, [0, 0, -5e4], 0, 0.33),
  },
  {
    name: 'Vertical lines',
    description: 'Tilting up makes buildings lean back. Keep Tilt at 0°, step back and go wide until the whole house fits. Turn Rotation toward it.',
    initial: { dist: 8, rot: -25, tilt: 18 },
    checks: [
      levelHorizon,
      ['Camera not tilted (±2°)', (metrics) => Math.abs(metrics.state.tilt) < 2, (metrics) => `${metrics.state.tilt.toFixed(1)}°`],
      ['Whole house in frame', (metrics) => metrics.houseInFrame],
    ],
    solution: (state) => aim({ ...state, dist: 8, h: 1.6, f: 24, roll: 0 }, [-9, 3.5, -12], 0, 0, true),
  },
  {
    name: 'Portrait · 85mm',
    description: 'Wide lenses stretch faces; 85mm flatters. Step back to ≥ 2.2 m, zoom to ~85mm, camera at eye level, head in the upper half.',
    initial: { dist: 1.5, f: 24, h: 1.2 },
    checks: [
      levelHorizon,
      ['Focal length 75–100 mm', (metrics) => metrics.state.f >= 75 && metrics.state.f <= 100, (metrics) => `${metrics.state.f} mm`],
      ['Distance ≥ 2.2 m', (metrics) => metrics.state.dist >= 2.2, (metrics) => `${metrics.state.dist.toFixed(1)} m`],
      ['Eye level (1.3–1.9 m)', (metrics) => metrics.state.h >= 1.3 && metrics.state.h <= 1.9],
      ['Head in upper half of frame', (metrics) => inFrame(metrics.head, 0.8) && metrics.head.y > 0.05],
    ],
    solution: (state) => aim({ ...state, dist: 3, h: 1.6, f: 85, roll: 0 }, subject, 1 / 3, 0.3),
  },
  {
    name: 'Low angle',
    description: 'Shoot from knee height looking up: the subject towers against the sky. Keep the horizon below the head.',
    initial: {},
    checks: [
      ['Not tilted sideways', (metrics) => Math.abs(metrics.roll) < 3],
      ['Camera low (< 0.8 m)', (metrics) => metrics.state.h < 0.8, (metrics) => `${metrics.state.h.toFixed(2)} m`],
      ['Looking up (> 6°)', (metrics) => metrics.state.tilt > 6, (metrics) => `${metrics.state.tilt.toFixed(0)}°`],
      ['Head in frame, above horizon', (metrics) => inFrame(metrics.head, 0.9) && metrics.head.y > metrics.horizonY(metrics.head.x)],
    ],
    solution: (state) => aim({ ...state, dist: 4, h: 0.4, f: 28, roll: 0 }, subject, 0, 0.3),
  },
  {
    name: 'Free shooting',
    description: 'Combine everything and take your best shot. Compare it with earlier shots in the feed.',
    initial: { roll: 4, rot: 6 },
    checks: [
      levelHorizon,
      ['Head on a power point, or horizon on a third', (metrics) => (metrics.head.visible && nearestPowerPoint(metrics.head) < 0.07) || (metrics.horizonPosition > 0.1 && metrics.horizonPosition < 0.9 && Math.min(Math.abs(metrics.horizonPosition - 1 / 3), Math.abs(metrics.horizonPosition - 2 / 3)) < 0.04)],
      ['Whole person in frame', (metrics) => inFrame(metrics.head) && inFrame(metrics.feet)],
    ],
  },
];