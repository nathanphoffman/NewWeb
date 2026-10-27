import { renderPage, scrollToAnchor } from '../ui/page';
import { applyThemeSuggestion } from '../themes/theme';
import { applyTitleDirective } from '../markdown/title';
import { applyLogoDirective } from '../markdown/logo';
import { processIncludes } from '../markdown/include';
import { processTemplate } from '../markdown/template';
import { toRootRelative } from '../shared/utility';
import { extractRefreshWasm, prettyUrl, splitAnchor, toMarkdownPath } from './navPaths';

// fetches the text content of a markdown file
export function fetchMd(url: string): Promise<string> {
  return fetch(toRootRelative(url)).then(r => r.text());
}

// resolves a path to its markdown url, fetches it, applies its page directives and expands includes
async function loadPageMarkdown(path: string): Promise<{ mdPath: string; anchor: string | null; composed: string }> {
  const [basePath, anchor] = splitAnchor(path);
  const mdPath = toMarkdownPath(basePath);
  const raw = await fetchMd(mdPath);

  applyThemeSuggestion(raw);
  applyTitleDirective(raw);
  applyLogoDirective(raw);

  return { mdPath, anchor, composed: await processIncludes(raw) };
}

// pushes a browser history entry so back/forward return to this page
function pushHistory(mdPath: string, anchor: string | null): void {
  history.pushState({ mdUrl: mdPath, anchor }, '', prettyUrl(mdPath, anchor));
}

// fetches and renders a markdown page, pushing a new browser history entry
export async function navigateTo(path: string): Promise<void> {
  const { mdPath, anchor, composed } = await loadPageMarkdown(path);
  pushHistory(mdPath, anchor);
  await renderPage(composed);

  if (anchor) scrollToAnchor(anchor);
}

// like navigateTo but runs the markdown through template processing with data before rendering
export async function navigateWithData(path: string, data: Record<string, unknown>): Promise<void> {
  const { mdPath, anchor, composed } = await loadPageMarkdown(path);
  const md = await processTemplate(composed, data);

  pushHistory(mdPath, anchor);
  await renderPage(md);

  if (anchor) scrollToAnchor(anchor);
}

// renders a page without wasm data; prepends a "load now" prompt if the page declares a wasm dependency
export async function renderNoData(mdPath: string): Promise<void> {
  const raw = await fetchMd(mdPath);
  applyThemeSuggestion(raw);
  applyTitleDirective(raw);
  applyLogoDirective(raw);
  const refreshWasm = extractRefreshWasm(raw);
  const composed = await processIncludes(raw);

  if (refreshWasm) {
    const notice = `> _This page requires data to display._ [Load now](wasm:${refreshWasm})\n\n`;
    await renderPage(await processTemplate(notice + composed, {}));
  } else {
    await renderPage(composed);
  }
}

