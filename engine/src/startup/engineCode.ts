import { showModal } from "../ui/modals";

export const store = new Map<string, string>();

// builds the markdown string for the session data modal, showing stored key-value pairs as a JSON block
export function dataModalMd(): string {
    const entries = [...store.entries()];
    const dataBlock = entries.length
        ? '```\n' + JSON.stringify(Object.fromEntries(entries), null, 2) + '\n```'
        : '_No data stored yet._';
    return `### Your Session Data\n\nThis data exists only for your current browser session — it is cleared when you leave or refresh the page. Sites use session data for logins, personalization, and data access.\n\n---\n\n${dataBlock}\n\n[Clear all data](nw:cleardata)`;
}

// opens the session data modal
export function showDataModal(): void {
    showModal(dataModalMd());
}

// builds markdown for the wasm script info modal, showing the description and which session keys it will access
export function buildInfoMd(desc: string, keys: string[]): string {
    const reasonSection = desc.trim()
        ? `### Why this script?\n${desc}`
        : `### ⚠ No description provided\nThe author of this page did not explain why this script needs to run.`;
    const dataSection = keys.length
        ? `\n\n### Data requested\nThis script will access: ${keys.map(k => `\`${k}\``).join(', ')}\n\nThese values will be read from your session.`
        : '';
    return reasonSection + dataSection + `\n\n[View your session data](nw:viewdata)`;
}