import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { structureToDrawData, findStructure } from '../core/drawsDataToDrawData';
import { generateTraditionalDrawPDF } from '../generators/drawPDF';
import type { HeaderLayout, FooterLayout, HeaderConfig, FooterConfig } from '../config/types';
import { COMPOSITION_CATALOG } from '../config/compositionCatalog';

const GRAND_SLAM = 'grand-slam';
const NATIONAL_FEDERATION = 'national-federation';
const OFFICIALS_SIGNOFF = 'officials-signoff';
const COMBINED_TOUR = 'combined-tour';

interface HeaderFooterArgs {
  headerLayout: HeaderLayout;
  footerLayout: FooterLayout;
  catalogPreset: string;
  showSeedings: boolean;
  showPrizeMoney: boolean;
  showOfficials: boolean;
  showWithdrawals: boolean;
}

const SAMPLE_SEEDS = [
  { seedValue: 1, participantName: 'SINNER, Jannik', nationality: 'ITA', ranking: 1 },
  { seedValue: 2, participantName: 'ALCARAZ, Carlos', nationality: 'ESP', ranking: 2 },
  { seedValue: 3, participantName: 'DJOKOVIC, Novak', nationality: 'SRB', ranking: 3 },
  { seedValue: 4, participantName: 'ZVEREV, Alexander', nationality: 'GER', ranking: 4 },
  { seedValue: 5, participantName: 'MEDVEDEV, Daniil', nationality: 'RUS', ranking: 5 },
  { seedValue: 6, participantName: 'FRITZ, Taylor', nationality: 'USA', ranking: 6 },
  { seedValue: 7, participantName: 'RUNE, Holger', nationality: 'DEN', ranking: 7 },
  { seedValue: 8, participantName: 'RUUD, Casper', nationality: 'NOR', ranking: 8 },
];

const SAMPLE_PRIZES = [
  { round: 'Winner', amount: '$1,200,000', points: '2000' },
  { round: 'Final', amount: '$650,000', points: '1200' },
  { round: 'Semi-Final', amount: '$375,000', points: '720' },
  { round: 'Quarter-Final', amount: '$215,000', points: '360' },
  { round: 'Round of 16', amount: '$130,000', points: '180' },
  { round: 'Round of 32', amount: '$80,000', points: '90' },
];

const SAMPLE_OFFICIALS = [
  { role: 'Tournament Director', name: 'Craig Tiley' },
  { role: 'WTA Supervisor', name: 'Wayne McEwen' },
  { role: 'Referee', name: 'Fergus Murphy' },
];

const SAMPLE_WITHDRAWALS = [
  { name: 'RYBAKINA, Elena', reason: 'back injury' },
  { name: 'PEGULA, Jessica', reason: 'knee' },
];

function buildHeaderConfig(args: HeaderFooterArgs): HeaderConfig {
  const base: HeaderConfig = {
    layout: args.headerLayout,
    tournamentName: 'Australian Open 2026',
    subtitle: 'Womens Singles',
  };

  switch (args.headerLayout) {
    case GRAND_SLAM:
      return { ...base, startDate: '19 Jan 2026', endDate: '1 Feb 2026', location: 'Melbourne, Australia' };
    case 'itf':
      return {
        ...base,
        tournamentName: 'J300 Tucson',
        subtitle: 'Girls Singles',
        startDate: '9 Mar 2026',
        location: 'Tucson, USA',
        grade: 'J300',
        surface: 'Hard',
        supervisor: 'Douglas Rice',
      };
    case 'wta-tour':
      return {
        ...base,
        tournamentName: 'Brisbane International',
        subtitle: 'SINGLES MAIN DRAW',
        city: 'Brisbane',
        country: 'AUS',
        startDate: '29 Dec 2025',
        endDate: '5 Jan 2026',
        prizeMoney: '1,520,600',
        currency: '$',
        surface: 'Hard, Green Set Cushion',
        sectionLabel: 'SINGLES MAIN DRAW',
      };
    case NATIONAL_FEDERATION:
      return {
        ...base,
        tournamentName: 'OP Solina',
        subtitle: 'Singles Main Draw',
        city: 'Solin',
        country: 'CRO',
        startDate: '19-21 Mar 2026',
        organizer: 'TK DALMACIJACEMENT',
        tournamentId: 'R12_20260318_DCE',
        grade: '4. rang',
        chiefUmpire: 'Tihomir Sinobad',
      };
    case 'minimal':
      return { ...base, tournamentName: 'Club Championship', subtitle: 'Singles' };
    default:
      return base;
  }
}

function buildFooterConfig(args: HeaderFooterArgs): FooterConfig {
  const base: FooterConfig = {
    layout: args.footerLayout,
    showPageNumbers: true,
    showTimestamp: true,
  };

  if (args.showSeedings) base.seedAssignments = SAMPLE_SEEDS;
  if (args.showPrizeMoney) base.prizeMoney = SAMPLE_PRIZES;
  if (args.showOfficials) {
    base.signatureLines = SAMPLE_OFFICIALS;
    base.officials = SAMPLE_OFFICIALS.map((o) => `${o.role}: ${o.name}`);
    base.drawCeremonyDate = '18 Jan 2026 at 14:00';
    base.releaseDate = '18 Jan 2026 at 15:30';
  }
  if (args.showWithdrawals) {
    base.withdrawals = SAMPLE_WITHDRAWALS;
    base.luckyLosers = ['KEYS, Madison', 'PAOLINI, Jasmine'];
  }
  base.notes = ['All times are local.', 'Matches may be moved to any court at the discretion of the Supervisor.'];

  return base;
}

function createStory(args: HeaderFooterArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const drawId = 'drawId';
  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize: 16, eventName: 'Singles', seedsCount: 4, drawId }],
    completeAllMatchUps: true,
    randomWinningSide: true,
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate tournament</p>';
    return container;
  }

  const { eventData } = tournamentEngine.getEventData({ drawId }) as any;
  const mainStruct = findStructure(eventData?.drawsData || [], 'MAIN');
  const drawData = mainStruct
    ? structureToDrawData(mainStruct)
    : { drawName: '', drawSize: 0, drawType: '', totalRounds: 0, slots: [], matchUps: [], seedAssignments: [] };

  const header = buildHeaderConfig(args);
  const footer = buildFooterConfig(args);

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Header: ${args.headerLayout} | Footer: ${args.footerLayout}</h2>
    <p>Seedings: ${args.showSeedings} | Prize Money: ${args.showPrizeMoney} | Officials: ${args.showOfficials} | Withdrawals: ${args.showWithdrawals}</p>`;
  container.appendChild(infoDiv);

  const buildPdf = () => generateTraditionalDrawPDF(drawData, { header, footer, preset: 'itfJunior' });

  addButton(container, 'Download PDF', '#1e3c78', () =>
    buildPdf().save(`header-footer-${args.headerLayout}-${args.footerLayout}.pdf`),
  );
  addButton(container, 'Preview in New Tab', '#2d8a4e', () =>
    window.open(URL.createObjectURL(buildPdf().output('blob'))),
  );

  // Show catalog presets
  if (args.catalogPreset !== 'custom') {
    const preset = COMPOSITION_CATALOG[args.catalogPreset];
    if (preset) {
      const catDiv = document.createElement('div');
      catDiv.style.cssText =
        'margin-top: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 12px;';
      catDiv.innerHTML = `<strong>Catalog: ${preset.name}</strong> (${preset.category}, Tier ${preset.tier})<br>${preset.description}`;
      container.appendChild(catDiv);
    }
  }

  return container;
}

function addButton(container: HTMLElement, label: string, color: string, onclick: () => void) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText = `padding: 10px 24px; cursor: pointer; background: ${color}; color: white; border: none; border-radius: 4px; margin: 8px 4px;`;
  btn.onclick = onclick;
  container.appendChild(btn);
}

const meta: Meta<HeaderFooterArgs> = {
  title: 'PDF/Headers & Footers',
  render: createStory,
  argTypes: {
    headerLayout: {
      control: { type: 'select' },
      options: [GRAND_SLAM, 'itf', 'wta-tour', NATIONAL_FEDERATION, 'minimal', 'none'],
    },
    footerLayout: {
      control: { type: 'select' },
      options: ['standard', 'seedings-table', 'prize-money', OFFICIALS_SIGNOFF, COMBINED_TOUR, 'none'],
    },
    catalogPreset: { control: { type: 'select' }, options: ['custom', ...Object.keys(COMPOSITION_CATALOG)] },
    showSeedings: { control: 'boolean' },
    showPrizeMoney: { control: 'boolean' },
    showOfficials: { control: 'boolean' },
    showWithdrawals: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<HeaderFooterArgs>;

export const GrandSlamMinimal: Story = {
  args: {
    headerLayout: GRAND_SLAM,
    footerLayout: 'standard',
    catalogPreset: GRAND_SLAM,
    showSeedings: false,
    showPrizeMoney: false,
    showOfficials: false,
    showWithdrawals: false,
  },
};

export const WTATourCombined: Story = {
  args: {
    headerLayout: 'wta-tour',
    footerLayout: COMBINED_TOUR,
    catalogPreset: 'wta-500',
    showSeedings: true,
    showPrizeMoney: true,
    showOfficials: true,
    showWithdrawals: true,
  },
};

export const ITFJuniorSignoff: Story = {
  args: {
    headerLayout: 'itf',
    footerLayout: OFFICIALS_SIGNOFF,
    catalogPreset: 'itf-junior',
    showSeedings: false,
    showPrizeMoney: false,
    showOfficials: true,
    showWithdrawals: false,
  },
};

export const NationalFederationFull: Story = {
  args: {
    headerLayout: NATIONAL_FEDERATION,
    footerLayout: OFFICIALS_SIGNOFF,
    catalogPreset: NATIONAL_FEDERATION,
    showSeedings: true,
    showPrizeMoney: false,
    showOfficials: true,
    showWithdrawals: false,
  },
};

export const SeedingsTableFooter: Story = {
  args: {
    headerLayout: 'minimal',
    footerLayout: 'seedings-table',
    catalogPreset: 'custom',
    showSeedings: true,
    showPrizeMoney: false,
    showOfficials: false,
    showWithdrawals: false,
  },
};

export const PrizeMoneyFooter: Story = {
  args: {
    headerLayout: GRAND_SLAM,
    footerLayout: 'prize-money',
    catalogPreset: 'custom',
    showSeedings: false,
    showPrizeMoney: true,
    showOfficials: false,
    showWithdrawals: false,
  },
};

export const AustralianOpenStyle: Story = {
  args: {
    headerLayout: GRAND_SLAM,
    footerLayout: COMBINED_TOUR,
    catalogPreset: 'australian-open',
    showSeedings: true,
    showPrizeMoney: true,
    showOfficials: false,
    showWithdrawals: false,
  },
};

export const ClubBasic: Story = {
  args: {
    headerLayout: 'minimal',
    footerLayout: 'standard',
    catalogPreset: 'club-basic',
    showSeedings: false,
    showPrizeMoney: false,
    showOfficials: false,
    showWithdrawals: false,
  },
};
