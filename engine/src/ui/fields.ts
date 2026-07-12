import type { FieldDef } from '../types';

const KNOWN_TYPES = new Set(['text', 'email', 'password', 'number', 'tel', 'date', 'textarea']);

// converts a camelCase field name to a human-readable Title Case label
function camelToLabel(s: string): string {
  return s.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}

// parses a comma-separated field definition string (e.g. "name, age:number:3, role:admin|user") into FieldDef objects
export function parseFields(text: string): FieldDef[] {
  return text.split(',').map(s => s.trim()).filter(Boolean).map(def => {
    const colonIdx = def.indexOf(':');
    if (colonIdx === -1) {
      return { key: `form.${def}`, label: camelToLabel(def), type: 'text', maxlength: null, options: null };
    }
    const name = def.slice(0, colonIdx).trim();
    const rest = def.slice(colonIdx + 1).trim();
    const key = `form.${name}`;
    const label = camelToLabel(name);
    if (rest.includes('|')) {
      return { key, label, type: 'select', maxlength: null, options: rest.split('|').map(o => o.trim()) };
    }
    const sepIdx = rest.indexOf(':');
    const typePart = sepIdx === -1 ? rest : rest.slice(0, sepIdx);
    const limitStr = sepIdx === -1 ? '' : rest.slice(sepIdx + 1);
    if (KNOWN_TYPES.has(typePart)) {
      const parsed = limitStr ? parseInt(limitStr, 10) : null;
      const maxlength = parsed !== null && !isNaN(parsed) ? parsed : null;
      return { key, label, type: typePart, maxlength, options: null };
    }
    return { key, label, type: 'text', maxlength: null, options: null };
  });
}
