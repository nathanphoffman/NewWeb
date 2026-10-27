import { DECIMAL_RADIX } from '../shared/constants';
import type { FieldDef } from '../shared/types';

const KNOWN_TYPES = new Set(['text', 'email', 'password', 'number', 'tel', 'date', 'textarea']);

// converts a camelCase field name to a human-readable Title Case label
function camelToLabel(text: string): string {
  // puts a space before each capital letter, then capitalizes the first character (firstName -> First Name)
  return text.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase());
}

const DEFAULT_FIELD_TYPE = 'text';
const FIELD_KEY_PREFIX = 'form.';

// builds a FieldDef, filling in the parts every field shares
function makeField(name: string, overrides: Partial<FieldDef> = {}): FieldDef {
  return {
    key: `${FIELD_KEY_PREFIX}${name}`,
    label: camelToLabel(name),
    type: DEFAULT_FIELD_TYPE,
    maxlength: null,
    options: null,
    ...overrides,
  };
}

// reads the digit limit from text like "3", returning null when it is missing or not a number
function parseLimit(limitText: string): number | null {
  const parsed = parseInt(limitText, DECIMAL_RADIX);

  return Number.isNaN(parsed) ? null : parsed;
}

// parses the part after the name: either "a|b|c" options, or "type" / "type:limit"
function parseFieldDetails(name: string, details: string): FieldDef {
  if (details.includes('|')) {
    return makeField(name, { type: 'select', options: details.split('|').map(option => option.trim()) });
  }

  const [type, limitText = ''] = details.split(':');
  if (!KNOWN_TYPES.has(type)) return makeField(name);

  return makeField(name, { type, maxlength: parseLimit(limitText) });
}

// parses one definition such as "name", "age:number:3" or "role:admin|user"
function parseFieldDefinition(definition: string): FieldDef {
  const colonIndex = definition.indexOf(':');
  if (colonIndex === -1) return makeField(definition);

  const name = definition.slice(0, colonIndex).trim();
  const details = definition.slice(colonIndex + 1).trim();

  return parseFieldDetails(name, details);
}

// parses a comma-separated field definition string (e.g. "name, age:number:3, role:admin|user") into FieldDef objects
export function parseFields(text: string): FieldDef[] {
  const definitions = text.split(',').map(definition => definition.trim()).filter(Boolean);

  return definitions.map(parseFieldDefinition);
}
