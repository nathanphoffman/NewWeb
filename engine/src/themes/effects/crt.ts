import { isAnimationPaused } from './canvasLayer';
import { randomBetween } from '../../shared/constants';

const FLASH_FADE_IN_MS = 80;
const FLASH_FADE_OUT_MS = 260;
const FLASH_REMOVE_DELAY_MS = 300;
const MIN_FLASH_GAP_MS = 1200;
const FLASH_GAP_SPREAD_MS = 5000;

const FLASH_HEIGHT_VH = { min: 20, max: 70 };
const FLASH_OPACITY = { min: 0.025, max: 0.075 };
const FLASH_HOLD_MS = { min: 60, max: 240 };
const FULL_HEIGHT_PCT = 100;

let crtFlickerTimer: ReturnType<typeof setTimeout> | null = null;

// builds the translucent yellow band that sweeps over the page for one flash
function buildFlashBand(): HTMLDivElement {
  const band = document.createElement('div');
  const heightPct = randomBetween(FLASH_HEIGHT_VH.min, FLASH_HEIGHT_VH.max);
  const topPct    = Math.random() * (FULL_HEIGHT_PCT - heightPct);
  const opacity   = randomBetween(FLASH_OPACITY.min, FLASH_OPACITY.max).toFixed(3);

  band.className = 'nw-crt-flash';
  band.style.cssText =
    `position:fixed;left:0;right:0;top:${topPct}%;height:${heightPct}vh;` +
    `background:rgba(220,195,60,${opacity});pointer-events:none;z-index:10000;` +
    `opacity:0;transition:opacity ${FLASH_FADE_IN_MS}ms ease-in;`;

  return band;
}

// fades the band in, holds it briefly, fades it out and removes it
function playFlash(band: HTMLElement): void {
  band.style.opacity = '1';
  const hold = randomBetween(FLASH_HOLD_MS.min, FLASH_HOLD_MS.max);

  // after the hold time, fade the band out and remove it once the fade has finished
  setTimeout(() => {
    band.style.transition = `opacity ${FLASH_FADE_OUT_MS}ms ease-out`;
    band.style.opacity = '0';
    setTimeout(() => band.remove(), FLASH_REMOVE_DELAY_MS);
  }, hold);
}

// shows one flash unless animations are paused
function fireCRTFlash(): void {
  if (isAnimationPaused()) return;

  const band = buildFlashBand();
  document.body.appendChild(band);
  requestAnimationFrame(() => playFlash(band));
}

// fires a flash after a random pause, then schedules the next one
function scheduleCRTFlash(): void {
  const delay = randomBetween(MIN_FLASH_GAP_MS, MIN_FLASH_GAP_MS + FLASH_GAP_SPREAD_MS);

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
  document.querySelectorAll('.nw-crt-flash').forEach(element => element.remove());
}
