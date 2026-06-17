import { renderNoData } from "../nav";
import { scrollToAnchor } from "../ui";

export function startBackAndForwardListener() {
  // back/forward navigation
  window.addEventListener('popstate', async (e: PopStateEvent) => {
    const state = e.state as { mdUrl?: string; anchor?: string | null } | null;
    const url = state?.mdUrl ?? 'main.md';
    await renderNoData(url);
    if (state?.anchor) scrollToAnchor(state.anchor);
  });
}

export function startHashChangeListener() {
  // manual URL edits (typing in address bar, hitting Enter)
  // Skip if history.state is set — that means popstate already handled it (back/forward),
  // or we pushed this entry ourselves via pushState/replaceState.
  window.addEventListener('hashchange', async () => {
    if (history.state) return;
    const hashVal = location.hash.slice(1) || 'main';
    const [page, anchor = null] = hashVal.split('#');
    await renderNoData(page || 'main.md');
    if (anchor) scrollToAnchor(anchor);
  });
}
