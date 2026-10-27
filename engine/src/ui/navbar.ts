import { PAUSED_CLASS, PAUSED_STORAGE_KEY } from '../shared/constants';
import { showSettingsModal } from './overlays/settings';
import { showDataModal, store } from '../startup/engineCode';
import { applyAnimPaused } from '../themes/theme';

const HAMBURGER_ID = 'nw-hamburger';

// wires the hamburger button, and closes the menu when the user clicks anywhere outside the navbar
function initializeHamburger(): void {
  const hamburger = document.getElementById(HAMBURGER_ID) as HTMLButtonElement;
  const barMenu = document.getElementById('nw-bar-menu') as HTMLDivElement;
  const bar = document.getElementById('nw-bar') as HTMLDivElement;

  const toggleHamburger = (): void => {
    const open = barMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
  };

  document.body.addEventListener('click', (e) => {
    const clicked = e.target as Node;

    if ((clicked as HTMLElement).id === HAMBURGER_ID) toggleHamburger();

    // a click anywhere inside the navbar (including the theme select) leaves the menu alone
    else if (bar.contains(clicked)) return;
    else if (barMenu.classList.contains('open')) toggleHamburger();
  });
}

// wires the animations on/off button and keeps its label in step with the paused state
function initializeAnimationToggle(): void {
  const animToggle = document.getElementById('nw-anim-toggle') as HTMLButtonElement;

  const syncLabel = (): void => {
    const paused = document.documentElement.classList.contains(PAUSED_CLASS);
    animToggle.textContent = paused ? 'Animations Off' : 'Animations On';
    animToggle.setAttribute('aria-pressed', String(!paused));
  };

  syncLabel();
  animToggle.addEventListener('click', () => {
    const nowPaused = !document.documentElement.classList.contains(PAUSED_CLASS);
    applyAnimPaused(nowPaused);
    localStorage.setItem(PAUSED_STORAGE_KEY, String(nowPaused));
    syncLabel();
  });
}

// wires the navbar settings button to open the settings dialog
function initializeSettingsButton(): void {
  document.getElementById('nw-settings')!.addEventListener('click', () =>
    showSettingsModal(() => [...store.entries()], showDataModal),
  );
}

// sets up every interactive part of the navbar
export function initializeNavbar(): void {
  initializeHamburger();
  initializeAnimationToggle();
  initializeSettingsButton();
}
