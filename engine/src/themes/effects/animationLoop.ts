import { isAnimationPaused } from './canvasLayer';

const DEFAULT_FIRST_FRAME_MS = 16;

// calls draw on animation frames, skipping frames that come sooner than minIntervalMs; returns a function that stops the loop
export function startFrameLoop(draw: (elapsedMs: number) => void, minIntervalMs = 0): () => void {
  let frameId = 0;
  let last = 0;

  // schedule the next frame first so the loop keeps running even when this frame is skipped
  const tick = (timestamp: number): void => {
    frameId = requestAnimationFrame(tick);
    const elapsed = last === 0 ? DEFAULT_FIRST_FRAME_MS : timestamp - last;

    if (last !== 0 && elapsed < minIntervalMs) return;

    last = timestamp;
    draw(elapsed);
  };

  frameId = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(frameId);
}

// wraps a theme's setup function (which returns its teardown) into start/stop functions; start does nothing while animations are paused
export function createAnimationToggle(setUp: () => () => void): { start: () => void; stop: () => void } {
  // the closure keeps the current teardown function private to this theme, so start and stop can share it
  let tearDown: (() => void) | null = null;

  const stop = (): void => {
    tearDown?.();
    tearDown = null;
  };

  const start = (): void => {
    if (isAnimationPaused()) return;
    stop();
    tearDown = setUp();
  };

  return { start, stop };
}
