import { PAUSED_CLASS } from '../../shared/constants';

const DEFAULT_FIRST_FRAME_MS = 16;

export type CanvasLayer = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  remove: () => void;
};

// true while the user has paused page animations
export function isAnimationPaused(): boolean {
  return document.documentElement.classList.contains(PAUSED_CLASS);
}

// adds a full-window canvas that follows window resizes; onResize lets a theme rebuild state tied to the size
export function createCanvasLayer(css: string, onResize: (canvas: HTMLCanvasElement) => void = () => {}): CanvasLayer {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;${css}`;
  document.body.appendChild(canvas);

  const resize = (): void => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    onResize(canvas);
  };

  resize();
  window.addEventListener('resize', resize);

  const remove = (): void => {
    window.removeEventListener('resize', resize);
    canvas.remove();
  };

  return { canvas, ctx: canvas.getContext('2d')!, remove };
}

// calls draw on animation frames, skipping frames that come sooner than minIntervalMs; returns a function that stops the loop
export function startFrameLoop(draw: (elapsedMs: number) => void, minIntervalMs = 0): () => void {
  let frameId = 0;
  let last = 0;

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
