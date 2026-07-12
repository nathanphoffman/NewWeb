import { navigateTo } from '../nav';
import { showSettingsModal } from '../settings';
import { showDataModal, store } from '../startup/engineCode';

export function initializeNavbar()
{
    // hamburger toggle
    const hamburger = document.getElementById('nw-hamburger') as HTMLButtonElement;
    const barMenu   = document.getElementById('nw-bar-menu') as HTMLDivElement;
    hamburger.addEventListener('click', () => {
      const open = barMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
    });
    

    document.getElementById('nw-home')!.addEventListener('click', () => {
      const barMenu = document.getElementById('nw-bar-menu');
      const hamburger = document.getElementById('nw-hamburger');
      barMenu?.classList.remove('open');
      hamburger?.setAttribute('aria-expanded', 'false');
      navigateTo('main');
      console.log("clicked")
    });

    document.getElementById('nw-settings')!.addEventListener('click', () =>
      showSettingsModal(
        () => [...store.entries()],
        showDataModal,
      )
    );
   
}