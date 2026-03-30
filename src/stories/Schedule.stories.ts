import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractScheduleData } from '../core/extractScheduleData';
import { generateSchedulePDF } from '../generators/schedule';

interface ScheduleArgs {
  drawSize: number;
  courtsCount: number;
  venueName: string;
}

function createScheduleStory(args: ScheduleArgs): HTMLElement {
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
  const startDate = info.tournamentInfo?.startDate;

  const scheduleResult: any = tournamentEngine.competitionScheduleMatchUps();
  const matchUps = (scheduleResult.completedMatchUps || []).concat(scheduleResult.upcomingMatchUps || []);
  const venuesResult: any = tournamentEngine.getVenuesAndCourts();

  const scheduleData = extractScheduleData({
    matchUps,
    venues: venuesResult.venues || [],
    scheduledDate: startDate,
  });

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `
    <h2>Order of Play</h2>
    <p>Courts: ${scheduleData.courts.length} | Time slots: ${scheduleData.timeSlots.length} | Date: ${startDate}</p>
  `;
  container.appendChild(infoDiv);

  const btn = document.createElement('button');
  btn.textContent = 'Generate & Download PDF';
  btn.style.cssText =
    'padding: 10px 24px; font-size: 14px; cursor: pointer; background: #1e3c78; color: white; border: none; border-radius: 4px;';
  btn.onclick = () => {
    const doc = generateSchedulePDF(scheduleData, {
      header: {
        tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
        startDate,
      },
      landscape: 'auto',
    });
    doc.save('schedule.pdf');
  };
  container.appendChild(btn);

  const previewBtn = document.createElement('button');
  previewBtn.textContent = 'Preview in New Tab';
  previewBtn.style.cssText =
    'padding: 10px 24px; font-size: 14px; cursor: pointer; background: #2d8a4e; color: white; border: none; border-radius: 4px; margin-left: 10px;';
  previewBtn.onclick = () => {
    const doc = generateSchedulePDF(scheduleData, {
      header: {
        tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
        startDate,
      },
      landscape: 'auto',
    });
    window.open(URL.createObjectURL(doc.output('blob')));
  };
  container.appendChild(previewBtn);

  // Preview
  if (scheduleData.timeSlots.length > 0) {
    for (const slot of scheduleData.timeSlots) {
      const slotDiv = document.createElement('div');
      slotDiv.style.cssText = 'margin-top: 16px;';
      slotDiv.innerHTML = `
        <h3 style="color:#1e3c78;margin:0 0 8px">${slot.label}</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${slot.matches
            .map(
              (m) => `
            <div style="border:1px solid #ddd;border-radius:4px;padding:8px;min-width:180px;font-size:12px">
              <div style="font-weight:bold;color:#1e3c78">${m.courtName}</div>
              <div style="color:#666;font-size:11px">${m.eventAbbr} ${m.roundName}</div>
              <div>${m.side1.name}</div>
              <div style="color:#888">vs</div>
              <div>${m.side2.name}</div>
              ${m.score ? `<div style="color:#3c3cba;font-weight:bold;margin-top:4px">${m.score}</div>` : ''}
            </div>
          `,
            )
            .join('')}
        </div>
      `;
      container.appendChild(slotDiv);
    }
  }

  return container;
}

const meta: Meta<ScheduleArgs> = {
  title: 'PDF/Schedule',
  render: createScheduleStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [8, 16, 32] },
    courtsCount: { control: { type: 'range', min: 2, max: 12, step: 1 } },
    venueName: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<ScheduleArgs>;

export const Default: Story = {
  args: { drawSize: 16, courtsCount: 6, venueName: 'Main Venue' },
};

export const SmallVenue: Story = {
  args: { drawSize: 8, courtsCount: 3, venueName: 'Club Courts' },
};
