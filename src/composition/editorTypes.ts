/**
 * Composition Editor types.
 *
 * These types define the interface for a visual editor that allows
 * tournament directors to design PDF layouts — selecting header styles,
 * footer content, page orientation, format presets, and content options.
 *
 * The editor produces a CompositionConfig which drives PDF generation.
 * This config can be saved per-tournament and reused.
 */

import type {
  HeaderConfig,
  FooterConfig,
  PageConfig,
  DrawFormatConfig,
  HeaderLayout,
  FooterLayout,
} from '../config/types';

// --- Composition Config (output of the editor) ---

export interface CompositionConfig {
  id?: string;
  name: string;
  description?: string;

  page: PageConfig;
  header: HeaderConfig;
  footer: FooterConfig;
  format: DrawFormatConfig;

  // Content options
  content: ContentOptions;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentOptions {
  // Draw sheet options
  draw?: {
    includeSeedings: boolean;
    includeScores: boolean;
    splitStrategy: 'single-page' | 'halves' | 'quarters';
    showDrawPositions: boolean;
    showByes: boolean;
  };

  // Schedule/OOP options
  schedule?: {
    cellStyle: 'detailed' | 'compact';
    showMatchNumbers: boolean;
    alertBanner?: string;
    showPotentialParticipants: boolean;
  };

  // Player list options
  playerList?: {
    includeRanking: boolean;
    includeEvents: boolean;
    groupByEvent: boolean;
    showSignInStatus: boolean;
  };

  // Court card options
  courtCard?: {
    showNextMatch: boolean;
    showVenueName: boolean;
    cardsPerPage: number;
  };
}

// --- Editor State (for the UI) ---

export interface EditorState {
  activeTab: 'page' | 'header' | 'footer' | 'content' | 'preview';
  config: CompositionConfig;
  previewData?: PreviewData;
  isDirty: boolean;
}

export interface PreviewData {
  type: 'draw' | 'schedule' | 'playerList' | 'courtCard' | 'signInSheet' | 'matchCard';
  pdfBlob?: Blob;
  previewUrl?: string;
}

// --- Preset Templates ---

export interface CompositionTemplate {
  id: string;
  name: string;
  description: string;
  category: 'grand-slam' | 'itf' | 'national' | 'club' | 'custom';
  config: CompositionConfig;
}

// --- Editor Options (available choices) ---

export const HEADER_LAYOUT_OPTIONS: { value: HeaderLayout; label: string; description: string }[] = [
  { value: 'grand-slam', label: 'Grand Slam', description: 'Centered tournament name, uppercase, date/location right' },
  {
    value: 'itf',
    label: 'ITF/Professional',
    description: 'Left-aligned name, grade/supervisor on right, separator line',
  },
  { value: 'minimal', label: 'Minimal', description: 'Single line with tournament name and subtitle' },
  { value: 'none', label: 'No Header', description: 'Skip header entirely' },
];

export const FOOTER_LAYOUT_OPTIONS: { value: FooterLayout; label: string; description: string }[] = [
  { value: 'standard', label: 'Standard', description: 'Timestamp, page number, optional notes' },
  { value: 'seedings', label: 'Seedings Table', description: 'Seeded players list in compact columns' },
  { value: 'officials', label: 'Officials', description: 'Tournament officials with roles' },
  { value: 'none', label: 'No Footer', description: 'Skip footer entirely' },
];

export const PAGE_SIZE_OPTIONS = [
  { value: 'a4', label: 'A4 (210 × 297mm)' },
  { value: 'letter', label: 'US Letter (216 × 279mm)' },
];

export const ORIENTATION_OPTIONS = [
  { value: 'auto', label: 'Auto (landscape for large draws)' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'portrait', label: 'Portrait' },
];

export const SPLIT_STRATEGY_OPTIONS = [
  { value: 'single-page', label: 'Single Page (dense)' },
  { value: 'halves', label: 'Two Halves (64+64)' },
  { value: 'quarters', label: 'Four Quarters (32×4)' },
];
