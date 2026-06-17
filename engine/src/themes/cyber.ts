let cyberActive = false;
let cyberCanvas: HTMLCanvasElement | null = null;
let cyberRafId: number | null = null;
let cyberResizer: (() => void) | null = null;

const STREAK = 90;    // px total length of gleam
const SEGS = 24;    // segments (keeps corners clean)
const SPEED = 0.000022; // perimeter-fraction per ms (~45s per loop at 3000px perim)

function ptAt(d: number, P: number, rect: DOMRect): { x: number; y: number } {
  d = ((d % P) + P) % P;
  const { left, right, top, bottom, width: w, height: h } = rect;
  if (d < w) return { x: left + d, y: top };
  if (d < w + h) return { x: right + 1, y: top + (d - w) };
  if (d < 2 * w + h) return { x: right - (d - w - h), y: bottom };
  return { x: left, y: bottom - (d - 2 * w - h) };
}

export function startCyberGleam(): void {
  if (document.documentElement.classList.contains('nw-paused')) return;
  stopCyberGleam();
  cyberActive = true;

  const canvas = document.createElement('canvas');
  cyberCanvas = canvas;
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:3;pointer-events:none;';
  document.body.appendChild(canvas);

  const resize = (): void => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  cyberResizer = resize;
  window.addEventListener('resize', resize);

  const ctx = canvas.getContext('2d')!;
  let t = 0, last = 0;

  const loop = (ts: number): void => {
    if (!cyberActive) return;
    cyberRafId = requestAnimationFrame(loop);
    const dt = last === 0 ? 16 : ts - last;
    last = ts;

    const content = document.getElementById('content');
    if (!content) return;
    const rect = content.getBoundingClientRect();
    const P = 2 * (rect.width + rect.height);

    t = (t + SPEED * dt) % 1;
    const pos = t * P;
    const segLen = STREAK / SEGS;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';

    for (let i = 0; i < SEGS; i++) {
      const f = i / (SEGS - 1);            // 0 → 1 along the streak
      const bell = Math.sin(f * Math.PI);     // 0 at edges, 1 at center

      const p0 = ptAt(pos - STREAK / 2 + i * segLen, P, rect);
      const p1 = ptAt(pos - STREAK / 2 + (i + 1) * segLen, P, rect);

      // Pink (#ff71ce) at leading edge, white-pink at center, purple (#b967ff) trailing.
      // Lerp pink→purple along f, then brighten toward white at bell peak.
      const r = 255;
      const g = Math.min(255, Math.round((113 - 10 * f) + bell * 120));
      const b = Math.min(255, Math.round((206 + 49 * f) + bell * 45));
      const a = (bell * 0.95).toFixed(2);

      // Wide outer glow pass
      ctx.lineWidth = 10;
      ctx.strokeStyle = `rgba(${r},${g},${b},${(bell * 0.12).toFixed(2)})`;
      ctx.shadowColor = `rgba(255,80,200,${(bell * 0.6).toFixed(2)})`;
      ctx.shadowBlur = 22;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();

      // Bright core pass
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
      ctx.shadowColor = `rgba(255,100,220,${(bell * 0.9).toFixed(2)})`;
      ctx.shadowBlur = 8 + bell * 14;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    }
  };

  cyberRafId = requestAnimationFrame(loop);
}

export function stopCyberGleam(): void {
  cyberActive = false;
  if (cyberRafId !== null) { cancelAnimationFrame(cyberRafId); cyberRafId = null; }
  if (cyberResizer) { window.removeEventListener('resize', cyberResizer); cyberResizer = null; }
  cyberCanvas?.remove();
  cyberCanvas = null;
}
