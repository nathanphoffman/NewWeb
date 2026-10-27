import { createAnimationToggle, createCanvasLayer, startFrameLoop } from './canvasLayer';

const STREAK_LENGTH = 90;     // px total length of gleam
const SEGMENT_COUNT = 24;     // segments (keeps corners clean)
const SPEED = 0.000022;       // perimeter-fraction per ms (~45s per loop at 3000px perim)
const GLOW_WIDTH = 10;
const CORE_WIDTH = 2;
const GLOW_BLUR = 22;
const CORE_BASE_BLUR = 8;
const CORE_EXTRA_BLUR = 14;

type Point = { x: number; y: number };

// finds the point d pixels along the outline of rect, walking clockwise from the top-left corner
function pointOnPerimeter(distance: number, perimeter: number, rect: DOMRect): Point {
  const item = ((distance % perimeter) + perimeter) % perimeter;
  const { left, right, top, bottom, width, height } = rect;

  if (item < width) return { x: left + item, y: top };

  if (item < width + height) return { x: right + 1, y: top + (item - width) };

  if (item < 2 * width + height) return { x: right - (item - width - height), y: bottom };

  return { x: left, y: bottom - (item - 2 * width - height) };
}

// Pink (#ff71ce) at leading edge, white-pink at center, purple (#b967ff) trailing.
// Lerp pink→purple along f, then brighten toward white at bell peak.
function segmentColor(f: number, bell: number): string {
  const green = Math.min(255, Math.round((113 - 10 * f) + bell * 120));
  const blue = Math.min(255, Math.round((206 + 49 * f) + bell * 45));

  return `255,${green},${blue}`;
}

// strokes one straight piece of the gleam with its own width, color and glow
function strokeSegment(context: CanvasRenderingContext2D, from: Point, to: Point, style: { width: number; color: string; glow: string; blur: number }): void {
  context.lineWidth = style.width;
  context.strokeStyle = style.color;
  context.shadowColor = style.glow;
  context.shadowBlur = style.blur;
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
}

// draws the streak as many small segments, each with a wide faint glow under a bright core
function drawStreak(context: CanvasRenderingContext2D, rect: DOMRect, position: number): void {
  const perimeter = 2 * (rect.width + rect.height);
  const segmentLength = STREAK_LENGTH / SEGMENT_COUNT;

  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const f = i / (SEGMENT_COUNT - 1);       // 0 → 1 along the streak
    const bell = Math.sin(f * Math.PI);      // 0 at edges, 1 at center
    const from = pointOnPerimeter(position - STREAK_LENGTH / 2 + i * segmentLength, perimeter, rect);
    const to = pointOnPerimeter(position - STREAK_LENGTH / 2 + (i + 1) * segmentLength, perimeter, rect);
    const rgb = segmentColor(f, bell);

    strokeSegment(context, from, to, {
      width: GLOW_WIDTH,
      color: `rgba(${rgb},${(bell * 0.12).toFixed(2)})`,
      glow: `rgba(255,80,200,${(bell * 0.6).toFixed(2)})`,
      blur: GLOW_BLUR,
    });

    strokeSegment(context, from, to, {
      width: CORE_WIDTH,
      color: `rgba(${rgb},${(bell * 0.95).toFixed(2)})`,
      glow: `rgba(255,100,220,${(bell * 0.9).toFixed(2)})`,
      blur: CORE_BASE_BLUR + bell * CORE_EXTRA_BLUR,
    });
  }
}

// starts the gleam running around #content and returns the function that tears it down
function setUpCyberGleam(): () => void {
  const layer = createCanvasLayer('z-index:3;');
  layer.ctx.lineCap = 'round';
  let progress = 0;

  const stopLoop = startFrameLoop(elapsedMs => {
    const content = document.getElementById('content');

    if (!content) return;

    const rect = content.getBoundingClientRect();
    progress = (progress + SPEED * elapsedMs) % 1;
    layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    drawStreak(layer.ctx, rect, progress * 2 * (rect.width + rect.height));
  });

  return () => { stopLoop(); layer.remove(); };
}

const cyberGleam = createAnimationToggle(setUpCyberGleam);

export const startCyberGleam = cyberGleam.start;
export const stopCyberGleam = cyberGleam.stop;
