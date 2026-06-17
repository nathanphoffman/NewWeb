let matrixAnim: number | null = null;
let matrixResizer: (() => void) | null = null;

export function startMatrixRain(): void {
  if (document.documentElement.classList.contains('nw-paused')) return;
  stopMatrixRain();

  const canvas = document.createElement('canvas');
  canvas.id = 'nw-matrix';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0.22;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  const fontSize = 14;
  let drops: number[] = [];

  const resize = (): void => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / fontSize);
    while (drops.length < cols) drops.push(Math.floor(Math.random() * -60));
    drops.length = cols;
  };
  resize();
  window.addEventListener('resize', resize);
  matrixResizer = resize;

  let last = 0;
  const draw = (ts: number): void => {
    matrixAnim = requestAnimationFrame(draw);
    if (document.documentElement.classList.contains('nw-paused')) return;
    if (ts - last < 55) return; // ~18 fps — feels rain-like without hammering the GPU
    last = ts;

    ctx.fillStyle = 'rgba(13,13,13,0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px 'Courier New', monospace`;

    for (let i = 0; i < drops.length; i++) {
      if (drops[i] < 0) { drops[i]++; continue; }

      const char = String(Math.floor(Math.random() * 10));
      // head of the drop is near-white; body is matrix green
      ctx.fillStyle = drops[i] <= 1 ? 'rgba(200,255,200,0.95)' : 'rgba(0,255,65,0.85)';
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = Math.floor(Math.random() * -50);
      } else {
        drops[i]++;
      }
    }
  };
  matrixAnim = requestAnimationFrame(draw);
}

export function stopMatrixRain(): void {
  if (matrixAnim !== null) { cancelAnimationFrame(matrixAnim); matrixAnim = null; }
  if (matrixResizer)       { window.removeEventListener('resize', matrixResizer); matrixResizer = null; }
  document.getElementById('nw-matrix')?.remove();
}
