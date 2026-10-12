import * as THREE from 'three';
import type { CameraState, Metrics, ProjectedPoint } from './types';

const radians = Math.PI / 180;
const degrees = (value: number) => value / radians;

export class FramingSimulator {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(50, 1.5, 0.1, 500);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly overlayContext: CanvasRenderingContext2D;
  private readonly mapContext: CanvasRenderingContext2D;
  private readonly subjectGroup = new THREE.Group();
  private state: CameraState;

  constructor(
    canvas: HTMLCanvasElement,
    overlay: HTMLCanvasElement,
    map: HTMLCanvasElement,
    initialState: CameraState,
  ) {
    const overlayContext = overlay.getContext('2d');
    const mapContext = map.getContext('2d');
    if (!overlayContext || !mapContext) throw new Error('Canvas 2D rendering is unavailable.');
    this.overlayContext = overlayContext;
    this.mapContext = mapContext;
    this.state = initialState;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.createScene();
  }

  resize(width: number) {
    const safeWidth = Math.max(1, width);
    this.renderer.setSize(safeWidth, safeWidth / 1.5, false);
    this.overlayContext.canvas.width = safeWidth;
    this.overlayContext.canvas.height = safeWidth / 1.5;
  }

  update(state: CameraState, lessonIndex: number): Metrics {
    this.state = state;
    const metrics = this.measure(state);
    this.renderer.render(this.scene, this.camera);
    this.drawOverlay(metrics, lessonIndex);
    this.drawMap(state);
    return metrics;
  }

  capture() {
    return this.renderer.domElement.toDataURL('image/jpeg', 0.8);
  }

  dispose() {
    this.renderer.dispose();
  }

  private createScene() {
    this.scene.background = new THREE.Color(0xa9d1f0);
    this.scene.fog = new THREE.Fog(0xcfe6f5, 50, 200);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x6b8f5a, 0.95));
    const sunlight = new THREE.DirectionalLight(0xfff2d6, 0.8);
    sunlight.position.set(-20, 30, 25);
    this.scene.add(sunlight);

    this.addBox(500, 0.1, 500, 0x6aa860, 0, -0.05, 0);
    this.addBox(6, 0.1, 320, 0x4a4d52, 0, 0, -130);
    this.addBox(1.6, 0.12, 320, 0xb8b8b0, -3.8, 0.03, -130);
    this.addBox(1.6, 0.12, 320, 0xb8b8b0, 3.8, 0.03, -130);
    for (let z = 14; z > -170; z -= 6) this.addBox(0.2, 0.02, 2.5, 0xffffff, 0, 0.07, z);

    this.addBox(8, 5.5, 6, 0xe8d9b8, -9, 2.75, -12);
    this.addBox(1.2, 2.4, 0.1, 0x6b3f26, -9, 1.2, -8.95);
    for (const [x, y] of [[-11.6, 3], [-6.4, 3], [-11.6, 1.2], [-6.4, 1.2]]) {
      this.addBox(1.4, 1.4, 0.1, 0x9fd0ee, x, y, -8.95);
    }

    const roof = new THREE.Group();
    const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(1, 1.7, 4), this.material(0x9b4a35));
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.position.y = 0.85;
    roof.add(roofMesh);
    roof.scale.set(6.2, 1, 4.67);
    roof.position.set(-9, 5.5, -12);
    this.scene.add(roof);

    const trees: [number, number][] = [
      [-7, -3], [-6, -22], [-8, -40], [-14, -28], [7, -6], [8, -20], [9, -34], [7, -52], [-7, -60], [12, -12],
    ];

    for (const [x, z] of trees) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 2, 8), this.material(0x6b4a2b));
      trunk.position.set(x, 1, z);
      this.scene.add(trunk);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4.5, 10), this.material(0x2f7a45));
      crown.position.set(x, 4.2, z);
      this.scene.add(crown);
    }

    this.subjectGroup.position.set(0.9, 0, 0);
    this.scene.add(this.subjectGroup);
    this.addCylinder(0.08, 0.85, 0x2f3e5a, 0.43, -0.1);
    this.addCylinder(0.08, 0.85, 0x2f3e5a, 0.43, 0.1);
    this.addCylinder(0.2, 0.65, 0xc0392b, 1.18, 0);
    this.addCylinder(0.05, 0.6, 0xc0392b, 1.15, -0.27);
    this.addCylinder(0.05, 0.6, 0xc0392b, 1.15, 0.27);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), this.material(0xf0c8a0));
    head.position.y = 1.68;
    this.subjectGroup.add(head);

    for (const x of [-0.045, 0.045]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), this.material(0x222222));
      eye.position.set(x, 1.7, 0.12);
      this.subjectGroup.add(eye);
    }
  }

  private material(color: number) {
    return new THREE.MeshLambertMaterial({ color });
  }

  private addBox(width: number, height: number, depth: number, color: number, x: number, y: number, z: number) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), this.material(color));
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    return mesh;
  }

  private addCylinder(radius: number, height: number, color: number, y: number, x: number) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 12), this.material(color));
    mesh.position.set(x, y, 0);
    this.subjectGroup.add(mesh);
  }

  private pose(state: CameraState) {
    this.camera.position.set(0, state.h, state.dist);
    this.camera.rotation.set(state.tilt * radians, -state.rot * radians, state.roll * radians, 'YXZ');
    this.camera.fov = (2 * Math.atan(12 / state.f)) / radians;
    this.camera.aspect = 1.5;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld(true);
  }

  private project(x: number, y: number, z: number): ProjectedPoint {
    const point = new THREE.Vector3(x, y, z);
    const cameraPoint = point.clone().applyMatrix4(this.camera.matrixWorldInverse);
    const projected = point.project(this.camera);

    return {
      x: projected.x,
      y: projected.y,
      sx: (projected.x + 1) / 2,
      sy: (1 - projected.y) / 2,
      visible: cameraPoint.z < 0,
    };
  }

  private measure(state: CameraState): Metrics {
    this.pose(state);
    const tangentY = Math.tan((this.camera.fov * radians) / 2);
    const tangentX = tangentY * 1.5;
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion.clone().invert());
    const horizonY = (x: number) => (up.z - up.x * tangentX * x) / (up.y * tangentY);
    const houseCorners = [-4.6, -13.4].flatMap((x) =>
      [0, 7.2].flatMap((y) => [-8.7, -15.3].map((z) => this.project(x, y, z))),
    );
    
    return {
      state,
      roll: degrees(Math.atan2(up.x, up.y)),
      horizonY,
      horizonPosition: (1 - horizonY(0)) / 2,
      head: this.project(0.9, 1.68, 0),
      feet: this.project(0.9, 0.05, 0),
      vanishingPoint: this.project(0, 0, -5e4),
      houseInFrame: houseCorners.every((point) => point.visible && Math.abs(point.x) < 0.97 && Math.abs(point.y) < 0.97),
    };
  }

  private drawOverlay(metrics: Metrics, lessonIndex: number) {
    const context = this.overlayContext;
    const width = context.canvas.width;
    const height = context.canvas.height;
    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;
    context.strokeStyle = '#ffffff99';
    context.beginPath();
    for (const third of [1 / 3, 2 / 3]) {
      context.moveTo(width * third, 0);
      context.lineTo(width * third, height);
      context.moveTo(0, height * third);
      context.lineTo(width, height * third);
    }
    context.stroke();

    context.strokeStyle = Math.abs(metrics.roll) < 1.5 ? '#3ddc84' : '#ffb020';
    context.lineWidth = 2;
    context.setLineDash([8, 6]);
    context.beginPath();
    context.moveTo(0, ((1 - metrics.horizonY(-1)) / 2) * height);
    context.lineTo(width, ((1 - metrics.horizonY(1)) / 2) * height);
    context.stroke();
    context.setLineDash([]);

    if ([2, 7].includes(lessonIndex)) {
      context.fillStyle = '#ffffffcc';
      for (const x of [1 / 3, 2 / 3]) {
        for (const y of [1 / 3, 2 / 3]) {
          context.beginPath();
          context.arc(width * x, height * y, 5, 0, Math.PI * 2);
          context.fill();
        }
      }
    }
    if ([2, 5, 6, 7].includes(lessonIndex)) this.drawPoint(metrics.head, '#ff5a5a', width, height);
    if (lessonIndex === 3) this.drawPoint(metrics.vanishingPoint, '#3ddc84', width, height);
  }

  private drawPoint(point: ProjectedPoint, color: string, width: number, height: number) {
    if (!point.visible) return;
    const context = this.overlayContext;
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(point.sx * width, point.sy * height, 9, 0, Math.PI * 2);
    context.stroke();
  }

  private drawMap(state: CameraState) {
    const context = this.mapContext;
    const scale = 4.6;
    const mapX = (x: number) => (x + 18) * scale;
    const mapZ = (z: number) => (z + 26) * scale;
    context.fillStyle = '#5f9a55';
    context.fillRect(0, 0, 130, 190);
    context.fillStyle = '#555';
    context.fillRect(mapX(-3), 0, 6 * scale, 190);
    context.fillStyle = '#d9c9a3';
    context.fillRect(mapX(-13), mapZ(-15), 8 * scale, 6 * scale);
    context.fillStyle = '#e0452b';
    context.beginPath();
    context.arc(mapX(0.9), mapZ(0), 3.5, 0, Math.PI * 2);
    context.fill();

    const angle = Math.atan2(-Math.cos(-state.rot * radians), -Math.sin(-state.rot * radians));
    const halfFov = Math.atan(18 / state.f);
    const centerX = mapX(0);
    const centerY = mapZ(state.dist);
    context.fillStyle = '#ffdc3c66';
    context.strokeStyle = '#ffdc3c';
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, 70, angle - halfFov, angle + halfFov);
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = '#fff';
    context.beginPath();
    context.arc(centerX, centerY, 3, 0, Math.PI * 2);
    context.fill();
  }
}