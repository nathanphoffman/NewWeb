import { handleMore, handleNav, looksLikeBareUrl, navigateTo, warnBareUrl } from "../nav";
import { extractALink, extractHrefAttribute } from "../utility";
import { handleNewWebPersonalDataLinks } from "./engineLinks";
import { handleWASMClick } from "./wasm";

// same-page anchor links (`#section`) are left alone — the browser handles the
// scroll and history entry natively, no JS involvement needed
export function isSamePageAnchor(href: string): boolean {
    return href.startsWith('#');
}

// attaches the global document click interceptor that routes all link clicks by protocol or path type
export function startOnClickListeners() {

    // link interception — dispatch by protocol or treat bare paths as markdown
    document.addEventListener('click', (e: MouseEvent) => {

        const a = extractALink(e);
        const href = extractHrefAttribute(e, a);

        const isNotValidLink = !a || !href;
        if (isNotValidLink) return;

        if (isSamePageAnchor(href)) return;
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
