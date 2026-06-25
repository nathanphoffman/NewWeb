import { handleMore, handleNav, looksLikeBareUrl, navigateTo, warnBareUrl } from "../nav";
import { scrollToAnchor } from "../ui";
import { extractALink, extractHrefAttribute } from "../utility";
import { handleNewWebPersonalDataLinks } from "./engineLinks";
import { handleWASMClick } from "./wasm";

// handles # links — navigates to a new page if the fragment looks like a path, otherwise scrolls to the anchor
export function handleHashOnClick(e: MouseEvent, href: string) {
    if (href.startsWith('#')) {
        e.preventDefault();
        const inner = href.slice(1);
        const basePart = inner.split('#')[0];
        if (basePart.includes('/') || basePart.endsWith('.md')) {
            navigateTo(inner);
        } else {
            const currentPage = location.hash.slice(1).split('#')[0] || 'main.md';
            history.replaceState({ mdUrl: currentPage, anchor: inner }, '', '#' + currentPage + '#' + inner);
            scrollToAnchor(inner);
        }
        return;
    }
}

// attaches the global document click interceptor that routes all link clicks by protocol or path type
export function startOnClickListeners() {

    // link interception — dispatch by protocol or treat bare paths as markdown
    document.addEventListener('click', (e: MouseEvent) => {

        const a = extractALink(e);
        const href = extractHrefAttribute(e, a);

        const isNotValidLink = !a || !href;
        if (isNotValidLink) return;

        handleHashOnClick(e, href);
        handleNewWebPersonalDataLinks(e, href);
        handleWASMClick(e, a, href);

        if (href.startsWith('more:')) { e.preventDefault(); handleMore(a); return; }
        if (href.startsWith('custom://')) { e.preventDefault(); handleNav(a); return; }

        // external links with explicit scheme — let browser handle
        if (href.startsWith('http://') || href.startsWith('https://')) return;

        // bare path — warn on localhost if it looks like a URL missing https://
        e.preventDefault();
        if (window.location.hostname === 'localhost' && looksLikeBareUrl(href)) {
            warnBareUrl(href);
            return;
        }
        navigateTo(href);
    });

}
