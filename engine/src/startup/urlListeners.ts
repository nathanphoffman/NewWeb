import { renderNoData } from "../nav";
import { scrollToAnchor } from "../ui";

// restores the correct page when the user navigates back or forward in browser history
export function startBackAndForwardListener() {
  // back/forward navigation
  window.addEventListener('popstate', async (e: PopStateEvent) => {
    const state = e.state as { mdUrl?: string; anchor?: string | null } | null;
    const url = state?.mdUrl ?? (location.pathname === '/' ? 'main.md' : `${location.pathname.slice(1)}.md`);
    await renderNoData(url);
    const anchor = state?.anchor ?? (location.hash ? location.hash.slice(1) : null);
    if (anchor) scrollToAnchor(anchor);
  });
}
