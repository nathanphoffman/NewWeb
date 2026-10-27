import { ERROR_TOAST_TYPE, HREF_ATTRIBUTE, MORE_PREFIX } from '../shared/constants';
import { showToast } from '../ui/overlays/toast';
import { showMarkdownModal } from '../ui/overlays/modals';
import { fetchMd, renderNoData } from './nav';
import { prettyUrl, toMarkdownPath } from './navPaths';

// like navigateTo but replaces the current history entry instead of pushing a new one
export async function replacePage(path: string, anchor: string | null = null): Promise<void> {
  const mdPath = toMarkdownPath(path);
  history.replaceState({ mdUrl: mdPath, anchor }, '', prettyUrl(mdPath, anchor));
  await renderNoData(mdPath);
}

// fetches markdown from a "more:" link and displays it in a modal
export async function handleMore(anchor: HTMLAnchorElement): Promise<void> {
  const address = anchor.getAttribute(HREF_ATTRIBUTE)!.replace(MORE_PREFIX, '');
  const markdown = await fetchMd(address);
  showMarkdownModal(markdown);
}

// shows an error toast suggesting the user add https:// to a link that looks like a bare URL
export function warnBareUrl(href: string): void {
  showToast(`Link "${href}" looks like a URL — did you mean https://${href}?`, ERROR_TOAST_TYPE);
}

