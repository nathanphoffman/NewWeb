let mossActive = false;
let mossCanvas: HTMLCanvasElement | null = null;
let mossRafId: number | null = null;
let mossResizer: (() => void) | null = null;

const COLORS   = ['#6e784b', '#7a8854', '#5a6e38', '#88a85c', '#4a5e30', '#6a7840'];
const STEP     = 2.5;   // px per growth point
const MAX_TURN = 0.08;  // max angular change per growth step
const MAX_N    = 9;     // max simultaneous tendrils

interface Pt { x: number; y: number; }
interface Leaf { at: number; angle: number; len: number; }
interface Tendril {
  pts: Pt[];
  angle: number;
  drift: number;
  maxLen: number;
  color: string;
  width: number;
  alpha: number;
  dead: boolean;
  doneFrame: number;
  leaves: Leaf[];
}

const tendrils: Tendril[] = [];
let frame = 0;

function spawn(rect: DOMRect): Tendril {
  const side = Math.floor(Math.random() * 3); // 0=left, 1=right, 2=bottom
  let x: number, y: number, angle: number;
  const j = (Math.random() - 0.5) * 0.25; // tight jitter so they hug the border
  if (side === 0) {
    x = rect.left;
    y = rect.top + rect.height * (0.05 + Math.random() * 0.9);
    angle = (Math.random() < 0.5 ? -Math.PI / 2 : Math.PI / 2) + j; // up or down
  } else if (side === 1) {
    x = rect.right;
    y = rect.top + rect.height * (0.05 + Math.random() * 0.9);
    angle = (Math.random() < 0.5 ? -Math.PI / 2 : Math.PI / 2) + j; // up or down
  } else {
    x = rect.left + rect.width * (0.05 + Math.random() * 0.9);
    y = rect.bottom;
    angle = (Math.random() < 0.5 ? 0 : Math.PI) + j; // left or right
  }
  return {
    pts: [{ x, y }],
    angle,
    drift: 0,
    maxLen: 5 + Math.floor(Math.random() * 8),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    width: 0.7 + Math.random() * 1.3,
    alpha: 0.18 + Math.random() * 0.18,
    dead: false,
    doneFrame: -1,
    leaves: [],
  };
}

function growStep(t: Tendril): void {
  t.drift = t.drift * 0.92 + (Math.random() - 0.5) * 0.08;
  t.angle += t.drift + (Math.random() - 0.5) * MAX_TURN;
  const last = t.pts[t.pts.length - 1];
  t.pts.push({
    x: last.x + Math.cos(t.angle) * STEP,
    y: last.y + Math.sin(t.angle) * STEP,
  });
  // occasionally sprout a small leaf
  if (t.pts.length > 8 && Math.random() < 0.1) {
    const side = Math.random() < 0.5 ? 1 : -1;
    t.leaves.push({
      at:    t.pts.length - 1,
      angle: t.angle + side * (0.65 + Math.random() * 0.65),
      len:   3 + Math.random() * 5,
    });
  }
}

function drawSmooth(ctx: CanvasRenderingContext2D, pts: Pt[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.stroke();
}

function drawTendril(ctx: CanvasRenderingContext2D, t: Tendril): void {
  if (t.pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha = t.alpha;
  ctx.strokeStyle = t.color;
  ctx.lineWidth = t.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawSmooth(ctx, t.pts);
  for (const lf of t.leaves) {
    if (lf.at >= t.pts.length) continue;
    const p = t.pts[lf.at];
    ctx.lineWidth = t.width * 0.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(lf.angle) * lf.len, p.y + Math.sin(lf.angle) * lf.len);
    ctx.stroke();
  }
  ctx.restore();
}

export function startMossTendrils(): void {
  if (document.documentElement.classList.contains('nw-paused')) return;
  stopMossTendrils();
  mossActive = true;
  tendrils.length = 0;
  frame = 0;

  const canvas = document.createElement('canvas');
  mossCanvas = canvas;
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2;pointer-events:none;';
  document.body.appendChild(canvas);

  const resize = (): void => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  mossResizer = resize;
  window.addEventListener('resize', resize);

  const ctx = canvas.getContext('2d')!;
  let last = 0;

  const loop = (ts: number): void => {
    if (!mossActive) return;
    mossRafId = requestAnimationFrame(loop);
    if (ts - last < 33) return; // ~30fps
    last = ts;
    frame++;

    const content = document.getElementById('content');
    if (!content) return;
    const rect = content.getBoundingClientRect();

    // spawn a new tendril every ~2 s if below cap
    if (frame % 60 === 0 && tendrils.filter(t => !t.dead).length < MAX_N) {
      tendrils.push(spawn(rect));
    }

    // grow and age each tendril
    for (const t of tendrils) {
      if (t.dead) continue;
      if (t.pts.length < t.maxLen) {
        if (frame % 2 === 0) growStep(t); // grow every other frame for slow creep
      } else {
        if (t.doneFrame < 0) t.doneFrame = frame;
        if (frame - t.doneFrame > 240) { // ~8 s at 30fps before fade
          t.alpha -= 0.005;
          if (t.alpha <= 0) t.dead = true;
        }
      }
    }

    // trim dead entries periodically
    if (frame % 120 === 0) {
      const live = tendrils.filter(t => !t.dead);
      tendrils.length = 0;
      tendrils.push(...live);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const t of tendrils) {
      if (!t.dead) drawTendril(ctx, t);
    }
  };

  mossRafId = requestAnimationFrame(loop);
}

export function stopMossTendrils(): void {
  mossActive = false;
  if (mossRafId !== null) { cancelAnimationFrame(mossRafId); mossRafId = null; }
  if (mossResizer) { window.removeEventListener('resize', mossResizer); mossResizer = null; }
  mossCanvas?.remove();
  mossCanvas = null;
  tendrils.length = 0;
}
