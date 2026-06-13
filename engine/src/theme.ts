const CAT_DEFS = [
  { x: '6%',  y: '22%', size: 64, dur: 4.0, delay: 0    },
  { x: '83%', y: '14%', size: 48, dur: 6.2, delay: -2.1 },
  { x: '13%', y: '70%', size: 56, dur: 5.1, delay: -1.3 },
  { x: '77%', y: '66%', size: 52, dur: 7.8, delay: -3.5 },
  { x: '46%', y: '80%', size: 44, dur: 3.4, delay: -0.7 },
  { x: '90%', y: '44%', size: 60, dur: 8.3, delay: -4.1 },
  { x: '2%',  y: '48%', size: 46, dur: 4.7, delay: -1.8 },
  { x: '60%', y: '30%', size: 50, dur: 5.9, delay: -2.9 },
];

function addCats(): void {
  removeCats();
  CAT_DEFS.forEach(d => {
    const img = document.createElement('img');
    img.src = 'engine/img/cat.svg';
    img.className = 'nw-spinning-cat';
    img.style.cssText = `left:${d.x};top:${d.y};width:${d.size}px;height:${d.size}px;` +
      `animation-duration:${d.dur}s;animation-delay:${d.delay}s`;
    document.body.appendChild(img);
  });
}

function removeCats(): void {
  document.querySelectorAll('.nw-spinning-cat').forEach(el => el.remove());
}

const VALID_THEMES = ['default', 'dark', 'newspaper', 'terminal', 'warm', 'nasa', 'cats'];

let pageSuggestions: string[] = [];

function applySuggestions(): void {
  const cb = document.getElementById('nw-theme-suggest') as HTMLInputElement;
  if (!cb.checked) return;
  for (const name of pageSuggestions) {
    const q = name.trim().toLowerCase();
    const match = VALID_THEMES.find(t => t.startsWith(q));
    if (match) { applyTheme(match); return; }
  }
}

export function suggestTheme(names: string[]): void {
  pageSuggestions = names;
  applySuggestions();
}

function applyTheme(theme: string): void {
  const sel = document.getElementById('nw-theme-select') as HTMLSelectElement;
  document.documentElement.setAttribute('data-theme', theme);
  sel.value = theme;
  if (theme === 'cats') addCats(); else removeCats();
}

function applyAnimPaused(paused: boolean): void {
  const btn = document.getElementById('nw-anim-toggle') as HTMLButtonElement;
  document.documentElement.classList.toggle('nw-paused', paused);
  btn.textContent = paused ? 'Resume Animations' : 'Stop Animations';
}

// suggested theme checkbox
const suggestCb = document.getElementById('nw-theme-suggest') as HTMLInputElement;
suggestCb.checked = localStorage.getItem('nw-theme-suggest') !== 'false';
suggestCb.addEventListener('change', () => {
  localStorage.setItem('nw-theme-suggest', String(suggestCb.checked));
  if (suggestCb.checked) {
    localStorage.removeItem('nw-theme');
    applySuggestions();
  }
});

// animation toggle
const savedPaused = localStorage.getItem('nw-paused') === 'true';
applyAnimPaused(savedPaused);
document.getElementById('nw-anim-toggle')!.addEventListener('click', () => {
  const paused = !document.documentElement.classList.contains('nw-paused');
  applyAnimPaused(paused);
  localStorage.setItem('nw-paused', String(paused));
});

// theme picker
const savedTheme = localStorage.getItem('nw-theme');
if (savedTheme) applyTheme(savedTheme);
document.getElementById('nw-theme-select')!.addEventListener('change', (e: Event) => {
  const value = (e.target as HTMLSelectElement).value;
  applyTheme(value);
  localStorage.setItem('nw-theme', value);
  suggestCb.checked = false;
  localStorage.setItem('nw-theme-suggest', 'false');
});
