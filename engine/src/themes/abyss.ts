// simple jellyfish silhouette — parse once, clone on each spawn
const _jellyTemplate = (() => {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50">
    <path d="M20,2 C31,2 38,12 38,20 C38,26 33,29 20,29 C7,29 2,26 2,20 C2,12 9,2 20,2 Z" fill="currentColor" opacity="0.55"/>
    <path d="M8,28 C8,38 6,44 5,49" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.5"/>
    <path d="M14,29 C14,40 12,45 11,50" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.5"/>
    <path d="M20,29 C20,41 20,46 20,50" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.5"/>
    <path d="M26,29 C26,40 28,45 29,50" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.5"/>
    <path d="M32,28 C32,38 34,44 35,49" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.5"/>
  </svg>`;
  return wrap.firstElementChild as SVGSVGElement;
})();
const JELLY_COLORS = ['#7fd8e8', '#a8f0d0', '#d8a8f0', '#88b8ff', '#f0a8d8'];
let jellyTimer: number | null = null;
let jellyActive = false;

function spawnJelly(): void {
  if (!jellyActive) return;
  const wrapper = document.createElement('div');
  wrapper.classList.add('nw-abyss-jelly');
  const el = _jellyTemplate.cloneNode(true) as SVGSVGElement;

  const size     = 24 + Math.random() * 34;
  const startX   = Math.random() * 100 - 2;
  const dur      = 14 + Math.random() * 14;
  const drift    = (20 + Math.random() * 40).toFixed(0);
  const opacity  = (0.35 + Math.random() * 0.35).toFixed(2);
  const color    = JELLY_COLORS[Math.floor(Math.random() * JELLY_COLORS.length)];
  const pulseDur = (2 + Math.random() * 1.5).toFixed(2);

  wrapper.style.cssText =
    `position:fixed;left:${startX}vw;top:108vh;` +
    `width:${size}px;height:${size * 1.25}px;` +
    `opacity:${opacity};z-index:2;pointer-events:none;` +
    `will-change:transform;color:${color};` +
    `--nw-jelly-drift:${drift}px;` +
    `filter:drop-shadow(0 0 6px ${color});` +
    `animation:nw-jelly-drift ${dur}s linear forwards;`;

  el.style.cssText =
    `width:100%;height:100%;display:block;` +
    `animation:nw-jelly-pulse ${pulseDur}s ease-in-out infinite;`;

  wrapper.appendChild(el);
  document.body.appendChild(wrapper);
  setTimeout(() => wrapper.remove(), (dur + 0.5) * 1000);
}

export function startJellyfish(): void {
  if (document.documentElement.classList.contains('nw-paused')) return;
  stopJellyfish();
  jellyActive = true;
  for (let i = 0; i < 4; i++) setTimeout(spawnJelly, i * 1400);
  jellyTimer = window.setInterval(spawnJelly, 2600);
}

export function stopJellyfish(): void {
  jellyActive = false;
  if (jellyTimer !== null) { clearInterval(jellyTimer); jellyTimer = null; }
  document.querySelectorAll('.nw-abyss-jelly').forEach(el => el.remove());
}
