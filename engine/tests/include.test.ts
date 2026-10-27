import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processIncludes } from '../src/markdown/include';
import { mockFetch } from './helpers';

test('processIncludes returns the markdown unchanged when it has no include directive', async () => {
  assert.equal(await processIncludes('# Hello'), '# Hello');
});

test('processIncludes joins several files in the order they are listed', async () => {
  mockFetch({ '/a.md': 'A', '/b.md': 'B' });
  assert.equal(await processIncludes('<!-- include: a.md, b.md -->'), 'A\n\nB');
});

test('processIncludes sorts entries by heading and honours sort_dir', async () => {
  mockFetch({ '/posts.md': '# Banana\nb\n# Apple\na' });
  const out = await processIncludes('<!-- include: posts.md, sort: #, sort_dir: desc -->');
  assert.equal(out, '# Banana\nb\n\n# Apple\na');
});

test('processIncludes truncates the sorted list with limit_to', async () => {
  mockFetch({ '/posts.md': '# A\n1\n# B\n2\n# C\n3' });
  const out = await processIncludes('<!-- include: posts.md, sort: #, limit_to: 2 -->');
  assert.equal(out, '# A\n1\n\n# B\n2');
});

test('processIncludes expands one level of includes nested inside an included file', async () => {
  mockFetch({ '/outer.md': 'top <!-- include: inner.md -->', '/inner.md': 'deep' });
  assert.equal(await processIncludes('<!-- include: outer.md -->'), 'top deep');
});
