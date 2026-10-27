import { renderNoData } from "../navigation/nav";
import { scrollToAnchor } from "../ui/page";

// restores the correct page when the user navigates back or forward in browser history
export function startBackAndForwardListener() {
  // back/forward navigation
  window.addEventListener('popstate', async (event: PopStateEvent) => {
    const state = event.state as { mdUrl?: string; anchor?: string | null } | null;
    const address = state?.mdUrl ?? (location.pathname === '/' ? 'main.md' : `${location.pathname}.md`);
    await renderNoData(address);
    const anchor = state?.anchor ?? (location.hash ? location.hash.slice(1) : null);

    if (anchor) scrollToAnchor(anchor);
  });
}
