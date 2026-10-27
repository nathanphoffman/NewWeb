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

export const CLICK_EVENT = 'click';
export const BUTTON_TAG = 'button';
export const DIALOG_TAG = 'dialog';
export const CONTENT_ID = 'content';
export const TRUE_STRING = 'true';
export const SPAN_TAG = 'span';
export const HREF_ATTRIBUTE = 'href';
export const HTTP_PREFIX = 'http://';
export const HTTPS_PREFIX = 'https://';
export const WASM_PREFIX = 'wasm:';
export const MORE_PREFIX = 'more:';
export const LOADED_CLASS = 'nw-loaded';
export const VIEW_DATA_LABEL = 'View Data';
export const DARK_DEFAULT_THEME = 'carbon';
export const LIGHT_DEFAULT_THEME = 'quill';
export const ERROR_TOAST_TYPE = 'error';
export const ERROR_EVENT = 'error';
export const THEME_SELECT_ID = 'nw-theme-select';
export const CSS_NONE = 'none';
export const BLANK_LINE = '\n\n';

// random number from min up to (not including) max
export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
