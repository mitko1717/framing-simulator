'use client';

import { useEffect, useRef } from 'react';
import { FramingSimulator } from '@/lib/simulator';
import type { CameraKey, CameraState, Metrics } from '@/lib/types';

interface SimulatorViewportProps {
  state: CameraState;
  lessonIndex: number;
  onChange: (key: CameraKey, value: number) => void;
  onMetrics: (metrics: Metrics) => void;
  onCaptureReady: (capture: () => string | null) => void;
}

export function SimulatorViewport({ state, lessonIndex, onChange, onMetrics, onCaptureReady }: SimulatorViewportProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const sceneCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const simulatorRef = useRef<FramingSimulator | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const sceneCanvas = sceneCanvasRef.current;
    const overlay = overlayRef.current;
    const map = mapRef.current;
    if (!frame || !sceneCanvas || !overlay || !map) return;

    const simulator = new FramingSimulator(sceneCanvas, overlay, map, state);
    simulatorRef.current = simulator;
    const resizeObserver = new ResizeObserver(() => {
      simulator.resize(frame.clientWidth);
      onMetrics(simulator.update(state, lessonIndex));
    });
    resizeObserver.observe(frame);
    onCaptureReady(() => simulatorRef.current?.capture() ?? null);
    simulator.resize(frame.clientWidth);
    onMetrics(simulator.update(state, lessonIndex));

    return () => {
      resizeObserver.disconnect();
      onCaptureReady(() => null);
      simulator.dispose();
      simulatorRef.current = null;
    };
  }, [onCaptureReady, onMetrics]);

  useEffect(() => {
    const simulator = simulatorRef.current;
    if (simulator) onMetrics(simulator.update(state, lessonIndex));
  }, [state, lessonIndex, onMetrics]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const previous = dragRef.current;
    const frame = frameRef.current;
    if (!previous || !frame) return;
    const horizontalDegrees = 2 * (Math.atan(18 / state.f) * 180 / Math.PI);
    const verticalDegrees = 2 * (Math.atan(12 / state.f) * 180 / Math.PI);
    onChange('rot', state.rot - (event.clientX - previous.x) * horizontalDegrees / frame.clientWidth);
    onChange('tilt', state.tilt + (event.clientY - previous.y) * verticalDegrees / frame.clientHeight);
    dragRef.current = { x: event.clientX, y: event.clientY };
  };

  return (
    <div
      aria-label="Interactive 3D camera view. Drag to change rotation and tilt."
      className="simulator-frame"
      onPointerCancel={() => { dragRef.current = null; }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => { dragRef.current = null; }}
      ref={frameRef}
      role="application"
    >
      <canvas className="scene-canvas" ref={sceneCanvasRef} />
      <canvas className="overlay-canvas" ref={overlayRef} />
      <canvas className="mini-map" height={190} ref={mapRef} width={130} />
      <div className="view-hud">{state.f | 0}mm <span>·</span> {state.dist.toFixed(1)} m away <span>·</span> {state.h.toFixed(1)} m high <span>·</span> FOV {(2 * Math.atan(18 / state.f) * 180 / Math.PI).toFixed(0)}°</div>
    </div>
  );
}