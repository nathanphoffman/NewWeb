let stormRainActive = false;
let stormRainCanvas: HTMLCanvasElement | null = null;
let stormRainResizer: (() => void) | null = null;

export function startStormRain(): void {
  if (document.documentElement.classList.contains('nw-paused')) return;
  stopStormRain();
  stormRainActive = true;

  const canvas = document.createElement('canvas');
  stormRainCanvas = canvas;
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2;pointer-events:none;opacity:0.38;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  const LEAN = 0.18;

  type Drop = { x: number; y: number; len: number; speed: number; alpha: number };
  let drops: Drop[] = [];

  const resize = (): void => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.floor(canvas.width * canvas.height / 14000);
    drops = Array.from({ length: count }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      len:   10 + Math.random() * 18,
      speed: 5  + Math.random() * 9,
      alpha: 0.25 + Math.random() * 0.55,
    }));
  };
  resize();
  window.addEventListener('resize', resize);
  stormRainResizer = resize;

  const dx = Math.sin(LEAN);
  const dy = Math.cos(LEAN);

  let last = 0;
  const draw = (ts: number): void => {
    if (!stormRainActive) return;
    requestAnimationFrame(draw);
    if (ts - last < 28) return;
    last = ts;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const d of drops) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.len * dx, d.y + d.len * dy);
      ctx.strokeStyle = `rgba(165,190,230,${d.alpha})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      d.x += d.speed * dx;
      d.y += d.speed * dy;

      if (d.y > canvas.height + d.len) {
        d.y = -d.len - Math.random() * 80;
        d.x = Math.random() * canvas.width;
      }
    }
  };
  requestAnimationFrame(draw);
}

export function stopStormRain(): void {
  stormRainActive = false;
  if (stormRainResizer) { window.removeEventListener('resize', stormRainResizer); stormRainResizer = null; }
  stormRainCanvas?.remove();
  stormRainCanvas = null;
}
