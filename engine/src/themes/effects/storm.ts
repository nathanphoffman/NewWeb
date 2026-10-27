import { randomBetween } from '../../shared/constants';
import { createCanvasLayer } from './canvasLayer';
import { createAnimationToggle, startFrameLoop } from './animationLoop';

const LEAN_RADIANS = 0.18;
const PIXELS_PER_DROP = 14000;
const MIN_FRAME_MS = 28;
const RAIN_RESPAWN_SPREAD = 80;
const RAIN_COLOR = '165,190,230';
const DROP_LENGTH = { min: 10, max: 28 };
const DROP_SPEED = { min: 5, max: 14 };
const DROP_ALPHA = { min: 0.25, max: 0.8 };

type Drop = { x: number; y: number; len: number; speed: number; alpha: number };

// scatters raindrops across the canvas, with more drops on bigger windows
function makeDrops(canvas: HTMLCanvasElement): Drop[] {
  const count = Math.floor(canvas.width * canvas.height / PIXELS_PER_DROP);

  return Array.from({ length: count }, () => ({
    x:     Math.random() * canvas.width,
    y:     Math.random() * canvas.height,
    len:   randomBetween(DROP_LENGTH.min, DROP_LENGTH.max),
    speed: randomBetween(DROP_SPEED.min, DROP_SPEED.max),
    alpha: randomBetween(DROP_ALPHA.min, DROP_ALPHA.max),
  }));
}

// moves a drop along the rain direction and sends it back above the screen once it falls off the bottom
function advanceDrop(drop: Drop, canvas: HTMLCanvasElement, deltaX: number, deltaY: number): void {
  drop.x += drop.speed * deltaX;
  drop.y += drop.speed * deltaY;

  if (drop.y <= canvas.height + drop.len) return;

  drop.y = -drop.len - Math.random() * RAIN_RESPAWN_SPREAD;
  drop.x = Math.random() * canvas.width;
}

// draws one drop as a short slanted line
function drawDrop(context: CanvasRenderingContext2D, drop: Drop, deltaX: number, deltaY: number): void {
  context.beginPath();
  context.moveTo(drop.x, drop.y);
  context.lineTo(drop.x + drop.len * deltaX, drop.y + drop.len * deltaY);
  context.strokeStyle = `rgba(${RAIN_COLOR},${drop.alpha})`;
  context.lineWidth = 1;
  context.stroke();
}

// starts the rain and returns the function that tears it down
function setUpStormRain(): () => void {
  let drops: Drop[] = [];
  const layer = createCanvasLayer('z-index:2;opacity:0.38;', canvas => { drops = makeDrops(canvas); });
  const deltaX = Math.sin(LEAN_RADIANS);
  const deltaY = Math.cos(LEAN_RADIANS);

  const stopLoop = startFrameLoop(() => {
    layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);

    for (const drop of drops) {
      drawDrop(layer.ctx, drop, deltaX, deltaY);
      advanceDrop(drop, layer.canvas, deltaX, deltaY);
    }
  }, MIN_FRAME_MS);

  return () => { stopLoop(); layer.remove(); };
}

const stormRain = createAnimationToggle(setUpStormRain);

export const startStormRain = stormRain.start;
export const stopStormRain = stormRain.stop;
