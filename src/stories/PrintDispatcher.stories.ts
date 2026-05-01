/**
 * Print Dispatcher Stories
 *
 * Demonstrates the end-to-end print pipeline:
 *   resolveCompositionConfig (provider default + tournament override + runtime tweaks)
 *     → executePrint(request, { tournamentEngine })
 *       → per-print-type generator
 *       → PDF blob
 *
 * Each story seeds a tournament via mocksEngine, dispatches a print
 * request through the canonical entry points, and renders the
 * resulting blob in an iframe. Switching the print type or the
 * runtime composition tweaks re-renders.
 */
import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { executePrint } from '../composition/printDispatcher';
import { resolveCompositionConfig } from '../composition/resolveCompositionConfig';
import type { CompositionConfig } from '../composition/editorTypes';
import type { PrintRequest } from '../composition/printModalTypes';

interface PrintDispatcherArgs {
  printType: 'schedule' | 'playerList' | 'signInSheet' | 'courtCards' | 'matchCard' | 'draw';
  drawSize: number;
  courtsCount: number;
  headerLayout: 'itf' | 'minimal' | 'grand-slam' | 'none';
  cellStyle: 'detailed' | 'compact';
  alertBanner: string;
}

function seedTournament(drawSize: number, courtsCount: number) {
  // Tournament-level category + rankingRange + scaleAllParticipants
  // attach SCALE.RANKING.SINGLES.U18 timeItems to every participant
  // so the PlayerList ranking column populates. Two events give event
  // variety + seed assignments. After generation we manually
  // distribute first-round matches across explicit time slots so the
  // Schedule grid has real rows and the CourtCards have current/next
  // matches — mocksEngine's autoSchedule + proAutoSchedule both
  // leave scheduledTime unset, so the grid would otherwise collapse
  // every match into the same '00:00' slot.
  mocksEngine.generateTournamentRecord({
    participantsProfile: {
      participantsCount: drawSize * 2,
      nationalityCodesCount: 16,
      category: { categoryName: 'U18' },
      rankingRange: [1, 200],
      scaleAllParticipants: true,
    },
    drawProfiles: [
      {
        drawSize,
        eventName: "Men's Singles",
        seedsCount: Math.max(2, Math.floor(drawSize / 4)),
      },
      {
        drawSize: Math.max(8, Math.floor(drawSize / 2)),
        eventName: "Women's Singles",
        gender: 'FEMALE',
        seedsCount: 4,
      },
    ],
    venueProfiles: [
      {
        venueId: 'venue-1',
        courtsCount,
        venueName: 'Main Venue',
        startTime: '09:00',
        endTime: '20:00',
      },
    ],
    setState: true,
  });

  const info = tournamentEngine.getTournamentInfo();
  const scheduledDate = info.tournamentInfo?.startDate as string;
  const startTimes = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00'];
  const venuesResult = tournamentEngine.getVenuesAndCourts();
  const courtIds: string[] = (venuesResult.venues?.[0]?.courts ?? []).map((c: any) => c.courtId);
  const allMatchUps = tournamentEngine.allTournamentMatchUps()?.matchUps ?? [];
  const firstRound = allMatchUps.filter((mu: any) => mu.roundNumber === 1 && mu.matchUpStatus !== 'BYE');

  const matchUpDetails = firstRound.map((mu: any, i: number) => ({
    tournamentId: info.tournamentInfo?.tournamentId,
    drawId: mu.drawId,
    matchUpId: mu.matchUpId,
    schedule: {
      scheduledDate,
      scheduledTime: startTimes[Math.floor(i / Math.max(1, courtIds.length)) % startTimes.length],
      courtId: courtIds[i % Math.max(1, courtIds.length)],
      venueId: 'venue-1',
    },
  }));
  if (matchUpDetails.length) tournamentEngine.bulkScheduleMatchUps({ matchUpDetails });

  const events = tournamentEngine.getEvents();
  const event = events.events?.[0];
  const drawId = event?.drawDefinitions?.[0]?.drawId;
  return {
    scheduledDate,
    eventId: event?.eventId as string,
    drawId,
    sampleMatchUpIds: allMatchUps.slice(0, 2).map((mu: any) => mu.matchUpId),
  };
}

function buildRequest(args: PrintDispatcherArgs, seed: ReturnType<typeof seedTournament>): PrintRequest | undefined {
  const composition: Partial<CompositionConfig> = resolveCompositionConfig({
    runtime: {
      header:
        args.headerLayout === 'none'
          ? { layout: 'none' }
          : { layout: args.headerLayout, tournamentName: 'Storybook Demo' },
      footer: { layout: 'standard', showTimestamp: true, showPageNumbers: true },
      content: {
        schedule: {
          cellStyle: args.cellStyle,
          alertBanner: args.alertBanner || undefined,
        },
      },
    },
    printType: args.printType,
  });

  switch (args.printType) {
    case 'schedule':
      return { type: 'schedule', scheduledDate: seed.scheduledDate, composition };
    case 'playerList':
      return { type: 'playerList', composition };
    case 'signInSheet':
      return { type: 'signInSheet', eventId: seed.eventId, composition };
    case 'courtCards':
      return { type: 'courtCards', scheduledDate: seed.scheduledDate, composition };
    case 'matchCard':
      return seed.sampleMatchUpIds.length
        ? { type: 'matchCard', matchUpIds: seed.sampleMatchUpIds, composition }
        : undefined;
    case 'draw':
      return seed.drawId ? { type: 'draw', drawId: seed.drawId, eventId: seed.eventId, composition } : undefined;
  }
}

function renderStory(args: PrintDispatcherArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 16px; display: flex; flex-direction: column; gap: 12px; max-width: 1100px;';

  const title = document.createElement('h2');
  title.textContent = `executePrint('${args.printType}')`;
  title.style.cssText = 'margin: 0; font-family: sans-serif;';
  container.appendChild(title);

  const note = document.createElement('p');
  note.style.cssText = 'margin: 0; color: #666; font-family: sans-serif; font-size: 13px;';
  note.textContent =
    'Tournament data is seeded with mocksEngine; the dispatcher pulls matchUps/venues/eventData from the engine, the resolver merges runtime tweaks, and the matching generator produces the PDF.';
  container.appendChild(note);

  const status = document.createElement('div');
  status.style.cssText =
    'font-family: monospace; font-size: 12px; color: #444; padding: 8px; background: #f5f5f5; border-radius: 4px;';
  container.appendChild(status);

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'width: 100%; height: 720px; border: 1px solid #ccc; border-radius: 4px; background: #fff;';
  container.appendChild(iframe);

  // Defer rendering one tick so Storybook's iframe gets sized.
  setTimeout(() => {
    const seed = seedTournament(args.drawSize, args.courtsCount);
    const request = buildRequest(args, seed);
    if (!request) {
      status.textContent = 'Could not build request — seeded tournament missing required ids';
      return;
    }
    const result = executePrint(request, { tournamentEngine });
    if (!result.success || !result.blob) {
      status.textContent = `executePrint failed: ${result.error}`;
      return;
    }
    iframe.src = URL.createObjectURL(result.blob);
    status.textContent = `success — filename: ${result.filename}`;
  }, 0);

  return container;
}

const meta: Meta<PrintDispatcherArgs> = {
  title: 'PDF/Print Dispatcher',
  render: renderStory,
  argTypes: {
    printType: {
      control: { type: 'select' },
      options: ['schedule', 'playerList', 'signInSheet', 'courtCards', 'matchCard', 'draw'],
    },
    drawSize: { control: { type: 'select' }, options: [8, 16, 32, 64] },
    courtsCount: { control: { type: 'range', min: 2, max: 8, step: 1 } },
    headerLayout: { control: { type: 'select' }, options: ['itf', 'minimal', 'grand-slam', 'none'] },
    cellStyle: { control: { type: 'select' }, options: ['detailed', 'compact'] },
    alertBanner: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<PrintDispatcherArgs>;

export const Schedule: Story = {
  args: {
    printType: 'schedule',
    drawSize: 32,
    courtsCount: 4,
    headerLayout: 'itf',
    cellStyle: 'detailed',
    alertBanner: '',
  },
};

export const PlayerList: Story = {
  args: {
    printType: 'playerList',
    drawSize: 32,
    courtsCount: 4,
    headerLayout: 'itf',
    cellStyle: 'detailed',
    alertBanner: '',
  },
};

export const SignInSheet: Story = {
  args: {
    printType: 'signInSheet',
    drawSize: 32,
    courtsCount: 4,
    headerLayout: 'itf',
    cellStyle: 'detailed',
    alertBanner: '',
  },
};

export const CourtCards: Story = {
  args: {
    printType: 'courtCards',
    drawSize: 32,
    courtsCount: 4,
    headerLayout: 'itf',
    cellStyle: 'detailed',
    alertBanner: '',
  },
};

export const MatchCards: Story = {
  args: {
    printType: 'matchCard',
    drawSize: 16,
    courtsCount: 4,
    headerLayout: 'itf',
    cellStyle: 'detailed',
    alertBanner: '',
  },
};

export const Draw: Story = {
  args: {
    printType: 'draw',
    drawSize: 32,
    courtsCount: 4,
    headerLayout: 'itf',
    cellStyle: 'detailed',
    alertBanner: '',
  },
};
