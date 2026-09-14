/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 3: Theming & Visual Craftsmanship Studio
 * Feature 21: Custom Palette Builder & Strict Validator
 */

import { ColorPalette } from '../../types/theming';

/**
 * Strict regex for 3-character or 6-character hex color codes with leading #
 */
export const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/**
 * Result structure of custom palette validation
 */
export interface PaletteValidationResult {
  isValid: boolean;
  colors: string[];
  errors: string[];
  palette?: ColorPalette;
}

/**
 * Test whether a single string is a valid hex color code (with or without #)
 */
export function isValidHexColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false;
  const trimmed = color.trim();
  const candidate = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return HEX_COLOR_REGEX.test(candidate);
}

/**
 * Normalize a hex string to uppercase formatted with leading '#'
 * Returns null if invalid.
 */
export function normalizeHexColor(color: string): string | null {
  if (!isValidHexColor(color)) return null;
  const trimmed = color.trim();
  const formatted = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return formatted.toUpperCase();
}

/**
 * Strictly validate a list of colors (array or delimiter-separated string).
 * Requirements:
 * - Each color must match ^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$
 * - Auto-prepends '#' if 3 or 6 valid hex characters are provided without hash
 * - At least 5 valid colors required
 * - Returns structured errors if invalid
 */
export function validateCustomPalette(
  input: unknown,
  paletteName?: string
): PaletteValidationResult {
  let rawItems: string[] = [];

  if (Array.isArray(input)) {
    rawItems = input.map((c) => String(c ?? '').trim());
  } else if (typeof input === 'string') {
    rawItems = input
      .split(/[\s,;|\n\r]+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  } else if (input !== null && input !== undefined) {
    rawItems = [String(input).trim()];
  }

  // Auto-prepend # if 3 or 6 hex digits are provided without hash
  const processedTokens = rawItems
    .filter((c) => c.length > 0)
    .map((c) => (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(c) ? `#${c}` : c));

  const validColors: string[] = [];
  const errors: string[] = [];

  for (const token of processedTokens) {
    if (HEX_COLOR_REGEX.test(token)) {
      validColors.push(token.toUpperCase());
    } else {
      errors.push(`Format hex tidak valid: '${token}'`);
    }
  }

  if (validColors.length < 5) {
    errors.push(
      `Minimal 5 kode hex warna valid diperlukan (saat ini: ${validColors.length}/5)`
    );
  }

  const isValid = errors.length === 0;

  const result: PaletteValidationResult = {
    isValid,
    colors: validColors,
    errors,
  };

  if (isValid) {
    result.palette = {
      id: 'custom',
      name: paletteName?.trim() || 'Kustom BEM UNDIP',
      colors: validColors,
      isCustom: true,
    };
  }

  return result;
}

/**
 * Helper to build a validated ColorPalette object, throwing a descriptive Error if invalid
 */
export function createCustomPalette(
  name: string,
  input: string[] | string
): ColorPalette {
  const result = validateCustomPalette(input, name);
  if (!result.isValid || !result.palette) {
    throw new Error(
      `Gagal membuat palet kustom: ${result.errors.join('; ')}`
    );
  }
  return result.palette;
}
