// --- Page Layout ---

export interface PageConfig {
  pageSize: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape' | 'auto';
  margins: { top: number; right: number; bottom: number; left: number };
}

export interface PageRegions {
  headerHeight: number;
  footerHeight: number;
  contentY: number;
  contentHeight: number;
  contentWidth: number;
  pageWidth: number;
  pageHeight: number;
}

// --- Draw Format Configuration ---

export type NameFormat = 'LAST, First' | 'LAST First' | 'F. LAST';
export type NationalityFormat = 'bare' | 'parens' | 'hyphen';
export type SeedPosition = 'before-position' | 'after-name' | 'after-country';
export type SeedFormat = 'brackets' | 'parens';
export type EntryFormat = 'parens' | 'hyphen' | 'bare';
export type GameScoreSeparator = '-' | '/';
export type SetScoreSeparator = ' ' | ' | ';
export type RenderStyle = 'traditional-lines' | 'boxes' | 'lucky-draw' | 'round-robin';

export interface DrawFormatConfig {
  nameFormat: NameFormat;
  nationalityFormat: NationalityFormat;
  seedPosition: SeedPosition;
  seedFormat: SeedFormat;
  entryFormat: EntryFormat;
  gameScoreSeparator: GameScoreSeparator;
  setScoreSeparator: SetScoreSeparator;
  retirementLabel: string;
  walkoverLabel: string;
  roundLabels: Record<string, string>;
  renderStyle: RenderStyle;
  page: PageConfig;
}

// --- Draw Splitting ---

export interface DrawSplitConfig {
  maxPositionsPerPage: number;
  includeOverlapRounds: boolean;
  summaryPage: boolean;
}

// --- Header/Footer Layout ---

export type HeaderLayout = 'itf' | 'grand-slam' | 'minimal' | 'none';
export type FooterLayout = 'standard' | 'seedings' | 'officials' | 'none';

export interface HeaderConfig {
  layout: HeaderLayout;
  tournamentName: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  organizer?: string;
  surface?: string;
  grade?: string;
  supervisor?: string;
}

export interface FooterConfig {
  layout: FooterLayout;
  showPageNumbers?: boolean;
  showTimestamp?: boolean;
  notes?: string[];
  officials?: string[];
}
