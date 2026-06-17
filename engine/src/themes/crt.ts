let crtFlickerTimer: ReturnType<typeof setTimeout> | null = null;

function fireCRTFlash(): void {
  if (document.documentElement.classList.contains('nw-paused')) return;
  const el = document.createElement('div');
  el.className = 'nw-crt-flash';
  const heightPct = 20 + Math.random() * 50;
  const topPct    = Math.random() * (100 - heightPct);
  const opacity  = (0.025 + Math.random() * 0.050).toFixed(3);
  el.style.cssText =
    `position:fixed;left:0;right:0;top:${topPct}%;height:${heightPct}vh;` +
    `background:rgba(220,195,60,${opacity});pointer-events:none;z-index:10000;` +
    `opacity:0;transition:opacity 80ms ease-in;`;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    const hold = 60 + Math.random() * 180;
    setTimeout(() => {
      el.style.transition = 'opacity 260ms ease-out';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, hold);
  });
}

function scheduleCRTFlash(): void {
  const delay = 1200 + Math.random() * 5000;
  crtFlickerTimer = setTimeout(() => {
    fireCRTFlash();
    scheduleCRTFlash();
  }, delay);
}

export function startCRTFlicker(): void {
  stopCRTFlicker();
  scheduleCRTFlash();
}

export function stopCRTFlicker(): void {
  if (crtFlickerTimer !== null) { clearTimeout(crtFlickerTimer); crtFlickerTimer = null; }
  document.querySelectorAll('.nw-crt-flash').forEach(el => el.remove());
}
