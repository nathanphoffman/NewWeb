import { createSpriteSpawner, SpriteLook } from './sprites';

const PETAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 15"><path d="M6,0 C10,2 12,7 11,11 C10,14 8,15 6,15 C4,15 2,14 1,11 C0,7 2,2 6,0 Z" fill="currentColor"/></svg>`;
const PETAL_COLORS = ['#f0a0bc', '#fbc8d8', '#e87898', '#f8d0e0', '#eda8c0'];

// wrapper moves straight down in global coords; SVG child holds static rotation
// so the visual angle never tilts the fall axis
function randomPetalLook(): SpriteLook {
  const size    = 10 + Math.random() * 12;
  const startX  = Math.random() * 108 - 4;
  const dur     = 8 + Math.random() * 9;
  const opacity = (0.4 + Math.random() * 0.5).toFixed(2);
  const angle   = Math.floor(Math.random() * 360);
  const color   = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];

  return {
    lifetimeSeconds: dur,
    wrapperCss:
      `position:fixed;left:${startX}vw;top:-${size + 10}px;` +
      `width:${size}px;height:${size * 1.25}px;` +
      `opacity:${opacity};z-index:2;pointer-events:none;` +
      `will-change:transform;` +
      `animation:nw-petal-fall ${dur}s linear forwards;`,
    svgCss:
      `width:100%;height:100%;display:block;color:${color};` +
      `transform:rotate(${angle}deg);`,
  };
}

const petals = createSpriteSpawner({
  className: 'nw-sakura-petal',
  svgMarkup: PETAL_SVG,
  initialCount: 5,
  initialStaggerMs: 700,
  intervalMs: 1200,
  randomLook: randomPetalLook,
});

export const startPetals = petals.start;
export const stopPetals = petals.stop;
