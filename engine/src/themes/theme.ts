import { PAUSED_CLASS, PAUSED_STORAGE_KEY, THEME_STORAGE_KEY } from '../shared/constants';
import { startPetals, stopPetals } from './effects/sakura';
import { startStormRain, stopStormRain } from './effects/storm';
import { startCyberGleam, stopCyberGleam } from './effects/cyber';
import { getAnimatedThemes, getThemeDefinition } from "./definitions"

let pageSuggestions: string[] = [];

// reads a <!-- themes: name1, name2 --> comment from markdown and applies the suggestion
export function applyThemeSuggestion(md: string): void {
  // matches <!-- theme: a, b --> and captures the comma separated names (anything up to the closing --> that isn't a dash)
  const match = md.match(/<!--\s*themes?\s*:\s*([^-]+?)-->/i);

  if (match) suggestTheme(match[1].split(','));
}

// returns the first valid theme that matches a page suggestion prefix, or null if none match
function getSuggestedTheme(): string | null {
  for (const name of pageSuggestions) {
    const themeName = name.trim().toLowerCase();

    const match = getThemeDefinition(themeName);

    if (match) return match.name;
  }

  return null;
}

// appends "(site default)" to the suggested theme's option in the theme picker dropdown
function annotateSuggestion(suggested: string | null): void {
  const sel = document.getElementById('nw-theme-select') as HTMLSelectElement;
  Array.from(sel.options).forEach(opt => {
    const base = opt.text.replace(' (site default)', '');
    opt.text = opt.value === suggested ? `${base} (site default)` : base;
  });
}

// records page theme suggestions and applies the best match if the user has no saved preference
function suggestTheme(names: string[]): void {
  pageSuggestions = names;
  const suggested = getSuggestedTheme();
  annotateSuggestion(suggested);

  if (suggested && !localStorage.getItem(THEME_STORAGE_KEY)) {
    applyTheme(suggested);
  }
}

// sets the data-theme attribute and starts/stops any theme-specific visual effects (matrix rain, petals, etc.)
function applyTheme(theme: string): void {
  const sel = document.getElementById('nw-theme-select') as HTMLSelectElement;
  document.documentElement.setAttribute('data-theme', theme);
  sel.value = theme;

  const themes = getAnimatedThemes()

  themes.forEach(({ name, startAnimation, stopAnimation })=>{
    if(name === theme) startAnimation!()
    else stopAnimation!()
  })
}

// pauses or resumes all page animations, including theme-specific effects that need explicit start/stop
export function applyAnimPaused(paused: boolean): void {
  document.documentElement.classList.toggle(PAUSED_CLASS, paused);
  const contentEl = document.getElementById('content');

  if (contentEl) {
    contentEl.style.animationPlayState = paused ? 'paused' : '';
    contentEl.style.setProperty('--nw-anim-state', paused ? 'paused' : 'running');
  }

  const theme = document.documentElement.getAttribute('data-theme');

  if (theme === 'sakura') {
    if (paused) stopPetals();
    else startPetals();
  }

  if (theme === 'storm') {
    if (paused) stopStormRain();
    else startStormRain();
  }

  if (theme === 'cyber') {
    if (paused) stopCyberGleam();
    else startCyberGleam();
  }
}

// restore saved paused state on load
const savedPaused = localStorage.getItem(PAUSED_STORAGE_KEY) === 'true';
applyAnimPaused(savedPaused);

// theme picker — saved > page suggestion > system preference
const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

if (savedTheme) {
  applyTheme(savedTheme);
} else {
  const systemDefault = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'carbon' : 'quill';
  applyTheme(systemDefault);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem(THEME_STORAGE_KEY)) applyTheme(e.matches ? 'carbon' : 'quill');
  });
}

document.getElementById('nw-theme-select')!.addEventListener('change', (e: Event) => {
  const value = (e.target as HTMLSelectElement).value;
  applyTheme(value);
  localStorage.setItem(THEME_STORAGE_KEY, value);
});
