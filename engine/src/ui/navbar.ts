import { showSettingsModal } from '../settings';
import { showDataModal, store } from '../startup/engineCode';
import { applyAnimPaused } from '../theme';

export function initializeNavbar()
{
    // hamburger toggle
    const hamburger = document.getElementById('nw-hamburger') as HTMLButtonElement;
    const barMenu   = document.getElementById('nw-bar-menu') as HTMLDivElement;
    hamburger.addEventListener('click', () => {
      const open = barMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
    });
    

    const animToggle = document.getElementById('nw-anim-toggle') as HTMLButtonElement;
    const syncAnimToggleLabel = () => {
      const paused = document.documentElement.classList.contains('nw-paused');
      animToggle.textContent = paused ? 'Animations Off' : 'Animations On';
      animToggle.setAttribute('aria-pressed', String(!paused));
    };
    syncAnimToggleLabel();
    animToggle.addEventListener('click', () => {
      const nowPaused = !document.documentElement.classList.contains('nw-paused');
      applyAnimPaused(nowPaused);
      localStorage.setItem('nw-paused', String(nowPaused));
      syncAnimToggleLabel();
    });

    document.getElementById('nw-settings')!.addEventListener('click', () =>
      showSettingsModal(
        () => [...store.entries()],
        showDataModal,
      )
    );
   
}