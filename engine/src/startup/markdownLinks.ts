import { navigateTo } from "../navigation/nav";
import { handleMore, warnBareUrl } from "../navigation/navLinks";
import { looksLikeBareUrl } from "../navigation/navPaths";
import { extractALink, extractHrefAttribute } from "../shared/utility";
import { handleNewWebPersonalDataLinks } from "./engineLinks";
import { handleWASMClick } from "./wasm";

// same-page anchor links (`#section`) are left alone — the browser handles the
// scroll and history entry natively, no JS involvement needed
function isSamePageAnchor(href: string): boolean {
    return href.startsWith('#');
}

// attaches the global document click interceptor that routes all link clicks by protocol or path type
export function startOnClickListeners() {

    // link interception — dispatch by protocol or treat bare paths as markdown
    document.addEventListener('click', (event: MouseEvent) => {

        const anchor = extractALink(event);
        const href = extractHrefAttribute(event, anchor);

        const isNotValidLink = !anchor || !href;

        if (isNotValidLink) return;

        if (isSamePageAnchor(href)) return;
        handleNewWebPersonalDataLinks(event, href);
        handleWASMClick(event, anchor, href);

        if (href.startsWith('more:')) { event.preventDefault(); handleMore(anchor); return; }

        if (href.startsWith('custom://')) { event.preventDefault(); navigateTo(href); return; }

        // external links with explicit scheme — let browser handle
        if (href.startsWith('http://') || href.startsWith('https://')) return;

        // bare path — warn on localhost if it looks like a URL missing https://
        event.preventDefault();

        if (window.location.hostname === 'localhost' && looksLikeBareUrl(href)) {
            warnBareUrl(href);

            return;
        }

        navigateTo(href);
    });

}
