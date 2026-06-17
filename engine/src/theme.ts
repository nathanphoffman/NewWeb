import { addCats, removeCats } from './themes/cats';
import { startMatrixRain, stopMatrixRain } from './themes/terminal';
import { startPetals, stopPetals } from './themes/sakura';
import { startTerminalCursor, stopTerminalCursor } from './themes/newspaper';
import { startCRTFlicker, stopCRTFlicker } from './themes/crt';
import { startStormRain, stopStormRain } from './themes/storm';
import { startMossTendrils, stopMossTendrils } from './themes/moss';

const VALID_THEMES = ['glacier', 'carbon', 'terminal', 'beach', 'space', 'aurora', 'cyber', 'cats', 'dusk', 'slate', 'sakura', 'crt', 'blueprint', 'moss', 'linen', 'storm'];

let pageSuggestions: string[] = [];

function getSuggestedTheme(): string | null {
  for (const name of pageSuggestions) {
    const q = name.trim().toLowerCase();
    const match = VALID_THEMES.find(t => t.startsWith(q));
    if (match) return match;
  }
  return null;
}

function annotateSuggestion(suggested: string | null): void {
  const sel = document.getElementById('nw-theme-select') as HTMLSelectElement;
  Array.from(sel.options).forEach(opt => {
    const base = opt.text.replace(' (site default)', '');
    opt.text = opt.value === suggested ? `${base} (site default)` : base;
  });
}

export function suggestTheme(names: string[]): void {
  pageSuggestions = names;
  const suggested = getSuggestedTheme();
  annotateSuggestion(suggested);
  const funEnabled = localStorage.getItem('nw-fun-themes') === 'true';
  if (suggested && !localStorage.getItem('nw-theme') && (funEnabled || !FUN_THEMES.includes(suggested))) {
    applyTheme(suggested);
  }
}

function applyTheme(theme: string): void {
  const sel = document.getElementById('nw-theme-select') as HTMLSelectElement;
  document.documentElement.setAttribute('data-theme', theme);
  sel.value = theme;
  if (theme === 'cats') addCats(); else removeCats();
  if (theme === 'terminal') startMatrixRain(); else stopMatrixRain();
  if (theme === 'linen') startTerminalCursor(); else stopTerminalCursor();
  if (theme === 'sakura') startPetals(); else stopPetals();
  if (theme === 'crt') startCRTFlicker(); else stopCRTFlicker();
  if (theme === 'storm') startStormRain(); else stopStormRain();
  if (theme === 'moss') startMossTendrils(); else stopMossTendrils();
}

export function applyAnimPaused(paused: boolean): void {
  document.documentElement.classList.toggle('nw-paused', paused);
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'sakura') {
    if (paused) stopPetals();
    else startPetals();
  }
  if (theme === 'storm') {
    if (paused) stopStormRain();
    else startStormRain();
  }
  if (theme === 'moss') {
    if (paused) stopMossTendrils();
    else startMossTendrils();
  }
  if (theme === 'linen') {
    if (paused) stopTerminalCursor();
    else startTerminalCursor();
  }
}

const FUN_THEMES = ['cats'];

export function applyFunThemes(enabled: boolean): void {
  const sel = document.getElementById('nw-theme-select') as HTMLSelectElement;
  for (const opt of Array.from(sel.options)) {
    if (FUN_THEMES.includes(opt.value)) opt.hidden = !enabled;
  }
  if (!enabled && FUN_THEMES.includes(sel.value)) {
    applyTheme('default');
    localStorage.removeItem('nw-theme');
  }
}

// hamburger toggle
const hamburger = document.getElementById('nw-hamburger') as HTMLButtonElement;
const barMenu   = document.getElementById('nw-bar-menu') as HTMLDivElement;
hamburger.addEventListener('click', () => {
  const open = barMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(open));
});

// restore saved paused state on load
const savedPaused = localStorage.getItem('nw-paused') === 'true';
applyAnimPaused(savedPaused);

// theme picker
const savedTheme = localStorage.getItem('nw-theme');
if (savedTheme) applyTheme(savedTheme);
applyFunThemes(localStorage.getItem('nw-fun-themes') === 'true');
document.getElementById('nw-theme-select')!.addEventListener('change', (e: Event) => {
  const value = (e.target as HTMLSelectElement).value;
  applyTheme(value);
  localStorage.setItem('nw-theme', value);
});
