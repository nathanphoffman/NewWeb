import Prism from 'prismjs';

// mirrors the deor.tmLanguage.json vscode grammar — pattern order below
// matches that grammar's `patterns` precedence list.
Prism.languages['deor'] = {
  comment: {
    pattern: /#.*/,
    greedy: true,
  },
  string: {
    pattern: /"(?:[^"\\]|\\.)*"/,
    greedy: true,
    inside: {
      variable: /\{[a-z_][a-z0-9_]*\}/,
      escape: /\\./,
    },
  },
  // struct-definition + type-definition: `struct`/`struct+`/`struct*`/`type` NAME
  'type-definition': {
    pattern: /\b(?:struct[+*]?|type)\s+[A-Z][A-Za-z0-9_]*/,
    inside: {
      keyword: /^(?:struct[+*]?|type)/,
      'class-name': /[A-Z][A-Za-z0-9_]*$/,
    },
  },
  // enum-definition + shape-definition: `enum`/`shape` camelCaseName
  'shape-definition': {
    pattern: /\b(?:enum|shape)\s+[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*/,
    inside: {
      keyword: /^(?:enum|shape)/,
      'class-name': /[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*$/,
    },
  },
  // keyword-fn + keywords-storage + keywords-control + keywords-other
  keyword: /\b(?:fn|const|private|raw|import|if|else|for|return|break|continue|crash|using|move|block|as|in|with|is|and|or|not|avow|of|to|where|rust|end|remove|at)\b/,
  'builtin-type': /\b(?:int|float|bool|string|bytes|list|func|void|macro|macro_run|macro_block|raw)\b/,
  boolean: /\b(?:true|false|valid|empty)\b/,
  number: /\b\d[\d_]*(?:\.[\d_]+)?\b/,
  // shape-name (camelCase) then user-type (PascalCase)
  'class-name': [
    /\b[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*\b/,
    /\b[A-Z][A-Za-z0-9_]*\b/,
  ],
  'macro-bang': {
    pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*!/,
    alias: 'function',
  },
  'function-call': {
    pattern: /\b[a-z_][a-z0-9_]*(?=\s*\()/,
    alias: 'function',
  },
  operator: /\+=|-=|\*=|\/=|%=|<=|>=|==|!=|&&|\|\||[+\-*/%<>]|(?<![=!<>+\-*/%])=(?![=])/,
} satisfies Prism.Grammar;

// applies Prism syntax highlighting to all language-tagged code blocks within a container
export function highlightBlock(container: Element): void {
  container.querySelectorAll<HTMLElement>('code[class*="language-"]').forEach(el => {
    Prism.highlightElement(el);
  });
}