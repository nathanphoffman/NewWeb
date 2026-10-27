import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toRootRelative } from '../src/shared/utility';

test('toRootRelative puts a slash in front of a bare path', () => {
  assert.equal(toRootRelative('blog/coding.md'), '/blog/coding.md');
});

test('toRootRelative leaves absolute and external paths alone', () => {
  assert.equal(toRootRelative('/a.md'), '/a.md');
  assert.equal(toRootRelative('https://example.com/a.md'), 'https://example.com/a.md');
  assert.equal(toRootRelative('data:text/plain,hi'), 'data:text/plain,hi');
});
