// replaces ${key} placeholders in text with values from the context object
function interpolate(text: string, ctx: Record<string, unknown>): string {
  return text.replace(/\$\{([^}]+)\}/g, (_, key) => {
    const val = ctx[key.trim()];
    return val != null ? String(val) : '';
  });
}

// expands <!-- foreach: array use partial.md --> directives by fetching the partial and repeating it for each array item
async function processForeach(md: string, data: Record<string, unknown>): Promise<string> {
  const pattern = /<!--\s*foreach:\s+(\S+)\s+use\s+(\S+)\s*-->/g;
  const matches = [...md.matchAll(pattern)];
  if (matches.length === 0) return md;

  const urls = [...new Set(
    matches
      .filter(m => Array.isArray(data[m[1]]) && (data[m[1]] as unknown[]).length > 0)
      .map(m => m[2])
  )];
  const partialMap = new Map<string, string>();
  await Promise.all(urls.map(async url => {
    partialMap.set(url, await fetch(url).then(r => r.text()));
  }));

  return md.replace(pattern, (_, arrayKey, url) => {
    const arr = data[arrayKey];
    if (!Array.isArray(arr)) return '';
    const partial = partialMap.get(url)!;
    return arr.map(item => {
      const ctx = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {};
      return interpolate(partial, ctx);
    }).join('\n');
  });
}

// replaces <!-- if: key use partial.md --> directives with the fetched partial when the key is truthy
async function processIf(md: string, data: Record<string, unknown>): Promise<string> {
  const pattern = /<!--\s*if:\s+(\S+)\s+use\s+(\S+)\s*-->/g;
  const matches = [...md.matchAll(pattern)];
  if (matches.length === 0) return md;

  const urls = [...new Set(matches.filter(m => data[m[1]]).map(m => m[2]))];
  const partialMap = new Map<string, string>();
  await Promise.all(urls.map(async url => {
    partialMap.set(url, await fetch(url).then(r => r.text()));
  }));

  return md.replace(pattern, (_, boolKey, url) => {
    if (!data[boolKey]) return '';
    return interpolate(partialMap.get(url)!, data);
  });
}

// applies interpolation, foreach, and if template passes to a markdown string in order
export async function processTemplate(md: string, data: Record<string, unknown>): Promise<string> {
  let result = interpolate(md, data);
  result = await processForeach(result, data);
  result = await processIf(result, data);
  return result;
}
