import { createSpriteSpawner, type SpriteLook } from './sprites';
import { randomBetween, SPRITE_HEIGHT_TO_WIDTH } from '../../shared/constants';

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
const JELLY_SIZE_PX = { min: 24, max: 58 };
const JELLY_START_X_VW = { min: -2, max: 98 };
const JELLY_RISE_SECONDS = { min: 14, max: 28 };
const JELLY_DRIFT_PX = { min: 20, max: 60 };
const JELLY_OPACITY = { min: 0.35, max: 0.7 };
const JELLY_PULSE_SECONDS = { min: 2, max: 3.5 };
const STARTING_JELLYFISH = 4;
const JELLY_STAGGER_MS = 1400;
const JELLY_INTERVAL_MS = 2600;
const JELLY_GLOW_PX = 6;

function randomJellyLook(): SpriteLook {
  const size     = randomBetween(JELLY_SIZE_PX.min, JELLY_SIZE_PX.max);
  const startX   = randomBetween(JELLY_START_X_VW.min, JELLY_START_X_VW.max);
  const dur      = randomBetween(JELLY_RISE_SECONDS.min, JELLY_RISE_SECONDS.max);
  const drift    = randomBetween(JELLY_DRIFT_PX.min, JELLY_DRIFT_PX.max).toFixed(0);
  const opacity  = randomBetween(JELLY_OPACITY.min, JELLY_OPACITY.max).toFixed(2);
  const color    = JELLY_COLORS[Math.floor(Math.random() * JELLY_COLORS.length)];
  const pulseDur = randomBetween(JELLY_PULSE_SECONDS.min, JELLY_PULSE_SECONDS.max).toFixed(2);

  return {
    lifetimeSeconds: dur,
    wrapperCss:
      `position:fixed;left:${startX}vw;top:108vh;` +
      `width:${size}px;height:${size * SPRITE_HEIGHT_TO_WIDTH}px;` +
      `opacity:${opacity};z-index:2;pointer-events:none;` +
      `will-change:transform;color:${color};` +
      `--nw-jelly-drift:${drift}px;` +
      `filter:drop-shadow(0 0 ${JELLY_GLOW_PX}px ${color});` +
      `animation:nw-jelly-drift ${dur}s linear forwards;`,
    svgCss:
      `width:100%;height:100%;display:block;` +
      `animation:nw-jelly-pulse ${pulseDur}s ease-in-out infinite;`,
  };
}

const jellyfish = createSpriteSpawner({
  className: 'nw-abyss-jelly',
  svgMarkup: JELLY_SVG,
  initialCount: STARTING_JELLYFISH,
  initialStaggerMs: JELLY_STAGGER_MS,
  intervalMs: JELLY_INTERVAL_MS,
  randomLook: randomJellyLook,
});

export const startJellyfish = jellyfish.start;
export const stopJellyfish = jellyfish.stop;
