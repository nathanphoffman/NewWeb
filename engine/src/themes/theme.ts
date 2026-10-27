import { CONTENT_ID, DARK_DEFAULT_THEME, LIGHT_DEFAULT_THEME, PAUSED_CLASS, PAUSED_STORAGE_KEY, THEME_SELECT_ID, THEME_STORAGE_KEY, TRUE_STRING } from '../shared/constants';
import { startPetals, stopPetals } from './effects/sakura';
import { startStormRain, stopStormRain } from './effects/storm';
import { startCyberGleam, stopCyberGleam } from './effects/cyber';
import { getAnimatedThemes, getThemeDefinition } from "./definitions"

let pageSuggestions: string[] = [];

// reads a <!-- themes: name1, name2 --> comment from markdown and applies the suggestion
export function applyThemeSuggestion(markdown: string): void {
  // matches <!-- theme: a, b --> and captures the comma separated names (anything up to the closing --> that isn't a dash)
  const match = markdown.match(/<!--\s*themes?\s*:\s*([^-]+?)-->/i);

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
  const select = document.getElementById(THEME_SELECT_ID) as HTMLSelectElement;
  Array.from(select.options).forEach(option => {
    const base = option.text.replace(' (site default)', '');
    option.text = option.value === suggested ? `${base} (site default)` : base;
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
  const select = document.getElementById(THEME_SELECT_ID) as HTMLSelectElement;
  document.documentElement.setAttribute('data-theme', theme);
  select.value = theme;

  const themes = getAnimatedThemes()

  themes.forEach(({ name, startAnimation, stopAnimation })=>{
    if(name === theme) startAnimation!()
    else stopAnimation!()
  })
}

// theme effects that must be started and stopped explicitly when animations are paused or resumed
const PAUSABLE_EFFECTS: Record<string, { start: () => void; stop: () => void }> = {
  sakura: { start: startPetals, stop: stopPetals },
  storm: { start: startStormRain, stop: stopStormRain },
  cyber: { start: startCyberGleam, stop: stopCyberGleam },
};

// pauses or resumes the css animations on the page content
function setContentAnimationState(paused: boolean): void {
  const contentEl = document.getElementById(CONTENT_ID);

  if (!contentEl) return;

  contentEl.style.animationPlayState = paused ? 'paused' : '';
  contentEl.style.setProperty('--nw-anim-state', paused ? 'paused' : 'running');
}

// pauses or resumes all page animations, including theme-specific effects that need explicit start/stop
export function applyAnimPaused(paused: boolean): void {
  document.documentElement.classList.toggle(PAUSED_CLASS, paused);
  setContentAnimationState(paused);

  const effect = PAUSABLE_EFFECTS[document.documentElement.getAttribute('data-theme') ?? ''];

  if (!effect) return;
  if (paused) effect.stop();
  else effect.start();
}

// restore saved paused state on load
const savedPaused = localStorage.getItem(PAUSED_STORAGE_KEY) === TRUE_STRING;
applyAnimPaused(savedPaused);

// theme picker — saved > page suggestion > system preference
const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

if (savedTheme) {
  applyTheme(savedTheme);
} else {
  const systemDefault = window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_DEFAULT_THEME : LIGHT_DEFAULT_THEME;
  applyTheme(systemDefault);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (!localStorage.getItem(THEME_STORAGE_KEY)) applyTheme(event.matches ? DARK_DEFAULT_THEME : LIGHT_DEFAULT_THEME);
  });
}

document.getElementById(THEME_SELECT_ID)!.addEventListener('change', (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  applyTheme(value);
  localStorage.setItem(THEME_STORAGE_KEY, value);
});
