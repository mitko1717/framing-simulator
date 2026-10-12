export type CameraKey = 'dist' | 'h' | 'f' | 'rot' | 'tilt' | 'roll';
export type CameraState = Record<CameraKey, number>;
export type Point3 = [number, number, number];

export interface ProjectedPoint {
  x: number;
  y: number;
  sx: number;
  sy: number;
  visible: boolean;
}

export interface Metrics {
  state: CameraState;
  roll: number;
  horizonY: (x: number) => number;
  horizonPosition: number;
  head: ProjectedPoint;
  feet: ProjectedPoint;
  vanishingPoint: ProjectedPoint;
  houseInFrame: boolean;
}

export type LessonCheck = [
  string,
  (metrics: Metrics) => boolean,
  ((metrics: Metrics) => string)?,
];

export interface Lesson {
  name: string;
  description: string;
  initial: Partial<CameraState>;
  checks: LessonCheck[];
  solution?: (state: CameraState) => CameraState;
}