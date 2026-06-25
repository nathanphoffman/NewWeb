import { updateViewDataBtn } from "./markdownUpdates";
import { buildInfoMd, dataModalMd, showDataModal, store } from "./engineCode";
import { showModal } from "../ui";

// attaches a document click listener for wasm gear buttons, showing the script info modal on click
export function startGearButtonListener() {
    // gear info button — show script description and data declaration
    document.addEventListener('click', (e: MouseEvent) => {
        const btn = (e.target as Element).closest('.nw-wasm-info') as HTMLElement | null;
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const desc = btn.dataset.desc ?? '';
        const keys = btn.dataset.keys ? btn.dataset.keys.split(',').filter(Boolean) : [];
        showModal(buildInfoMd(desc, keys));
    });
}

// handles nw:viewdata and nw:cleardata internal link schemes for inspecting and resetting session data
export function handleNewWebPersonalDataLinks(e: MouseEvent, href: string) {
    if (href === 'nw:viewdata') { e.preventDefault(); showDataModal(); return; }
    if (href === 'nw:cleardata') {
        e.preventDefault();
        store.clear();
        updateViewDataBtn();
        const body = document.querySelector('dialog .nw-modal-body');
        if (body) body.innerHTML = window.newwebRender!(dataModalMd());
        return;
    }
}