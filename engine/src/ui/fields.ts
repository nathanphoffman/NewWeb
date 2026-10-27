import { DECIMAL_RADIX } from '../shared/constants';
import type { FieldDef } from '../shared/types';

const KNOWN_TYPES = new Set(['text', 'email', 'password', 'number', 'tel', 'date', 'textarea']);

// converts a camelCase field name to a human-readable Title Case label
function camelToLabel(text: string): string {
  // puts a space before each capital letter, then capitalizes the first character (firstName -> First Name)
  return text.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase());
}

// parses a comma-separated field definition string (e.g. "name, age:number:3, role:admin|user") into FieldDef objects
export function parseFields(text: string): FieldDef[] {
  return text.split(',').map(text => text.trim()).filter(Boolean).map(definition => {
    const colonIdx = definition.indexOf(':');

    if (colonIdx === -1) {
      return { key: `form.${definition}`, label: camelToLabel(definition), type: 'text', maxlength: null, options: null };
    }

    const name = definition.slice(0, colonIdx).trim();
    const rest = definition.slice(colonIdx + 1).trim();
    const entryKey = `form.${name}`;
    const label = camelToLabel(name);

    if (rest.includes('|')) {
      return { key: entryKey, label, type: 'select', maxlength: null, options: rest.split('|').map(o => o.trim()) };
    }

    const sepIdx = rest.indexOf(':');
    const typePart = sepIdx === -1 ? rest : rest.slice(0, sepIdx);
    const limitStr = sepIdx === -1 ? '' : rest.slice(sepIdx + 1);

    if (KNOWN_TYPES.has(typePart)) {
      const parsed = limitStr ? parseInt(limitStr, DECIMAL_RADIX) : null;
      const maxlength = parsed !== null && !Number.isNaN(parsed) ? parsed : null;

      return { key: entryKey, label, type: typePart, maxlength, options: null };
    }

    return { key: entryKey, label, type: 'text', maxlength: null, options: null };
  });
}
