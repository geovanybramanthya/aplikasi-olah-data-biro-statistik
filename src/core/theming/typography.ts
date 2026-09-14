/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 3: Theming & Visual Craftsmanship Studio
 * Feature 19: Presentation Typography Library & Dynamic Google Fonts Loader
 */

import { FontFamily } from '../../types/theming';

/**
 * 6 Approved Presentation Font Families
 */
export const FONT_FAMILIES: readonly FontFamily[] = [
  'Poppins',
  'Montserrat',
  'Inter',
  'Plus Jakarta Sans',
  'Roboto',
  'Merriweather',
] as const;

/**
 * Detailed font definition metadata
 */
export interface FontDefinition {
  id: FontFamily;
  name: string;
  cssFamily: string;
  category: 'sans-serif' | 'serif';
  weights: number[];
  googleFontUrlFamily: string;
  description: string;
  recommendedUsage: string;
}

/**
 * Typography Scale structure for title, subtitle, axis labels, and badges
 */
export interface TypographyScale {
  titleFontSize: number;
  subtitleFontSize: number;
  labelFontSize: number;
  badgeFontSize: number;
}

export type TypographyScalePreset = 'small' | 'medium' | 'large';

/**
 * Font metadata dictionary for all 6 presentation fonts
 */
export const FONT_DEFINITIONS: Record<FontFamily, FontDefinition> = {
  Poppins: {
    id: 'Poppins',
    name: 'Poppins',
    cssFamily: "'Poppins', sans-serif",
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800],
    googleFontUrlFamily: 'Poppins:wght@400;500;600;700;800',
    description: 'Geometric sans-serif modern, ramah, dan sangat populer untuk infografis publik.',
    recommendedUsage: 'Judul dan label data yang memerlukan tampilan bersih dan berenergi.',
  },
  Montserrat: {
    id: 'Montserrat',
    name: 'Montserrat',
    cssFamily: "'Montserrat', sans-serif",
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800],
    googleFontUrlFamily: 'Montserrat:wght@400;500;600;700;800',
    description: 'Tipografi urban tegas dan berwibawa dengan keterbacaan tinggi dalam presentasi slide.',
    recommendedUsage: 'Laporan resmi dan headline slide eksekutif.',
  },
  Inter: {
    id: 'Inter',
    name: 'Inter',
    cssFamily: "'Inter', sans-serif",
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700],
    googleFontUrlFamily: 'Inter:wght@300;400;500;600;700',
    description: 'Font antarmuka digital standar industri dengan optimasi x-height untuk presisi numerik.',
    recommendedUsage: 'Tabel data, label sumbu padat, dan persentase.',
  },
  'Plus Jakarta Sans': {
    id: 'Plus Jakarta Sans',
    name: 'Plus Jakarta Sans',
    cssFamily: "'Plus Jakarta Sans', sans-serif",
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800],
    googleFontUrlFamily: 'Plus+Jakarta+Sans:wght@400;500;600;700;800',
    description: 'Font kebanggaan Indonesia dengan proporsi humanist modern, resmi BEM UNDIP 2026.',
    recommendedUsage: 'Identitas resmi BEM UNDIP, judul visualisasi, dan kartu utama.',
  },
  Roboto: {
    id: 'Roboto',
    name: 'Roboto',
    cssFamily: "'Roboto', sans-serif",
    category: 'sans-serif',
    weights: [300, 400, 500, 700],
    googleFontUrlFamily: 'Roboto:wght@300;400;500;700',
    description: 'Font sans-serif neo-grotesque yang netral, stabil, dan optimal untuk grafik teknis.',
    recommendedUsage: 'Grafik komparatif dan teks penjelasan panjang.',
  },
  Merriweather: {
    id: 'Merriweather',
    name: 'Merriweather',
    cssFamily: "'Merriweather', serif",
    category: 'serif',
    weights: [300, 400, 700],
    googleFontUrlFamily: 'Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400',
    description: 'Font serif elegan yang dirancang khusus untuk kenyamanan membaca di layar.',
    recommendedUsage: 'Laporan naratif akademik, kutipan mahasiswa, dan survei opini.',
  },
};

/**
 * Calculate font sizes across elements based on presentation scale preset
 * - small: compact cards (minimum 10px legibility guard)
 * - medium: balanced default presentation sizing
 * - large: high-visibility large room slide presentations
 */
export function calculateTypographyScale(
  preset: string = 'medium'
): TypographyScale {
  switch (preset) {
    case 'small':
      return {
        titleFontSize: 18,
        subtitleFontSize: 13,
        labelFontSize: 11,
        badgeFontSize: 11,
      };
    case 'large':
      return {
        titleFontSize: 24,
        subtitleFontSize: 16,
        labelFontSize: 14,
        badgeFontSize: 14,
      };
    case 'medium':
    default:
      return {
        titleFontSize: 20,
        subtitleFontSize: 14,
        labelFontSize: 12,
        badgeFontSize: 12,
      };
  }
}

/**
 * Get CSS font-family string formatted for inline style or ECharts textStyle
 */
export function getCssFontFamily(fontFamily: FontFamily): string {
  return FONT_DEFINITIONS[fontFamily]?.cssFamily || "'Poppins', sans-serif";
}

/**
 * Build Google Fonts CSS2 URL for one or more font families
 */
export function buildGoogleFontsUrl(
  fonts: readonly FontFamily[] | FontFamily[] = FONT_FAMILIES
): string {
  const families = fonts
    .map((f) => FONT_DEFINITIONS[f]?.googleFontUrlFamily)
    .filter(Boolean);
  const query = families.map((fam) => `family=${fam}`).join('&');
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

/**
 * Dynamically load a Google Font into the document head
 * Gracefully resolves without error in non-browser / SSR / Node.js environments.
 */
export async function loadGoogleFont(font: FontFamily): Promise<boolean> {
  if (typeof document === 'undefined') {
    return true;
  }

  const fontDef = FONT_DEFINITIONS[font];
  if (!fontDef) return false;

  const elementId = `google-font-${font.toLowerCase().replace(/\s+/g, '-')}`;
  if (document.getElementById(elementId)) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    const link = document.createElement('link');
    link.id = elementId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontDef.googleFontUrlFamily}&display=swap`;
    link.onload = () => resolve(true);
    link.onerror = () => {
      console.warn(`[Typography] Failed to load Google Font dynamically: ${font}`);
      resolve(false);
    };
    document.head.appendChild(link);
  });
}

/**
 * Dynamically pre-load all 6 presentation fonts
 */
export async function loadAllPresentationFonts(): Promise<boolean> {
  if (typeof document === 'undefined') {
    return true;
  }
  const elementId = 'google-fonts-all-presentation';
  if (document.getElementById(elementId)) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    const link = document.createElement('link');
    link.id = elementId;
    link.rel = 'stylesheet';
    link.href = buildGoogleFontsUrl();
    link.onload = () => resolve(true);
    link.onerror = () => {
      console.warn('[Typography] Failed to load Google Fonts bundle dynamically');
      resolve(false);
    };
    document.head.appendChild(link);
  });
}
