import Prism from 'prismjs';

// this was an experimental highlight customization
//  -- in theory this is only to be appied in certain cases
Prism.languages['deor'] = {
  comment: {
    pattern: /#.*/,
    greedy: true,
  },
  string: {
    pattern: /"(?:[^"\\]|\\.)*"/,
    greedy: true,
  },
  keyword: /\b(?:fn|type|for|if|return|in|as|with|none|insert|and|or|not|else|is|known|result)\b|\bstruct\+?/,
  'builtin-type': /\b(?:int|string|bool|list)\b/,
  builtin: /\b(?:rand|floor|sqrt|print|range)\b/,
  boolean: /\b(?:true|false)\b/,
  number: /\b\d+(?:\.\d+)?\b/,
  operator: />=|<=|==|!=|[+\-*/=<>]/,
  punctuation: /[(),[\]]/,
} satisfies Prism.Grammar;

// applies Prism syntax highlighting to all language-tagged code blocks within a container
export function highlightBlock(container: Element): void {
  container.querySelectorAll<HTMLElement>('code[class*="language-"]').forEach(el => {
    Prism.highlightElement(el);
  });
}
