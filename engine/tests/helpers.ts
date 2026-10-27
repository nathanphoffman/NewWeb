// replaces the global fetch with one that serves files from an in-memory map, so tests never touch the network
export function mockFetch(files: Record<string, string>): void {
  globalThis.fetch = (async (url: string) => {
    const text = files[url];

    if (text === undefined) throw new Error(`unexpected fetch: ${url}`);

    return { text: async () => text } as Response;
  }) as typeof fetch;
}
