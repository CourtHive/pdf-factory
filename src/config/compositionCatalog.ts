/**
 * Composition Catalog — named presets for PDF header/footer/layout combinations.
 *
 * Analogous to matchUpFormat catalogs in the factory, these presets bundle
 * header layout, footer layout, draw format, and page config into named units.
 * Tournament directors select a preset and optionally override individual fields.
 *
 * TMX flow: provider defaults → catalog preset → tournament director overrides
 */

import type { HeaderConfig, FooterConfig, PageConfig } from './types';

const ITF_JUNIOR_PRESET = 'itfJunior';
const COMBINED_TOUR_FOOTER = 'combined-tour' as const;

export interface CompositionPreset {
  id: string;
  name: string;
  description: string;
  category: 'grand-slam' | 'tour' | 'itf' | 'national' | 'collegiate' | 'club';
  tier: 1 | 2 | 3;
  header: Partial<HeaderConfig>;
  footer: Partial<FooterConfig>;
  page?: Partial<PageConfig>;
  drawFormatPreset?: string;
}

export const COMPOSITION_CATALOG: Record<string, CompositionPreset> = {
  'grand-slam': {
    id: 'grand-slam',
    name: 'Grand Slam',
    description: 'Minimal chrome — large tournament name, timestamp footer',
    category: 'grand-slam',
    tier: 1,
    header: { layout: 'grand-slam' },
    footer: { layout: 'standard', showPageNumbers: true, showTimestamp: true },
    drawFormatPreset: 'wimbledon',
  },
  wimbledon: {
    id: 'wimbledon',
    name: 'Wimbledon',
    description: 'Green/purple Grand Slam style with crest',
    category: 'grand-slam',
    tier: 1,
    header: { layout: 'grand-slam' },
    footer: { layout: 'standard', showPageNumbers: true, showTimestamp: true },
    drawFormatPreset: 'wimbledon',
  },
  'australian-open': {
    id: 'australian-open',
    name: 'Australian Open',
    description: 'Grand Slam with seedings + prize money footer',
    category: 'grand-slam',
    tier: 2,
    header: { layout: 'grand-slam' },
    footer: { layout: COMBINED_TOUR_FOOTER, showPageNumbers: true, showTimestamp: true },
    drawFormatPreset: 'australianOpen',
  },
  'wta-500': {
    id: 'wta-500',
    name: 'WTA 500',
    description: 'Tour header with logos, seedings + prize money footer',
    category: 'tour',
    tier: 2,
    header: { layout: 'wta-tour' },
    footer: { layout: COMBINED_TOUR_FOOTER, showPageNumbers: false, showTimestamp: true },
    drawFormatPreset: ITF_JUNIOR_PRESET,
  },
  'wta-1000': {
    id: 'wta-1000',
    name: 'WTA 1000',
    description: 'Tour header with logos, full footer with officials',
    category: 'tour',
    tier: 2,
    header: { layout: 'wta-tour' },
    footer: { layout: COMBINED_TOUR_FOOTER, showPageNumbers: false, showTimestamp: true },
    drawFormatPreset: ITF_JUNIOR_PRESET,
  },
  'atp-250': {
    id: 'atp-250',
    name: 'ATP 250',
    description: 'ATP tour header, seedings + prize money footer with sign-off',
    category: 'tour',
    tier: 2,
    header: { layout: 'wta-tour' },
    footer: { layout: COMBINED_TOUR_FOOTER, showPageNumbers: false, showTimestamp: true },
    drawFormatPreset: ITF_JUNIOR_PRESET,
  },
  'atp-finals': {
    id: 'atp-finals',
    name: 'ATP Finals',
    description: 'Full official sign-off with signature lines',
    category: 'tour',
    tier: 3,
    header: { layout: 'grand-slam' },
    footer: { layout: 'officials-signoff', showTimestamp: true },
    drawFormatPreset: ITF_JUNIOR_PRESET,
  },
  'itf-junior': {
    id: 'itf-junior',
    name: 'ITF Junior',
    description: 'ITF header with metadata row, officials sign-off footer',
    category: 'itf',
    tier: 3,
    header: { layout: 'itf' },
    footer: { layout: 'officials-signoff', showPageNumbers: true, showTimestamp: true },
    drawFormatPreset: ITF_JUNIOR_PRESET,
  },
  'itf-pro-circuit': {
    id: 'itf-pro-circuit',
    name: 'ITF Pro Circuit',
    description: 'ITF header, seedings + officials footer',
    category: 'itf',
    tier: 2,
    header: { layout: 'itf' },
    footer: { layout: COMBINED_TOUR_FOOTER, showPageNumbers: true, showTimestamp: true },
    drawFormatPreset: ITF_JUNIOR_PRESET,
  },
  'national-federation': {
    id: 'national-federation',
    name: 'National Federation',
    description: 'Detailed metadata header, full sign-off footer with ceremony date',
    category: 'national',
    tier: 3,
    header: { layout: 'national-federation' },
    footer: { layout: 'officials-signoff', showPageNumbers: true, showTimestamp: true },
    drawFormatPreset: 'usta',
  },
  'collegiate-ncaa': {
    id: 'collegiate-ncaa',
    name: 'NCAA Collegiate',
    description: 'Mirrored bracket layout, team logos, minimal footer',
    category: 'collegiate',
    tier: 1,
    header: { layout: 'grand-slam' },
    footer: { layout: 'standard', showPageNumbers: true, showTimestamp: true },
    drawFormatPreset: ITF_JUNIOR_PRESET,
  },
  'club-basic': {
    id: 'club-basic',
    name: 'Club Basic',
    description: 'Minimal header, standard footer — clean and simple',
    category: 'club',
    tier: 1,
    header: { layout: 'minimal' },
    footer: { layout: 'standard', showPageNumbers: true, showTimestamp: true },
    drawFormatPreset: ITF_JUNIOR_PRESET,
  },
};

export function getCatalogPreset(id: string): CompositionPreset | undefined {
  return COMPOSITION_CATALOG[id];
}

export function listCatalogPresets(category?: string): CompositionPreset[] {
  const entries = Object.values(COMPOSITION_CATALOG);
  return category ? entries.filter((e) => e.category === category) : entries;
}

export function mergeCatalogPreset(
  id: string,
  headerOverrides?: Partial<HeaderConfig>,
  footerOverrides?: Partial<FooterConfig>,
): { header: Partial<HeaderConfig>; footer: Partial<FooterConfig> } {
  const preset = COMPOSITION_CATALOG[id] || COMPOSITION_CATALOG['club-basic'];
  return {
    header: { ...preset.header, ...headerOverrides },
    footer: { ...preset.footer, ...footerOverrides },
  };
}
