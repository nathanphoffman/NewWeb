import { createSpriteSpawner, SpriteLook } from './sprites';

// simple jellyfish silhouette
const JELLY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50">
    <path d="M20,2 C31,2 38,12 38,20 C38,26 33,29 20,29 C7,29 2,26 2,20 C2,12 9,2 20,2 Z" fill="currentColor" opacity="0.55"/>
    <path d="M8,28 C8,38 6,44 5,49" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.5"/>
    <path d="M14,29 C14,40 12,45 11,50" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.5"/>
    <path d="M20,29 C20,41 20,46 20,50" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.5"/>
    <path d="M26,29 C26,40 28,45 29,50" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.5"/>
    <path d="M32,28 C32,38 34,44 35,49" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.5"/>
  </svg>`;
const JELLY_COLORS = ['#7fd8e8', '#a8f0d0', '#d8a8f0', '#88b8ff', '#f0a8d8'];

function randomJellyLook(): SpriteLook {
  const size     = 24 + Math.random() * 34;
  const startX   = Math.random() * 100 - 2;
  const dur      = 14 + Math.random() * 14;
  const drift    = (20 + Math.random() * 40).toFixed(0);
  const opacity  = (0.35 + Math.random() * 0.35).toFixed(2);
  const color    = JELLY_COLORS[Math.floor(Math.random() * JELLY_COLORS.length)];
  const pulseDur = (2 + Math.random() * 1.5).toFixed(2);

  return {
    lifetimeSeconds: dur,
    wrapperCss:
      `position:fixed;left:${startX}vw;top:108vh;` +
      `width:${size}px;height:${size * 1.25}px;` +
      `opacity:${opacity};z-index:2;pointer-events:none;` +
      `will-change:transform;color:${color};` +
      `--nw-jelly-drift:${drift}px;` +
      `filter:drop-shadow(0 0 6px ${color});` +
      `animation:nw-jelly-drift ${dur}s linear forwards;`,
    svgCss:
      `width:100%;height:100%;display:block;` +
      `animation:nw-jelly-pulse ${pulseDur}s ease-in-out infinite;`,
  };
}

const jellyfish = createSpriteSpawner({
  className: 'nw-abyss-jelly',
  svgMarkup: JELLY_SVG,
  initialCount: 4,
  initialStaggerMs: 1400,
  intervalMs: 2600,
  randomLook: randomJellyLook,
});

export const startJellyfish = jellyfish.start;
export const stopJellyfish = jellyfish.stop;
