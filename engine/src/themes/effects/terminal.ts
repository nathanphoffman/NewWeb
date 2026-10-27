import { createAnimationToggle, createCanvasLayer, isAnimationPaused, startFrameLoop } from './canvasLayer';

const FONT_SIZE = 14;
const MIN_FRAME_MS = 55; // ~18 fps — feels rain-like without hammering the GPU
const FADE_COLOR = 'rgba(13,13,13,0.12)';
const HEAD_COLOR = 'rgba(200,255,200,0.95)';  // head of the drop is near-white
const BODY_COLOR = 'rgba(0,255,65,0.85)';     // body is matrix green
const START_DELAY_MAX = 60;
const RESTART_DELAY_MAX = 50;
const RESTART_CHANCE = 0.025;

// keeps one drop position per text column, adding delayed new drops when the window grows
function resizeDrops(drops: number[], width: number): void {
  const columns = Math.floor(width / FONT_SIZE);

  while (drops.length < columns) drops.push(Math.floor(Math.random() * -START_DELAY_MAX));
  drops.length = columns;
}

// draws one digit for a column and moves its drop down, sometimes restarting it after it leaves the screen
function drawColumn(ctx: CanvasRenderingContext2D, drops: number[], column: number, height: number): void {
  if (drops[column] < 0) {
    drops[column]++;

    return;
  }

  const digit = String(Math.floor(Math.random() * 10));
  ctx.fillStyle = drops[column] <= 1 ? HEAD_COLOR : BODY_COLOR;
  ctx.fillText(digit, column * FONT_SIZE, drops[column] * FONT_SIZE);

  const offScreen = drops[column] * FONT_SIZE > height;

  if (offScreen && Math.random() < RESTART_CHANCE) drops[column] = Math.floor(Math.random() * -RESTART_DELAY_MAX);
  else drops[column]++;
}

// starts the falling digits and returns the function that tears them down
function setUpMatrixRain(): () => void {
  const drops: number[] = [];
  const layer = createCanvasLayer('z-index:0;opacity:0.22;', canvas => resizeDrops(drops, canvas.width));
  layer.canvas.id = 'nw-matrix';

  const stopLoop = startFrameLoop(() => {
    if (isAnimationPaused()) return;

    layer.ctx.fillStyle = FADE_COLOR;
    layer.ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
    layer.ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;

    for (let column = 0; column < drops.length; column++) drawColumn(layer.ctx, drops, column, layer.canvas.height);
  }, MIN_FRAME_MS);

  return () => { stopLoop(); layer.remove(); };
}

const matrixRain = createAnimationToggle(setUpMatrixRain);

export const startMatrixRain = matrixRain.start;
export const stopMatrixRain = matrixRain.stop;
