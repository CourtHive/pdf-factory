import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractRoundRobinData } from '../core/extractRoundRobinData';
import { renderRoundRobinGroup } from '../renderers/roundRobinDraw';
import { createDoc, getPageRegions } from '../composition/page';
import { renderHeader } from '../composition/headerLayouts';
import { renderFooter, measureFooterHeight } from '../composition/footerLayouts';
import { getPreset } from '../config/formatPresets';

interface RoundRobinArgs {
  drawSize: number;
  groupSize: number;
  preset: string;
}

function createStory(args: RoundRobinArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const drawId = 'drawId';
  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [
      {
        drawSize: args.drawSize,
        drawType: 'ROUND_ROBIN',
        structureOptions: { groupSize: args.groupSize },
        eventName: 'RR Singles',
        drawId,
      },
    ],
    completeAllMatchUps: true,
    randomWinningSide: true,
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate tournament</p>';
    return container;
  }

  // RR uses extractRoundRobinData which needs the raw structure
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

  const buildPdf = () => {
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
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      renderFooter(doc, { layout: 'standard', showPageNumbers: true, showTimestamp: true }, format.page, p);
    }
    return doc;
  };

  addButton(container, 'Download PDF', '#1e3c78', () => buildPdf().save(`round-robin-${args.drawSize}.pdf`));
  addButton(container, 'Preview in New Tab', '#2d8a4e', () =>
    window.open(URL.createObjectURL(buildPdf().output('blob'))),
  );

  for (const group of groups) {
    const groupDiv = document.createElement('div');
    groupDiv.style.cssText = 'margin-top: 16px;';
    groupDiv.innerHTML = `<h3>${group.groupName}</h3><p>${group.participants.length} participants, ${group.results.length} results</p>`;
    container.appendChild(groupDiv);
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

const meta: Meta<RoundRobinArgs> = {
  title: 'PDF/Round Robin',
  render: createStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [4, 8, 10, 12, 16, 18] },
    groupSize: { control: { type: 'select' }, options: [3, 4, 5, 6] },
    preset: { control: { type: 'select' }, options: ['itfJunior', 'wimbledon', 'usta'] },
  },
};

export default meta;
type Story = StoryObj<RoundRobinArgs>;

export const FourPlayers: Story = { args: { drawSize: 4, groupSize: 4, preset: 'itfJunior' } };
export const EightPlayers: Story = { args: { drawSize: 8, groupSize: 4, preset: 'itfJunior' } };
export const TenPlayersGroupsOf5: Story = { args: { drawSize: 10, groupSize: 5, preset: 'itfJunior' } };
export const EighteenPlayersGroupsOf6: Story = { args: { drawSize: 18, groupSize: 6, preset: 'usta' } };
export const SixteenPlayers: Story = { args: { drawSize: 16, groupSize: 4, preset: 'itfJunior' } };
