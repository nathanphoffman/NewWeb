import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFields } from '../src/ui/fields';

test('parseFields turns a bare name into a text field with a readable label', () => {
  assert.deepEqual(parseFields('firstName'), [
    { key: 'form.firstName', label: 'First Name', type: 'text', maxlength: null, options: null },
  ]);
});

test('parseFields reads a type and a max length', () => {
  const [age] = parseFields('age:number:3');
  assert.equal(age.type, 'number');
  assert.equal(age.maxlength, 3);
});

test('parseFields turns pipe separated values into a select with options', () => {
  const [role] = parseFields('role:admin|user');
  assert.equal(role.type, 'select');
  assert.deepEqual(role.options, ['admin', 'user']);
});

test('parseFields falls back to text for an unknown type', () => {
  assert.equal(parseFields('nick:weird')[0].type, 'text');
});

test('parseFields splits several fields on commas and skips empty ones', () => {
  assert.equal(parseFields('a, b,, c').length, 3);
});
