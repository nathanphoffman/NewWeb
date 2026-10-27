import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractRefreshWasm, looksLikeBareUrl, prettyUrl, splitAnchor, toMarkdownPath } from '../src/navigation/navPaths';

test('looksLikeBareUrl flags hrefs that contain a common top level domain', () => {
  assert.equal(looksLikeBareUrl('example.com/page'), true);
  assert.equal(looksLikeBareUrl('about'), false);
});

test('splitAnchor separates the page from its #section', () => {
  assert.deepEqual(splitAnchor('page.md#intro'), ['page.md', 'intro']);
});

test('splitAnchor returns a null anchor when there is no #', () => {
  assert.deepEqual(splitAnchor('page.md'), ['page.md', null]);
});

test('prettyUrl drops .md and adds a leading slash', () => {
  assert.equal(prettyUrl('blog/post.md', null), '/blog/post');
});

test('prettyUrl keeps the anchor on the end', () => {
  assert.equal(prettyUrl('/about.md', 'team'), '/about#team');
});

test('extractRefreshWasm reads the wasm file from a refresh comment', () => {
  assert.equal(extractRefreshWasm('# Hi\n<!-- refresh: src/order.wasm -->'), 'src/order.wasm');
});

test('extractRefreshWasm returns null when the page has no refresh comment', () => {
  assert.equal(extractRefreshWasm('# Hi'), null);
});

test('toMarkdownPath adds a missing .md and makes the path root-relative', () => {
  assert.equal(toMarkdownPath('blog/post'), '/blog/post.md');
  assert.equal(toMarkdownPath('/a.md'), '/a.md');
});
