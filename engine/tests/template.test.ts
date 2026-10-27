import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processTemplate } from '../src/markdown/template';
import { mockFetch } from './helpers';

test('processTemplate replaces ${key} placeholders with values', async () => {
  assert.equal(await processTemplate('Hi ${name}!', { name: 'Ana' }), 'Hi Ana!');
});

test('processTemplate replaces a missing value with an empty string', async () => {
  assert.equal(await processTemplate('Hi ${name}!', {}), 'Hi !');
});

test('processTemplate repeats a partial for each item in a foreach array', async () => {
  mockFetch({ '/row.md': '- ${title}' });
  const out = await processTemplate('<!-- foreach: items use row.md -->', { items: [{ title: 'one' }, { title: 'two' }] });
  assert.equal(out, '- one\n- two');
});

test('processTemplate only includes an if partial when the key is truthy', async () => {
  mockFetch({ '/note.md': 'Note for ${who}' });
  const directive = '<!-- if: show use note.md -->';
  assert.equal(await processTemplate(directive, { show: true, who: 'Ana' }), 'Note for Ana');
  assert.equal(await processTemplate(directive, { show: false }), '');
});
