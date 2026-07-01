const defaultTitle = document.title;

// reads a <!-- title: Page Title --> comment from markdown and sets the document title, resetting to the site default if the page doesn't declare one
export function applyTitleDirective(md: string): void {
  const match = md.match(/<!--\s*title\s*:\s*(.+?)\s*-->/i);
  document.title = match ? match[1] : defaultTitle;
}
