let bubbleTimer: number | null = null;
let bubblesActive = false;

function spawnBubble(): void {
  if (!bubblesActive) return;
  const el = document.createElement('div');
  el.classList.add('nw-bubble');

  const size    = 10 + Math.random() * 26;
  const startX  = Math.random() * 104 - 2;
  const dur     = 7 + Math.random() * 8;
  const drift   = (Math.random() * 60 - 30).toFixed(0);
  const opacity = (0.35 + Math.random() * 0.4).toFixed(2);

  el.style.cssText =
    `position:fixed;left:${startX}vw;bottom:-${size + 10}px;` +
    `width:${size}px;height:${size}px;opacity:${opacity};` +
    `--nw-bubble-drift:${drift}px;` +
    `z-index:2;pointer-events:none;will-change:transform;` +
    `animation:nw-bubble-rise ${dur}s ease-in forwards;`;

  document.body.appendChild(el);
  setTimeout(() => el.remove(), (dur + 0.5) * 1000);
}

export function startBubbles(): void {
  if (document.documentElement.classList.contains('nw-paused')) return;
  stopBubbles();
  bubblesActive = true;
  for (let i = 0; i < 6; i++) setTimeout(spawnBubble, i * 500);
  bubbleTimer = window.setInterval(spawnBubble, 900);
}

export function stopBubbles(): void {
  bubblesActive = false;
  if (bubbleTimer !== null) { clearInterval(bubbleTimer); bubbleTimer = null; }
  document.querySelectorAll('.nw-bubble').forEach(el => el.remove());
}
