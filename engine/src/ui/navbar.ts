import { showSettingsModal } from '../settings';
import { showDataModal, store } from '../startup/engineCode';
import { applyAnimPaused } from '../theme';

export function initializeNavbar()
{



    // hamburger toggle
    const hamburger = document.getElementById('nw-hamburger') as HTMLButtonElement;
    const barMenu   = document.getElementById('nw-bar-menu') as HTMLDivElement;

    function toggleHamburger() {
      const open = barMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
    }


    // hamburger.addEventListener('click', () => {
        // toggleHamburger()
    // });

    document.body.addEventListener('click', (e)=>{

        if((e.target as HTMLElement)?.id === "nw-hamburger") toggleHamburger();
        // if it is on the newbar it could be on the hamburger button
        else if((e.target as HTMLElement)?.id === "nw-bar") return;
        else if((e.target as HTMLElement)?.id === "nw-bar-menu") return;

        // allow closing the hamburger on any click outside the navbar if it is open
        else if(barMenu.classList.contains('open')) toggleHamburger();        
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