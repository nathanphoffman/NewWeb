import { CLICK_EVENT, HTTPS_PREFIX, HTTP_PREFIX, MORE_PREFIX } from '../shared/constants';
import { navigateTo } from "../navigation/nav";
import { handleMore, warnBareUrl } from "../navigation/navLinks";
import { looksLikeBareUrl } from "../navigation/navPaths";
import { extractALink, extractHrefAttribute } from "../shared/utility";
import { handleNewWebPersonalDataLinks } from "./engineLinks";
import { handleWASMClick } from "./wasmClicks";

const CUSTOM_PREFIX = 'custom://';
const LOCAL_HOSTNAME = 'localhost';

// same-page anchor links (`#section`) are left alone — the browser handles the
// scroll and history entry natively, no JS involvement needed
function isSamePageAnchor(href: string): boolean {
    return href.startsWith('#');
}

// links with an explicit http(s) scheme are left to the browser
function isExternalLink(href: string): boolean {
    return href.startsWith(HTTP_PREFIX) || href.startsWith(HTTPS_PREFIX);
}

// treats a bare path as a markdown page, but on localhost warns about links that look like a URL missing https://
function openBarePath(href: string): void {
    if (window.location.hostname === LOCAL_HOSTNAME && looksLikeBareUrl(href)) {
        warnBareUrl(href);

        return;
    }

    navigateTo(href);
}

// routes one link click by its protocol or path type
function routeLinkClick(event: MouseEvent, anchor: HTMLAnchorElement, href: string): void {
    handleNewWebPersonalDataLinks(event, href);
    handleWASMClick(event, anchor, href);

    if (href.startsWith(MORE_PREFIX)) {
        event.preventDefault();
        handleMore(anchor);

        return;
    }

    if (isExternalLink(href)) return;

    event.preventDefault();

    if (href.startsWith(CUSTOM_PREFIX)) navigateTo(href);
    else openBarePath(href);
}

// attaches the global document click interceptor that routes all link clicks by protocol or path type
export function startOnClickListeners() {
    // one listener on the document covers every link, including links added later by page renders
    document.addEventListener(CLICK_EVENT, (event: MouseEvent) => {
        const anchor = extractALink(event);
        const href = extractHrefAttribute(event, anchor);

        if (!anchor || !href || isSamePageAnchor(href)) return;

        routeLinkClick(event, anchor, href);
    });
}
