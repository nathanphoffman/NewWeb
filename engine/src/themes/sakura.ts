// cherry blossom petal — parse once, clone on each spawn
const _petalTemplate = (() => {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 15"><path d="M6,0 C10,2 12,7 11,11 C10,14 8,15 6,15 C4,15 2,14 1,11 C0,7 2,2 6,0 Z" fill="currentColor"/></svg>`;
  return wrap.firstElementChild as SVGSVGElement;
})();
const PETAL_COLORS = ['#f0a0bc', '#fbc8d8', '#e87898', '#f8d0e0', '#eda8c0'];
let petalTimer: number | null = null;
let petalsActive = false;

function spawnPetal(): void {
  if (!petalsActive) return;
  // wrapper moves straight down in global coords; SVG child holds static rotation
  // so the visual angle never tilts the fall axis
  const wrapper = document.createElement('div');
  wrapper.classList.add('nw-sakura-petal');
  const el = _petalTemplate.cloneNode(true) as SVGSVGElement;

  const size    = 10 + Math.random() * 12;
  const startX  = Math.random() * 108 - 4;
  const dur     = 8 + Math.random() * 9;
  const opacity = (0.4 + Math.random() * 0.5).toFixed(2);
  const angle   = Math.floor(Math.random() * 360);
  const color   = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];

  wrapper.style.cssText =
    `position:fixed;left:${startX}vw;top:-${size + 10}px;` +
    `width:${size}px;height:${size * 1.25}px;` +
    `opacity:${opacity};z-index:2;pointer-events:none;` +
    `will-change:transform;` +
    `animation:nw-petal-fall ${dur}s linear forwards;`;

  el.style.cssText =
    `width:100%;height:100%;display:block;color:${color};` +
    `transform:rotate(${angle}deg);`;

  wrapper.appendChild(el);
  document.body.appendChild(wrapper);
  setTimeout(() => wrapper.remove(), (dur + 0.5) * 1000);
}

export function startPetals(): void {
  if (document.documentElement.classList.contains('nw-paused')) return;
  stopPetals();
  petalsActive = true;
  for (let i = 0; i < 5; i++) setTimeout(spawnPetal, i * 700);
  petalTimer = window.setInterval(spawnPetal, 1200);
}

export function stopPetals(): void {
  petalsActive = false;
  if (petalTimer !== null) { clearInterval(petalTimer); petalTimer = null; }
  document.querySelectorAll('.nw-sakura-petal').forEach(el => el.remove());
}
