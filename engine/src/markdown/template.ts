import { toRootRelative } from '../shared/utility';

// replaces ${key} placeholders in text with values from the context object
function interpolate(text: string, context: Record<string, unknown>): string {
  // matches ${key} placeholders and captures the key name
  return text.replace(/\$\{([^}]+)\}/g, (_, entryKey) => {
    const value = context[entryKey.trim()];

    return value != null ? String(value) : '';
  });
}

// fetches each partial once and returns them keyed by url
async function fetchPartials(urls: string[]): Promise<Map<string, string>> {
  const partialMap = new Map<string, string>();
  await Promise.all(urls.map(async address => {
    partialMap.set(address, await fetch(toRootRelative(address)).then(response => response.text()));
  }));

  return partialMap;
}

// expands <!-- foreach: array use partial.md --> directives by fetching the partial and repeating it for each array item
async function processForeach(markdown: string, data: Record<string, unknown>): Promise<string> {
  // matches <!-- foreach: array use partial.md --> and captures the array key and partial path
  const pattern = /<!--\s*foreach:\s+(\S+)\s+use\s+(\S+)\s*-->/g;
  const matches = [...markdown.matchAll(pattern)];

  if (matches.length === 0) return markdown;

  const urls = [...new Set(
    matches
      .filter(match => Array.isArray(data[match[1]]) && (data[match[1]] as unknown[]).length > 0)
      .map(match => match[2])
  )];

  const partialMap = await fetchPartials(urls);

  return markdown.replace(pattern, (_, arrayKey, address) => {
    const items = data[arrayKey];

    if (!Array.isArray(items)) return '';
    const partial = partialMap.get(address)!;

    return items.map(item => {
      const context = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {};

      return interpolate(partial, context);
    }).join('\n');
  });
}

// replaces <!-- if: key use partial.md --> directives with the fetched partial when the key is truthy
async function processIf(markdown: string, data: Record<string, unknown>): Promise<string> {
  // matches <!-- if: key use partial.md --> and captures the key and partial path
  const pattern = /<!--\s*if:\s+(\S+)\s+use\s+(\S+)\s*-->/g;
  const matches = [...markdown.matchAll(pattern)];

  if (matches.length === 0) return markdown;

  const urls = [...new Set(matches.filter(match => data[match[1]]).map(match => match[2]))];
  const partialMap = await fetchPartials(urls);

  return markdown.replace(pattern, (_, boolKey, address) => {
    if (!data[boolKey]) return '';

    return interpolate(partialMap.get(address)!, data);
  });
}

// applies interpolation, foreach, and if template passes to a markdown string in order
export async function processTemplate(markdown: string, data: Record<string, unknown>): Promise<string> {
  let result = interpolate(markdown, data);
  result = await processForeach(result, data);
  result = await processIf(result, data);

  return result;
}
