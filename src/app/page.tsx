'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraControls } from '@/components/camera-controls';
import { LessonNavigation } from '@/components/lesson-navigation';
import { LessonPanel } from '@/components/lesson-panel';
import { ShotFeed, type Shot } from '@/components/shot-feed';
import { SimulatorViewport } from '@/components/simulator-viewport';
import { DEFAULT_STATE, LESSONS } from '@/lib/lessons';
import type { CameraKey, CameraState, Metrics } from '@/lib/types';

const radiansToDegrees = (value: number) => value * 180 / Math.PI;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export default function HomePage() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [camera, setCamera] = useState<CameraState>({ ...DEFAULT_STATE, ...LESSONS[0].initial });
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(() => new Set());
  const [shots, setShots] = useState<Shot[]>([]);
  const captureRef = useRef<(() => string | null) | null>(null);
  const animationRef = useRef<number | null>(null);

  const handleMetrics = useCallback((nextMetrics: Metrics) => setMetrics(nextMetrics), []);
  const handleCaptureReady = useCallback((capture: () => string | null) => {
    captureRef.current = capture;
  }, []);

  const updateCamera = useCallback((key: CameraKey, value: number) => {
    const setting = {
      dist: [1, 14], h: [0.2, 8], f: [14, 200],
      rot: [-70, 70], tilt: [-50, 50], roll: [-30, 30],
    }[key];
    setCamera((current) => ({ ...current, [key]: clamp(value, setting[0], setting[1]) }));
  }, []);

  const loadLesson = useCallback((index: number) => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    const nextIndex = clamp(index, 0, LESSONS.length - 1);
    setLessonIndex(nextIndex);
    setCamera({ ...DEFAULT_STATE, ...LESSONS[nextIndex].initial });
  }, []);

  const showSolution = useCallback(() => {
    const solution = LESSONS[lessonIndex].solution;
    if (!solution) return;
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    const start = { ...camera };
    const target = solution(camera);
    const startedAt = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 800);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - ((-2 * progress + 2) ** 2) / 2;
      setCamera(Object.fromEntries(
        (Object.keys(start) as CameraKey[]).map((key) => [key, start[key] + (target[key] - start[key]) * eased]),
      ) as CameraState);
      if (progress < 1) animationRef.current = requestAnimationFrame(animate);
      else animationRef.current = null;
    };
    animationRef.current = requestAnimationFrame(animate);
  }, [camera, lessonIndex]);

  useEffect(() => {
    if (!metrics) return;
    const lesson = LESSONS[lessonIndex];
    if (lesson.checks.every(([, check]) => check(metrics))) {
      setCompleted((current) => {
        if (current.has(lessonIndex)) return current;
        const next = new Set(current);
        next.add(lessonIndex);
        return next;
      });
    }
  }, [lessonIndex, metrics]);

  useEffect(() => () => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
  }, []);

  const captureShot = () => {
    const image = captureRef.current?.();
    const currentMetrics = metrics;
    if (!image || !currentMetrics) return;
    const checks = LESSONS[lessonIndex].checks;
    const score = Math.round(checks.filter(([, check]) => check(currentMetrics)).length * 100 / checks.length);
    setShots((current) => [{ image, lesson: lessonIndex + 1, score }, ...current]);
  };

  const resetLesson = () => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    setCamera({ ...DEFAULT_STATE, ...LESSONS[lessonIndex].initial });
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <a aria-label="Framing Simulator home" className="brand" href="/">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span><strong>FRAME</strong><small>CAMERA SCHOOL</small></span>
        </a>
        <p className="header-note">LEARN BY LOOKING</p>
      </header>

      <LessonNavigation lessons={LESSONS} current={lessonIndex} completed={completed} onSelect={loadLesson} />

      <LessonPanel
        lesson={LESSONS[lessonIndex]}
        lessonNumber={lessonIndex + 1}
        metrics={metrics}
        onNext={() => loadLesson(lessonIndex + 1)}
      />

      <div className="workspace">
        <section className="view-column" aria-label="Camera framing workspace">
          <SimulatorViewport
            state={camera}
            lessonIndex={lessonIndex}
            onChange={updateCamera}
            onMetrics={handleMetrics}
            onCaptureReady={handleCaptureReady}
          />
          <div className="action-bar">
            <button className="solution-action" disabled={!LESSONS[lessonIndex].solution} onClick={showSolution} type="button">
              <span aria-hidden="true">✳</span> Show solution
            </button>
            <button className="reset-action" onClick={resetLesson} type="button"><span aria-hidden="true">↺</span> Reset</button>
            <button className="shutter-action" onClick={captureShot} type="button"><span className="shutter-icon" aria-hidden="true" /> Shutter</button>
          </div>
        </section>
        <CameraControls state={camera} onChange={updateCamera} />
      </div>

      <ShotFeed shots={shots} />
      <footer className="page-footer">
        <span>COMPOSITION IS A CHOICE</span>
        <span>FRAME / 01—08</span>
      </footer>
    </main>
  );
}