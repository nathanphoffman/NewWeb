import Prism from 'prismjs';

// mirrors the deor.tmLanguage.json vscode grammar — pattern order below
// matches that grammar's `patterns` precedence list.
Prism.languages.deor = {
  comment: {
    // a # starts a comment that runs to the end of the line
    pattern: /#.*/,
    greedy: true,
  },
  string: {
    // a double quoted string, allowing backslash escapes inside
    pattern: /"(?:[^"\\]|\\.)*"/,
    greedy: true,
    inside: {
      // {name} placeholders inside strings
      variable: /\{[a-z_][a-z0-9_]*\}/,
      // a backslash plus the character it escapes
      escape: /\\./,
    },
  },
  // struct-definition + type-definition: `struct`/`struct+`/`struct*`/`type` NAME
  'type-definition': {
    // the struct or type keyword followed by a PascalCase name
    pattern: /\b(?:struct[+*]?|type)\s+[A-Z][A-Za-z0-9_]*/,
    inside: {
      // just the leading keyword of the match above
      keyword: /^(?:struct[+*]?|type)/,
      // just the trailing type name of the match above
      'class-name': /[A-Z][A-Za-z0-9_]*$/,
    },
  },
  // enum-definition + shape-definition: `enum`/`shape` camelCaseName
  'shape-definition': {
    // the enum or shape keyword followed by a camelCase name
    pattern: /\b(?:enum|shape)\s+[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*/,
    inside: {
      // just the leading keyword of the match above
      keyword: /^(?:enum|shape)/,
      // just the trailing camelCase name of the match above
      'class-name': /[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*$/,
    },
  },
  // keyword-fn + keywords-storage + keywords-control + keywords-other
  // whole-word language keywords
  keyword: /\b(?:fn|const|private|raw|import|if|else|for|return|break|continue|crash|using|move|block|as|in|with|is|and|or|not|avow|of|to|where|rust|end|remove|at)\b/,
  // whole-word built-in type names
  'builtin-type': /\b(?:int|float|bool|string|bytes|list|func|void|macro|macro_run|macro_block|raw)\b/,
  // whole-word boolean and valid/empty literals
  boolean: /\b(?:true|false|valid|empty)\b/,
  // digits with optional _ separators and an optional fractional part
  number: /\b\d[\d_]*(?:\.[\d_]+)?\b/,
  // shape-name (camelCase) then user-type (PascalCase)
  'class-name': [
    // camelCase names (a lowercase start with at least one capital)
    /\b[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*\b/,
    // PascalCase names
    /\b[A-Z][A-Za-z0-9_]*\b/,
  ],
  'macro-bang': {
    // a name ending in ! is a macro call
    pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*!/,
    alias: 'function',
  },
  'function-call': {
    // a name followed by ( is a function call; the lookahead keeps the ( out of the match
    pattern: /\b[a-z_][a-z0-9_]*(?=\s*\()/,
    alias: 'function',
  },
  // compound assignment and comparison operators, then single character operators, then a lone = that isn't part of ==, !=, <= or >=
  operator: /\+=|-=|\*=|\/=|%=|<=|>=|==|!=|&&|\|\||[+\-*/%<>]|(?<![=!<>+\-*/%])=(?![=])/,
} satisfies Prism.Grammar;

// applies Prism syntax highlighting to all language-tagged code blocks within a container
export function highlightBlock(container: Element): void {
  container.querySelectorAll<HTMLElement>('code[class*="language-"]').forEach(el => {
    Prism.highlightElement(el);
  });
}
