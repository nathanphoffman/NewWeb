import { updateViewDataBtn } from "./markdownUpdates";
import { buildInfoMd, dataModalMd, showDataModal, store } from "./engineCode";
import { showMarkdownModal } from "../ui/overlays/modals";

// attaches a document click listener for wasm gear buttons, showing the script info modal on click
export function startGearButtonListener() {
    // gear info button — show script description and data declaration
    document.addEventListener('click', (event: MouseEvent) => {
        const button = (event.target as Element).closest('.nw-wasm-info') as HTMLElement | null;

        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        const desc = button.dataset.desc ?? '';
        const keys = button.dataset.keys ? button.dataset.keys.split(',').filter(Boolean) : [];
        showMarkdownModal(buildInfoMd(desc, keys));
    });
}

// handles nw:viewdata and nw:cleardata internal link schemes for inspecting and resetting session data
export function handleNewWebPersonalDataLinks(event: MouseEvent, href: string) {
    if (href === 'nw:viewdata') { event.preventDefault(); showDataModal(); return; }

    if (href === 'nw:cleardata') {
        event.preventDefault();
        store.clear();
        updateViewDataBtn();
        const body = document.querySelector('dialog .nw-modal-body');

        if (body) body.innerHTML = window.newwebRender!(dataModalMd());

        return;
    }
}
