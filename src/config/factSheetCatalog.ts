/**
 * Fact Sheet Catalog — template presets defining which sections to include per governing body.
 *
 * Parallels compositionCatalog.ts (draw sheet presets) but for tournament fact sheets.
 * Each preset declares which sections are enabled, in what order, and which header/footer
 * composition preset to inherit from.
 */

import type { HeaderLayout } from './types';

export type FactSheetSectionType =
  | 'tournament-header'
  | 'contacts'
  | 'events'
  | 'entry-info'
  | 'venue-info'
  | 'accommodation'
  | 'transportation'
  | 'hospitality'
  | 'medical'
  | 'regulations'
  | 'prize-money'
  | 'officials'
  | 'sponsors'
  | 'social-events'
  | 'custom-notes';

export interface FactSheetSection {
  type: FactSheetSectionType;
  title?: string;
  enabled: boolean;
}

export interface FactSheetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'itf' | 'national' | 'tour' | 'club' | 'custom';
  headerLayout: HeaderLayout;
  sections: FactSheetSection[];
}

const TOURNAMENT_HEADER: FactSheetSectionType = 'tournament-header';
const CONTACTS: FactSheetSectionType = 'contacts';
const EVENTS: FactSheetSectionType = 'events';
const ENTRY_INFO: FactSheetSectionType = 'entry-info';
const VENUE_INFO: FactSheetSectionType = 'venue-info';
const ACCOMMODATION: FactSheetSectionType = 'accommodation';
const TRANSPORTATION: FactSheetSectionType = 'transportation';
const HOSPITALITY: FactSheetSectionType = 'hospitality';
const MEDICAL: FactSheetSectionType = 'medical';
const REGULATIONS: FactSheetSectionType = 'regulations';
const PRIZE_MONEY: FactSheetSectionType = 'prize-money';
const OFFICIALS: FactSheetSectionType = 'officials';
const SPONSORS: FactSheetSectionType = 'sponsors';
const SOCIAL_EVENTS: FactSheetSectionType = 'social-events';
const CUSTOM_NOTES: FactSheetSectionType = 'custom-notes';

function section(type: FactSheetSectionType, enabled = true, title?: string): FactSheetSection {
  return { type, enabled, ...(title && { title }) };
}

const FULL_SECTIONS: FactSheetSection[] = [
  section(TOURNAMENT_HEADER),
  section(CONTACTS),
  section(EVENTS),
  section(ENTRY_INFO),
  section(VENUE_INFO),
  section(ACCOMMODATION),
  section(TRANSPORTATION),
  section(HOSPITALITY),
  section(MEDICAL),
  section(REGULATIONS),
  section(PRIZE_MONEY),
  section(OFFICIALS),
  section(SPONSORS),
  section(SOCIAL_EVENTS),
  section(CUSTOM_NOTES),
];

export const FACT_SHEET_CATALOG: Record<string, FactSheetTemplate> = {
  'itf-junior': {
    id: 'itf-junior',
    name: 'ITF Junior',
    description: 'Full fact sheet with all sections — ITF header style',
    category: 'itf',
    headerLayout: 'itf',
    sections: FULL_SECTIONS,
  },
  'itf-pro-circuit': {
    id: 'itf-pro-circuit',
    name: 'ITF Pro Circuit',
    description: 'Pro circuit fact sheet — contacts, events, entry, venue, prize money, officials',
    category: 'itf',
    headerLayout: 'itf',
    sections: [
      section(TOURNAMENT_HEADER),
      section(CONTACTS),
      section(EVENTS),
      section(ENTRY_INFO),
      section(VENUE_INFO),
      section(PRIZE_MONEY),
      section(OFFICIALS),
      section(REGULATIONS),
      section(CUSTOM_NOTES),
    ],
  },
  'national-federation': {
    id: 'national-federation',
    name: 'National Federation',
    description: 'Detailed national federation fact sheet with all logistics',
    category: 'national',
    headerLayout: 'national-federation',
    sections: FULL_SECTIONS,
  },
  'tour-atp-wta': {
    id: 'tour-atp-wta',
    name: 'ATP/WTA Tour',
    description: 'Tour-level fact sheet — contacts, events, prize money, officials, sponsors',
    category: 'tour',
    headerLayout: 'wta-tour',
    sections: [
      section(TOURNAMENT_HEADER),
      section(CONTACTS),
      section(EVENTS),
      section(PRIZE_MONEY),
      section(OFFICIALS),
      section(SPONSORS),
      section(ACCOMMODATION),
      section(TRANSPORTATION),
      section(SOCIAL_EVENTS),
      section(CUSTOM_NOTES),
    ],
  },
  'club-basic': {
    id: 'club-basic',
    name: 'Club Basic',
    description: 'Simple club-level fact sheet — essentials only',
    category: 'club',
    headerLayout: 'minimal',
    sections: [
      section(TOURNAMENT_HEADER),
      section(CONTACTS),
      section(EVENTS),
      section(ENTRY_INFO),
      section(VENUE_INFO),
      section(CUSTOM_NOTES),
    ],
  },
};

export function getFactSheetTemplate(id: string): FactSheetTemplate | undefined {
  return FACT_SHEET_CATALOG[id];
}

export function listFactSheetTemplates(category?: string): FactSheetTemplate[] {
  const entries = Object.values(FACT_SHEET_CATALOG);
  return category ? entries.filter((t) => t.category === category) : entries;
}
