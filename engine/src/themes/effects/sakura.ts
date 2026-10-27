import { createSpriteSpawner, type SpriteLook } from './sprites';
import { randomBetween, SPRITE_HEIGHT_TO_WIDTH } from '../../shared/constants';

const PETAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 15"><path d="M6,0 C10,2 12,7 11,11 C10,14 8,15 6,15 C4,15 2,14 1,11 C0,7 2,2 6,0 Z" fill="currentColor"/></svg>`;
const PETAL_COLORS = ['#f0a0bc', '#fbc8d8', '#e87898', '#f8d0e0', '#eda8c0'];
const PETAL_SIZE_PX = { min: 10, max: 22 };
const PETAL_START_X_VW = { min: -4, max: 104 };
const PETAL_FALL_SECONDS = { min: 8, max: 17 };
const PETAL_OPACITY = { min: 0.4, max: 0.9 };
const FULL_TURN_DEGREES = 360;
const STARTING_PETALS = 5;
const PETAL_STAGGER_MS = 700;
const PETAL_INTERVAL_MS = 1200;
const OFFSCREEN_MARGIN_PX = 10;

// wrapper moves straight down in global coords; SVG child holds static rotation
// so the visual angle never tilts the fall axis
function randomPetalLook(): SpriteLook {
  const size    = randomBetween(PETAL_SIZE_PX.min, PETAL_SIZE_PX.max);
  const startX  = randomBetween(PETAL_START_X_VW.min, PETAL_START_X_VW.max);
  const dur     = randomBetween(PETAL_FALL_SECONDS.min, PETAL_FALL_SECONDS.max);
  const opacity = randomBetween(PETAL_OPACITY.min, PETAL_OPACITY.max).toFixed(2);
  const angle   = Math.floor(Math.random() * FULL_TURN_DEGREES);
  const color   = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];

  return {
    lifetimeSeconds: dur,
    wrapperCss:
      `position:fixed;left:${startX}vw;top:-${size + OFFSCREEN_MARGIN_PX}px;` +
      `width:${size}px;height:${size * SPRITE_HEIGHT_TO_WIDTH}px;` +
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
  initialCount: STARTING_PETALS,
  initialStaggerMs: PETAL_STAGGER_MS,
  intervalMs: PETAL_INTERVAL_MS,
  randomLook: randomPetalLook,
});

export const startPetals = petals.start;
export const stopPetals = petals.stop;
