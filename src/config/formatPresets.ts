import type { DrawFormatConfig } from './types';

const ENGLISH_ROUNDS: Record<string, string> = {
  F: 'Final',
  SF: 'Semi-Finals',
  QF: 'Quarter-Finals',
  R16: 'Round of 16',
  R32: 'Round of 32',
  R64: 'Round of 64',
  R128: 'Round of 128',
};

const WIMBLEDON_ROUNDS: Record<string, string> = {
  F: 'Final',
  SF: 'Semi-Finals',
  QF: 'Quarter-Finals',
  R16: 'Fourth Round',
  R32: 'Third Round',
  R64: 'Second Round',
  R128: 'First Round',
};

const USOPEN_ROUNDS: Record<string, string> = {
  F: 'Final',
  SF: 'Semifinals',
  QF: 'Quarterfinals',
  R16: 'Round 4',
  R32: 'Round 3',
  R64: 'Round 2',
  R128: 'Round 1',
};

const FRENCH_ROUNDS: Record<string, string> = {
  F: 'FINALE',
  SF: '1/2 FINALE',
  QF: '1/4 FINALE',
  R16: '1/8 FINALE',
  R32: '3eme TOUR',
  R64: '2eme TOUR',
  R128: '1er TOUR',
};

const DEFAULT_PAGE = {
  pageSize: 'a4' as const,
  orientation: 'auto' as const,
  margins: { top: 15, right: 10, bottom: 15, left: 10 },
};

// Shared values extracted for sonarjs/no-duplicate-string
const LAST_COMMA_FIRST = 'LAST, First' as const;
const NAT_BARE = 'bare' as const;
const SEED_BEFORE = 'before-position' as const;
const SEED_BRACKETS = 'brackets' as const;
const GAME_HYPHEN = '-' as const;
const TRADITIONAL = 'traditional-lines' as const;

export const PRESETS: Record<string, DrawFormatConfig> = {
  wimbledon: {
    nameFormat: LAST_COMMA_FIRST,
    nationalityFormat: NAT_BARE,
    seedPosition: SEED_BEFORE,
    seedFormat: SEED_BRACKETS,
    entryFormat: 'parens',
    gameScoreSeparator: GAME_HYPHEN,
    setScoreSeparator: ' ',
    retirementLabel: 'Ret.',
    walkoverLabel: 'w/o',
    roundLabels: WIMBLEDON_ROUNDS,
    renderStyle: TRADITIONAL,
    page: { ...DEFAULT_PAGE },
  },

  usOpen: {
    nameFormat: LAST_COMMA_FIRST,
    nationalityFormat: NAT_BARE,
    seedPosition: SEED_BEFORE,
    seedFormat: SEED_BRACKETS,
    entryFormat: 'parens',
    gameScoreSeparator: GAME_HYPHEN,
    setScoreSeparator: ' | ',
    retirementLabel: 'Ret.',
    walkoverLabel: 'w/o',
    roundLabels: USOPEN_ROUNDS,
    renderStyle: TRADITIONAL,
    page: { ...DEFAULT_PAGE },
  },

  rolandGarros: {
    nameFormat: 'LAST First',
    nationalityFormat: NAT_BARE,
    seedPosition: 'after-country',
    seedFormat: SEED_BRACKETS,
    entryFormat: 'parens',
    gameScoreSeparator: '/',
    setScoreSeparator: ' ',
    retirementLabel: 'Ab',
    walkoverLabel: 'w/o',
    roundLabels: FRENCH_ROUNDS,
    renderStyle: TRADITIONAL,
    page: { ...DEFAULT_PAGE },
  },

  australianOpen: {
    nameFormat: LAST_COMMA_FIRST,
    nationalityFormat: 'parens',
    seedPosition: 'after-name',
    seedFormat: SEED_BRACKETS,
    entryFormat: 'hyphen',
    gameScoreSeparator: '/',
    setScoreSeparator: ' ',
    retirementLabel: 'Ret.',
    walkoverLabel: 'w/o',
    roundLabels: ENGLISH_ROUNDS,
    renderStyle: TRADITIONAL,
    page: { ...DEFAULT_PAGE, pageSize: 'letter' as const, orientation: 'portrait' as const },
  },

  // ATP tour traditional draws (e.g., 250/500/1000 main draws).
  // Modeled on protennislive-style PDFs: bare nationality codes, uppercase
  // retirement label, English round names. Tour PDFs typically render scores
  // with no separator ("62 62"); the closest currently-supported option is "-".
  atp: {
    nameFormat: LAST_COMMA_FIRST,
    nationalityFormat: NAT_BARE,
    seedPosition: SEED_BEFORE,
    seedFormat: SEED_BRACKETS,
    entryFormat: 'bare',
    gameScoreSeparator: GAME_HYPHEN,
    setScoreSeparator: ' ',
    retirementLabel: 'RET',
    walkoverLabel: 'W/O',
    roundLabels: ENGLISH_ROUNDS,
    renderStyle: TRADITIONAL,
    page: { ...DEFAULT_PAGE },
  },

  // ATP Finals (Nitto): round-robin group format with bracketed nationality
  // in standings/match results. Landscape by default to fit crosstabs.
  atpFinals: {
    nameFormat: LAST_COMMA_FIRST,
    nationalityFormat: 'parens',
    seedPosition: SEED_BEFORE,
    seedFormat: SEED_BRACKETS,
    entryFormat: 'bare',
    gameScoreSeparator: GAME_HYPHEN,
    setScoreSeparator: ' ',
    retirementLabel: 'RET',
    walkoverLabel: 'W/O',
    roundLabels: ENGLISH_ROUNDS,
    renderStyle: 'round-robin',
    page: { ...DEFAULT_PAGE, orientation: 'landscape' as const },
  },

  itfJunior: {
    nameFormat: LAST_COMMA_FIRST,
    nationalityFormat: NAT_BARE,
    seedPosition: SEED_BEFORE,
    seedFormat: SEED_BRACKETS,
    entryFormat: 'bare',
    gameScoreSeparator: GAME_HYPHEN,
    setScoreSeparator: ' ',
    retirementLabel: 'Ret.',
    walkoverLabel: 'w/o',
    roundLabels: ENGLISH_ROUNDS,
    renderStyle: TRADITIONAL,
    page: { ...DEFAULT_PAGE },
  },

  usta: {
    nameFormat: LAST_COMMA_FIRST,
    nationalityFormat: NAT_BARE,
    seedPosition: SEED_BEFORE,
    seedFormat: SEED_BRACKETS,
    entryFormat: 'bare',
    gameScoreSeparator: GAME_HYPHEN,
    setScoreSeparator: ' ',
    retirementLabel: 'Ret.',
    walkoverLabel: 'W/O',
    roundLabels: ENGLISH_ROUNDS,
    renderStyle: TRADITIONAL,
    page: { ...DEFAULT_PAGE },
  },
};

export function getPreset(name: string): DrawFormatConfig {
  return PRESETS[name] || PRESETS.itfJunior;
}

export function mergePreset(name: string, overrides: Partial<DrawFormatConfig>): DrawFormatConfig {
  return { ...getPreset(name), ...overrides };
}
