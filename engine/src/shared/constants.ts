export const PAUSED_CLASS = 'nw-paused';
export const PAUSED_STORAGE_KEY = 'nw-paused';
export const THEME_STORAGE_KEY = 'nw-theme';
export const MS_PER_SECOND = 1000;
export const BYTES_PER_KB = 1024;
export const DECIMAL_RADIX = 10;
export const TOAST_VISIBLE_MS = 3000;
export const FADE_OUT_TIMEOUT_MS = 260;
export const MARKDOWN_EXTENSION = '.md';
export const SPRITE_HEIGHT_TO_WIDTH = 1.25;

// random number from min up to (not including) max
export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
