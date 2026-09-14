export type FontFamily =
  | 'Poppins'
  | 'Montserrat'
  | 'Inter'
  | 'Plus Jakarta Sans'
  | 'Roboto'
  | 'Merriweather';

export type PaletteId =
  | 'undip_navy_gold'
  | 'modern_emerald'
  | 'executive_pastel'
  | 'warm_sunset'
  | 'custom';

export interface ColorPalette {
  id: PaletteId;
  name: string;
  colors: string[]; // Minimum 5 hex strings
  isCustom?: boolean;
}

export type DimensionalityMode = '2d' | '3d';

export interface ThemeConfig {
  fontFamily: FontFamily;
  titleFontSize: number;
  labelFontSize: number;
  activePaletteId: PaletteId;
  activePalette: ColorPalette;
  customPalette: ColorPalette;
  globalDimensionality: DimensionalityMode;
  showWatermark: boolean;
  watermarkText: string;
}
