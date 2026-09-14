/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 3: Theming & Visual Craftsmanship Studio
 * Feature 20: Institutional Color Palettes & Theme Resolution
 */

import {
  PaletteId,
  ColorPalette,
  DimensionalityMode,
  ThemeConfig,
} from '../../types/theming';

/**
 * Official BEM UNDIP Footer Watermark Text
 */
export const WATERMARK_TEXT = 'Biro Statistika BEM Universitas Diponegoro';

/**
 * 4 Curated Institutional Color Palettes (>= 5 hex codes each)
 */
export const INSTITUTIONAL_PALETTES: Record<
  Exclude<PaletteId, 'custom'>,
  ColorPalette
> = {
  undip_navy_gold: {
    id: 'undip_navy_gold',
    name: 'UNDIP Navy & Gold',
    colors: ['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2', '#F9E79F'],
  },
  modern_emerald: {
    id: 'modern_emerald',
    name: 'Modern Emerald',
    colors: ['#0E6251', '#16A085', '#2ECC71', '#82E0AA', '#117A65', '#A3E4D7'],
  },
  executive_pastel: {
    id: 'executive_pastel',
    name: 'Executive Pastel',
    colors: ['#6C88C4', '#C47D9B', '#7BAE9D', '#E8A87C', '#E0C366', '#958DC4'],
  },
  warm_sunset: {
    id: 'warm_sunset',
    name: 'Warm Sunset',
    colors: ['#C0392B', '#E67E22', '#F39C12', '#E74C3C', '#D35400', '#F1C40F'],
  },
};

/**
 * Default fallback Custom Palette (conforming to >= 5 hex codes)
 */
export const DEFAULT_CUSTOM_PALETTE: ColorPalette = {
  id: 'custom',
  name: 'Kustom BEM UNDIP',
  colors: ['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2'],
  isCustom: true,
};

/**
 * List of institutional palettes for UI selection and dropdown rendering
 */
export const INSTITUTIONAL_PALETTE_LIST: ColorPalette[] = [
  INSTITUTIONAL_PALETTES.undip_navy_gold,
  INSTITUTIONAL_PALETTES.modern_emerald,
  INSTITUTIONAL_PALETTES.executive_pastel,
  INSTITUTIONAL_PALETTES.warm_sunset,
];

/**
 * Default presentation theme configuration conforming to ThemeConfig interface
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  fontFamily: 'Poppins',
  titleFontSize: 20,
  labelFontSize: 12,
  activePaletteId: 'undip_navy_gold',
  activePalette: INSTITUTIONAL_PALETTES.undip_navy_gold,
  customPalette: DEFAULT_CUSTOM_PALETTE,
  globalDimensionality: '2d',
  showWatermark: true,
  watermarkText: WATERMARK_TEXT,
};

// Also export as DEFAULT_THEME for alternative naming
export const DEFAULT_THEME = DEFAULT_THEME_CONFIG;

/**
 * Lookup and resolve a color palette by its identifier
 */
export function getPaletteById(
  id: PaletteId,
  customPalette?: ColorPalette
): ColorPalette {
  if (id === 'custom') {
    return customPalette || DEFAULT_CUSTOM_PALETTE;
  }
  return INSTITUTIONAL_PALETTES[id] || INSTITUTIONAL_PALETTES.undip_navy_gold;
}

/**
 * Resolve the currently active color palette from a ThemeConfig object
 */
export function resolveThemePalette(theme: ThemeConfig): ColorPalette {
  if (theme.activePaletteId === 'custom') {
    return theme.customPalette || DEFAULT_CUSTOM_PALETTE;
  }
  return (
    INSTITUTIONAL_PALETTES[theme.activePaletteId as Exclude<PaletteId, 'custom'>] ||
    theme.activePalette ||
    INSTITUTIONAL_PALETTES.undip_navy_gold
  );
}

/**
 * Get all available palettes, including the custom palette
 */
export function getAllPalettes(customPalette?: ColorPalette): ColorPalette[] {
  return [
    ...INSTITUTIONAL_PALETTE_LIST,
    customPalette || DEFAULT_CUSTOM_PALETTE,
  ];
}

/**
 * Safely get a color from a palette with wrap-around modulo indexing
 * Guarantees a valid hex string even if index exceeds palette length.
 */
export function getPaletteColor(palette: ColorPalette, index: number): string {
  if (!palette || !palette.colors || palette.colors.length === 0) {
    return '#002D62';
  }
  const safeIndex = Math.abs(index) % palette.colors.length;
  return palette.colors[safeIndex];
}

/**
 * Resolve dimensionality mode taking into account global setting and optional per-card override
 */
export function resolveDimensionality(
  globalMode: DimensionalityMode = '2d',
  cardOverride?: DimensionalityMode | 'inherit' | string | null
): DimensionalityMode {
  if (cardOverride === '2d' || cardOverride === '3d') {
    return cardOverride;
  }
  return globalMode === '3d' ? '3d' : '2d';
}
