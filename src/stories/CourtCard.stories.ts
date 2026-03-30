import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractCourtCardData } from '../core/extractCourtCardData';
import { generateCourtCardPDF } from '../generators/courtCard';

interface CourtCardArgs {
  drawSize: number;
  courtsCount: number;
  venueName: string;
}

function createCourtCardStory(args: CourtCardArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize: args.drawSize }],
    venueProfiles: [{ courtsCount: args.courtsCount, venueName: args.venueName }],
    completeAllMatchUps: false,
    autoSchedule: true,
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate tournament</p>';
    return container;
  }

  const info: any = tournamentEngine.getTournamentInfo();
  const scheduleResult: any = tournamentEngine.competitionScheduleMatchUps();
  const matchUps = (scheduleResult.completedMatchUps || []).concat(scheduleResult.upcomingMatchUps || []);
  const venuesResult: any = tournamentEngine.getVenuesAndCourts();

  const cards = extractCourtCardData({ matchUps, venues: venuesResult.venues || [] });

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Court Cards - ${cards.length} courts</h2>`;
  container.appendChild(infoDiv);

  const btn = document.createElement('button');
  btn.textContent = 'Generate & Download All Court Cards';
  btn.style.cssText =
    'padding: 10px 24px; font-size: 14px; cursor: pointer; background: #141450; color: white; border: none; border-radius: 4px; margin-bottom: 16px;';
  btn.onclick = () => {
    const doc = generateCourtCardPDF(cards, {
      tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
    });
    doc.save('court-cards.pdf');
  };
  container.appendChild(btn);

  const previewBtn = document.createElement('button');
  previewBtn.textContent = 'Preview in New Tab';
  previewBtn.style.cssText =
    'padding: 10px 24px; font-size: 14px; cursor: pointer; background: #2d8a4e; color: white; border: none; border-radius: 4px; margin-left: 10px; margin-bottom: 16px;';
  previewBtn.onclick = () => {
    const doc = generateCourtCardPDF(cards, {
      tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
    });
    window.open(URL.createObjectURL(doc.output('blob')));
  };
  container.appendChild(previewBtn);

  // Preview cards
  for (const card of cards) {
    const cardDiv = document.createElement('div');
    cardDiv.style.cssText =
      'border: 2px solid #333; border-radius: 8px; padding: 16px; margin: 12px 0; max-width: 400px; text-align: center;';
    cardDiv.innerHTML = `
      <h3 style="margin:0 0 4px;font-size:24px">${card.courtName}</h3>
      ${card.venueName ? `<p style="margin:0 0 12px;color:#666">${card.venueName}</p>` : ''}
      ${
        card.currentMatch
          ? `
        <div style="background:#f0f4ff;padding:12px;border-radius:4px;margin:8px 0">
          <div style="font-size:11px;color:#1e3c78;font-weight:bold;margin-bottom:6px">NOW PLAYING</div>
          <div style="font-size:10px;color:#666;margin-bottom:6px">${card.currentMatch.eventName} - ${card.currentMatch.roundName}</div>
          <div style="font-size:16px;font-weight:bold">${card.currentMatch.side1.name} (${card.currentMatch.side1.nationality})</div>
          <div style="color:#888;margin:4px 0">vs.</div>
          <div style="font-size:16px;font-weight:bold">${card.currentMatch.side2.name} (${card.currentMatch.side2.nationality})</div>
        </div>
      `
          : '<p style="color:#888">No current match</p>'
      }
      ${card.nextMatch ? renderNextMatch(card.nextMatch) : ''}
    `;
    container.appendChild(cardDiv);
  }

  return container;
}

function renderNextMatch(match: any): string {
  const timeLabel = match.scheduledTime ? ` (${match.scheduledTime})` : '';
  return `
    <div style="border-top:1px solid #ddd;padding-top:8px;margin-top:8px;color:#666;font-size:12px">
      <strong>UP NEXT${timeLabel}</strong><br>
      ${match.side1.name} vs. ${match.side2.name}
    </div>
  `;
}

const meta: Meta<CourtCardArgs> = {
  title: 'PDF/Court Cards',
  render: createCourtCardStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [8, 16, 32] },
    courtsCount: { control: { type: 'range', min: 2, max: 12, step: 1 } },
    venueName: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<CourtCardArgs>;

export const FourCourts: Story = {
  args: { drawSize: 16, courtsCount: 4, venueName: 'Center Club' },
};

export const EightCourts: Story = {
  args: { drawSize: 32, courtsCount: 8, venueName: 'Main Venue' },
};
