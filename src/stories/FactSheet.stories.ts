import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine, participantRoles } from 'tods-competition-factory';
import { generateFactSheet } from '../generators/factSheet';
import { buildHeaderFromTournament } from '../composition/tournamentBridge';
import { FACT_SHEET_CATALOG } from '../config/factSheetCatalog';
import type { FactSheetSectionType } from '../config/factSheetCatalog';

const { OFFICIAL, DIRECTOR } = participantRoles;

const ITF_JUNIOR = 'itf-junior';
const NATIONAL_FED = 'national-federation';

interface FactSheetArgs {
  templateId: string;
  dataDensity: 'full' | 'sparse' | 'minimal';
  showAccommodation: boolean;
  showTransportation: boolean;
  showSponsors: boolean;
  showSocialEvents: boolean;
  showNotes: boolean;
}

function buildTournamentRecord(density: string) {
  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [
      { drawSize: 32, eventName: 'Singles', seedsCount: 8 },
      { drawSize: 16, eventName: 'Doubles', eventType: 'DOUBLES', seedsCount: 4 },
    ],
    completeAllMatchUps: true,
    randomWinningSide: true,
    setState: true,
  });

  if (!result.success) return null;

  const { tournamentRecord } = tournamentEngine.getTournament();
  if (!tournamentRecord) return null;

  // Enrich with structured data
  tournamentRecord.tournamentName = 'Summer Classic 2026';
  tournamentRecord.formalName = 'The Summer Classic 2026';
  tournamentRecord.startDate = '2026-06-01';
  tournamentRecord.endDate = '2026-06-07';
  tournamentRecord.hostCountryCode = 'USA';
  tournamentRecord.surfaceCategory = 'HARD';
  tournamentRecord.tournamentTier = { system: 'ITF_JUNIOR', value: 'J300' };
  tournamentRecord.totalPrizeMoney = [{ amount: 25000, currencyCode: 'USD' }];

  tournamentRecord.venues = [
    {
      venueId: 'v1',
      venueName: 'City Tennis Center',
      addresses: [{ city: 'Austin', state: 'TX', countryCode: 'USA' }],
      courts: Array.from({ length: 8 }, (_, i) => ({ courtId: 'c' + i, courtName: 'Court ' + (i + 1) })),
    },
  ];

  // Add non-competitor participants
  const officials = [
    {
      participantName: 'Jane Smith',
      participantRole: DIRECTOR,
      person: {
        standardGivenName: 'Jane',
        standardFamilyName: 'Smith',
        contacts: [{ emailAddress: 'jane@tennis.org', telephone: '+1-555-0100' }],
      },
    },
    {
      participantName: 'Bob Johnson',
      participantRole: OFFICIAL,
      participantRoleResponsibilities: ['REFEREE'],
      person: {
        standardGivenName: 'Bob',
        standardFamilyName: 'Johnson',
        contacts: [{ emailAddress: 'bob@tennis.org' }],
      },
    },
    {
      participantName: 'Carol Lee',
      participantRole: OFFICIAL,
      participantRoleResponsibilities: ['CHIEF_UMPIRE'],
      person: { standardGivenName: 'Carol', standardFamilyName: 'Lee' },
    },
  ];
  tournamentRecord.participants = [...(tournamentRecord.participants || []), ...officials];

  if (density === 'minimal') return tournamentRecord;

  // Registration profile
  tournamentRecord.registrationProfile = {
    entriesOpen: '2026-05-01',
    entriesClose: '2026-05-20',
    withdrawalDeadline: '2026-05-25',
    entryMethod: 'ONLINE',
    entryUrl: 'https://summerclassic.example.com/enter',
    eligibilityNotes: 'Open to all ITF-ranked players 18 and under.',
    entryFees: [
      { amount: 50, currencyCode: 'USD', eventType: 'SINGLES' },
      { amount: 75, currencyCode: 'USD', eventType: 'DOUBLES' },
    ],
    dressCode: 'Predominantly white attire required on all courts.',
    contingencyPlan: 'In case of rain, play moves to covered courts 1-4.',
    drawCeremonyDate: '2026-06-01T18:00',
    awardsCeremonyDate: '2026-06-07T17:00',
    awardsDescription: 'Trophies for winners and runners-up in all events.',
    codeOfConduct: { name: 'ITF Code of Conduct', url: 'https://itftennis.com/conduct' },
    regulations: [
      { name: 'ITF Rules of Tennis 2026', url: 'https://itftennis.com/rules' },
      { name: 'Local Ground Rules', description: 'Posted at the tournament desk.' },
    ],
  };

  if (density === 'sparse') return tournamentRecord;

  // Full density — add logistics, sponsors, social events
  tournamentRecord.registrationProfile.accommodation = {
    options: [
      {
        name: 'Grand Hotel Austin',
        address: '100 Main St, Austin TX',
        phone: '+1-555-0200',
        priceRange: '$120-180/night',
        url: 'https://grandhotel.example.com',
      },
      { name: 'Budget Inn', address: '200 Airport Blvd, Austin TX', priceRange: '$60-80/night' },
      { name: 'Player Housing', description: 'Shared dorms at UT campus, $35/night' },
    ],
    notes: 'Mention code TENNIS2026 for tournament rate at Grand Hotel.',
  };

  tournamentRecord.registrationProfile.transportation = {
    options: [
      {
        name: 'Airport Shuttle',
        description: 'Free daily shuttle from AUS airport at 10am and 4pm',
        phone: '+1-555-0300',
      },
    ],
    notes: 'Venue is 15 minutes from Austin-Bergstrom International Airport.',
  };

  tournamentRecord.registrationProfile.hospitality = {
    options: [
      { name: 'Player Lounge', description: 'Open 7am-9pm, complimentary snacks and drinks' },
      { name: 'Lunch Service', description: 'Hot lunches available 11am-2pm, $8/meal' },
    ],
  };

  tournamentRecord.registrationProfile.medicalInfo = {
    options: [
      { name: 'Dr. Sarah Chen', description: 'Tournament physician, on-site daily 8am-6pm', phone: '+1-555-0400' },
      { name: 'Athletic Trainer', description: 'Available for taping and treatment, Court 1 area' },
    ],
  };

  tournamentRecord.registrationProfile.sponsors = [
    { name: 'Austin Energy', tier: 'TITLE', websiteUrl: 'https://austinenergy.com' },
    { name: 'Hill Country Bank', tier: 'PRESENTING', websiteUrl: 'https://hcbank.example.com' },
    { name: 'Court Pro Strings', tier: 'OFFICIAL' },
    { name: 'Lone Star Water', tier: 'SUPPORTING' },
  ];

  tournamentRecord.registrationProfile.socialEvents = [
    {
      name: 'Welcome Dinner',
      date: '2026-06-01',
      time: '19:00',
      location: 'Grand Hotel Ballroom',
      description: 'Casual dress, complimentary for all participants.',
    },
    { name: 'Player Mixer', date: '2026-06-03', time: '18:00', location: 'Player Lounge' },
  ];

  // Add free-form notes
  tournamentRecord.notes =
    '<h3>Important Notice</h3><p>All players must check in at the tournament desk <strong>at least 30 minutes</strong> before their scheduled match.</p><p>The tournament reserves the right to modify the schedule at any time.</p>';

  return tournamentRecord;
}

function createStory(args: FactSheetArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const record = buildTournamentRecord(args.dataDensity);
  if (!record) {
    container.innerHTML = '<p style="color:red">Failed to generate tournament record</p>';
    return container;
  }

  // Apply section toggles
  const enabledSections: FactSheetSectionType[] | undefined = (() => {
    const template = FACT_SHEET_CATALOG[args.templateId];
    if (!template) return undefined;
    return template.sections
      .filter((s) => s.enabled)
      .filter((s) => {
        if (s.type === 'accommodation' && !args.showAccommodation) return false;
        if (s.type === 'transportation' && !args.showTransportation) return false;
        if (s.type === 'sponsors' && !args.showSponsors) return false;
        if (s.type === 'social-events' && !args.showSocialEvents) return false;
        if (s.type === 'custom-notes' && !args.showNotes) return false;
        return true;
      })
      .map((s) => s.type);
  })();

  const infoDiv = document.createElement('div');
  infoDiv.style.marginBottom = '12px';
  const templateName = FACT_SHEET_CATALOG[args.templateId]?.name || args.templateId;
  infoDiv.innerHTML =
    '<h2>Fact Sheet: ' + templateName + '</h2>' + '<p>Data density: <strong>' + args.dataDensity + '</strong></p>';
  container.appendChild(infoDiv);

  // Show auto-populated header config for comparison
  const headerConfig = buildHeaderFromTournament(record, { layout: FACT_SHEET_CATALOG[args.templateId]?.headerLayout });
  const headerInfo = document.createElement('details');
  headerInfo.style.cssText = 'margin-bottom: 12px; font-size: 12px;';
  headerInfo.innerHTML =
    '<summary>Auto-populated HeaderConfig</summary><pre>' + JSON.stringify(headerConfig, null, 2) + '</pre>';
  container.appendChild(headerInfo);

  const buildPdf = () =>
    generateFactSheet(record, {
      templateId: args.templateId,
      enabledSections,
    });

  addButton(container, 'Download PDF', '#1e3c78', () =>
    buildPdf().save('fact-sheet-' + args.templateId + '-' + args.dataDensity + '.pdf'),
  );
  addButton(container, 'Preview in New Tab', '#2d8a4e', () =>
    window.open(URL.createObjectURL(buildPdf().output('blob'))),
  );

  return container;
}

function addButton(container: HTMLElement, label: string, color: string, onclick: () => void) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText =
    'padding: 10px 24px; cursor: pointer; background: ' +
    color +
    '; color: white; border: none; border-radius: 4px; margin: 8px 4px;';
  btn.onclick = onclick;
  container.appendChild(btn);
}

const meta: Meta<FactSheetArgs> = {
  title: 'PDF/Fact Sheet',
  render: createStory,
  argTypes: {
    templateId: {
      control: { type: 'select' },
      options: Object.keys(FACT_SHEET_CATALOG),
    },
    dataDensity: {
      control: { type: 'select' },
      options: ['full', 'sparse', 'minimal'],
    },
    showAccommodation: { control: 'boolean' },
    showTransportation: { control: 'boolean' },
    showSponsors: { control: 'boolean' },
    showSocialEvents: { control: 'boolean' },
    showNotes: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<FactSheetArgs>;

export const ITFJuniorFull: Story = {
  args: {
    templateId: ITF_JUNIOR,
    dataDensity: 'full',
    showAccommodation: true,
    showTransportation: true,
    showSponsors: true,
    showSocialEvents: true,
    showNotes: true,
  },
};

export const ITFProCircuit: Story = {
  args: {
    templateId: 'itf-pro-circuit',
    dataDensity: 'full',
    showAccommodation: false,
    showTransportation: false,
    showSponsors: false,
    showSocialEvents: false,
    showNotes: true,
  },
};

export const NationalFederation: Story = {
  args: {
    templateId: NATIONAL_FED,
    dataDensity: 'full',
    showAccommodation: true,
    showTransportation: true,
    showSponsors: true,
    showSocialEvents: true,
    showNotes: true,
  },
};

export const ATPWTATour: Story = {
  args: {
    templateId: 'tour-atp-wta',
    dataDensity: 'full',
    showAccommodation: true,
    showTransportation: true,
    showSponsors: true,
    showSocialEvents: true,
    showNotes: true,
  },
};

export const ClubBasic: Story = {
  args: {
    templateId: 'club-basic',
    dataDensity: 'sparse',
    showAccommodation: false,
    showTransportation: false,
    showSponsors: false,
    showSocialEvents: false,
    showNotes: false,
  },
};

export const SparseData: Story = {
  args: {
    templateId: ITF_JUNIOR,
    dataDensity: 'sparse',
    showAccommodation: true,
    showTransportation: true,
    showSponsors: true,
    showSocialEvents: true,
    showNotes: true,
  },
};

export const MinimalData: Story = {
  args: {
    templateId: ITF_JUNIOR,
    dataDensity: 'minimal',
    showAccommodation: true,
    showTransportation: true,
    showSponsors: true,
    showSocialEvents: true,
    showNotes: false,
  },
};

export const LongNotes: Story = {
  args: {
    templateId: NATIONAL_FED,
    dataDensity: 'full',
    showAccommodation: true,
    showTransportation: true,
    showSponsors: true,
    showSocialEvents: true,
    showNotes: true,
  },
};
