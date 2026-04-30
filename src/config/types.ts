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
export type SeedFormat = 'brackets' | 'parens' | 'bare';
export type EntryFormat = 'parens' | 'hyphen' | 'bare';
export type GameScoreSeparator = '-' | '/' | 'none';
export type SetScoreSeparator = ' ' | ' | ';
export type RenderStyle = 'traditional-lines' | 'boxes' | 'lucky-draw' | 'round-robin' | 'mirrored-bracket';

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

export type HeaderLayout = 'itf' | 'grand-slam' | 'minimal' | 'none' | 'wta-tour' | 'national-federation';
export type FooterLayout =
  | 'standard'
  | 'seedings'
  | 'officials'
  | 'none'
  | 'seedings-table'
  | 'prize-money'
  | 'officials-signoff'
  | 'combined-tour';

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
  // Tour-level header fields
  city?: string;
  country?: string;
  prizeMoney?: string;
  currency?: string;
  tournamentId?: string;
  sectionLabel?: string;
  leftLogoBase64?: string;
  rightLogoBase64?: string;
  // National federation fields
  chiefUmpire?: string;
}

export interface FooterConfig {
  layout: FooterLayout;
  showPageNumbers?: boolean;
  showTimestamp?: boolean;
  notes?: string[];
  officials?: string[];
  // Seedings table
  seedAssignments?: { seedValue: number; participantName: string; nationality?: string; ranking?: number }[];
  // Prize money
  prizeMoney?: { round: string; amount?: string; points?: string }[];
  // Officials sign-off
  signatureLines?: { role: string; name?: string }[];
  drawCeremonyDate?: string;
  releaseDate?: string;
  // Withdrawals and lucky losers
  withdrawals?: { name: string; reason?: string }[];
  luckyLosers?: string[];
}
