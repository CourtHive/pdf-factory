import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractRoundRobinData } from '../core/extractRoundRobinData';
import { renderRoundRobinGroup } from '../renderers/roundRobinDraw';
import { createDoc, getPageRegions } from '../composition/page';
import { renderHeader } from '../composition/headerLayouts';
import { measureFooterHeight } from '../composition/footerLayouts';
import { getPreset } from '../config/formatPresets';

interface RoundRobinArgs {
  drawSize: number;
  preset: string;
}

function createStory(args: RoundRobinArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize: args.drawSize, drawType: 'ROUND_ROBIN', eventName: 'RR Singles' }],
    completeAllMatchUps: true,
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate tournament</p>';
    return container;
  }

  const events: any = tournamentEngine.getEvents();
  const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
  const participants: any = tournamentEngine.getParticipants({
    participantFilters: { participantTypes: ['INDIVIDUAL'] },
  });
  const groups = extractRoundRobinData({
    structure: drawDefinition?.structures?.[0],
    participants: participants.participants || [],
  });

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Round Robin - ${args.drawSize} players, ${groups.length} groups</h2>`;
  container.appendChild(infoDiv);

  const btn = document.createElement('button');
  btn.textContent = 'Download PDF';
  btn.style.cssText =
    'padding: 10px 24px; cursor: pointer; background: #333; color: white; border: none; border-radius: 4px;';
  btn.onclick = () => {
    const format = getPreset(args.preset);
    const doc = createDoc(format.page, args.drawSize);
    const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
    const headerH = renderHeader(
      doc,
      { layout: 'itf', tournamentName: 'Club Championship', subtitle: 'Round Robin' },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerH, footerH);

    let y = regions.contentY;
    for (const group of groups) {
      y = renderRoundRobinGroup(doc, group, format, regions, y) + 6;
    }
    doc.save(`round-robin-${args.drawSize}.pdf`);
  };
  container.appendChild(btn);

  const previewBtn = document.createElement('button');
  previewBtn.textContent = 'Preview in New Tab';
  previewBtn.style.cssText =
    'padding: 10px 24px; cursor: pointer; background: #2d8a4e; color: white; border: none; border-radius: 4px; margin-left: 10px;';
  previewBtn.onclick = () => {
    const format = getPreset(args.preset);
    const doc = createDoc(format.page, args.drawSize);
    const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
    const headerH = renderHeader(
      doc,
      { layout: 'itf', tournamentName: 'Club Championship', subtitle: 'Round Robin' },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerH, footerH);

    let y = regions.contentY;
    for (const group of groups) {
      y = renderRoundRobinGroup(doc, group, format, regions, y) + 6;
    }
    window.open(URL.createObjectURL(doc.output('blob')));
  };
  container.appendChild(previewBtn);

  // Preview tables
  for (const group of groups) {
    const groupDiv = document.createElement('div');
    groupDiv.style.cssText = 'margin-top: 16px;';
    groupDiv.innerHTML = `<h3>${group.groupName}</h3><p>${group.participants.length} participants, ${group.results.length} results</p>`;
    container.appendChild(groupDiv);
  }

  return container;
}

const meta: Meta<RoundRobinArgs> = {
  title: 'PDF/Round Robin',
  render: createStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [4, 8, 12, 16] },
    preset: { control: { type: 'select' }, options: ['itfJunior', 'wimbledon', 'usta'] },
  },
};

export default meta;
type Story = StoryObj<RoundRobinArgs>;

export const FourPlayers: Story = { args: { drawSize: 4, preset: 'itfJunior' } };
export const EightPlayers: Story = { args: { drawSize: 8, preset: 'itfJunior' } };
export const SixteenPlayers: Story = { args: { drawSize: 16, preset: 'itfJunior' } };
