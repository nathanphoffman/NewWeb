export function startTerminalCursor(): void {
  if (document.documentElement.classList.contains('nw-paused')) return;
  stopTerminalCursor();
  const content = document.getElementById('content');
  if (!content) return;
  const paras = Array.from(content.querySelectorAll('p'));

  // Walk paragraphs last-to-first. For each, only inspect its direct text node
  // children — no recursion into links, images, or any inline element.
  for (let pi = paras.length - 1; pi >= 0; pi--) {
    const p = paras[pi];
    const directText: Text[] = [];
    for (const child of p.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) directText.push(child as Text);
    }

    for (let i = directText.length - 1; i >= 0; i--) {
      const tn = directText[i];
      const text = tn.textContent ?? '';
      let pos = -1;
      for (let j = text.length - 1; j >= 0; j--) {
        if (/\S/.test(text[j])) { pos = j; break; }
      }
      if (pos === -1) continue;

      const after = tn.splitText(pos + 1);
      const cursor = document.createElement('span');
      cursor.className = 'nw-term-cursor';
      after.parentNode!.insertBefore(cursor, after);
      return;
    }
  }
}

export function stopTerminalCursor(): void {
  document.querySelectorAll('.nw-term-cursor').forEach(el => el.remove());
}

document.addEventListener('nw-page-rendered', () => {
  const theme = document.documentElement.getAttribute('data-theme');
  const paused = document.documentElement.classList.contains('nw-paused');
  if (theme === 'scribe' && !paused) startTerminalCursor();
});
