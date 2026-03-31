/**
 * Consolation draw renderer.
 *
 * Renders a main draw followed by consolation bracket(s).
 * The consolation bracket receives first-round losers from the main draw.
 * Each structure is rendered as a separate section with a labeled header.
 *
 * Factory draw types that use this:
 * - FIRST_MATCH_LOSER_CONSOLATION
 * - FIRST_ROUND_LOSER_CONSOLATION
 * - FEED_IN_CHAMPIONSHIP
 * - CURTIS_CONSOLATION
 */

import jsPDF from 'jspdf';
import type { DrawFormatConfig, PageRegions } from '../config/types';
import type { DrawData } from '../core/extractDrawData';
import { participantName, nationality } from '../utils/primitives';
import { renderTraditionalDraw } from './traditionalDraw';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export interface ConsolationStructure {
  name: string;
  stage: string;
  drawData: DrawData;
}

export function extractConsolationStructures(params: {
  drawDefinition: any;
  participants?: any[];
  processedMatchUps?: any[];
}): ConsolationStructure[] {
  const { drawDefinition, participants = [] } = params;
  if (!drawDefinition?.structures) return [];

  const participantMap = new Map<string, any>();
  participants.forEach((p: any) => participantMap.set(p.participantId, p));

  return drawDefinition.structures.map((structure: any) => {
    const positionAssignments = structure.positionAssignments || [];
    const seedAssignments = structure.seedAssignments || [];
    const drawSize = positionAssignments.length;

    const slots = positionAssignments.map((pa: any) => {
      const participant = pa.participantId ? participantMap.get(pa.participantId) : undefined;
      const seed = seedAssignments.find((sa: any) => sa.participantId === pa.participantId);
      return {
        drawPosition: pa.drawPosition,
        participantName: participant ? participantName(participant) : '',
        nationality: participant ? nationality(participant) : '',
        seedValue: seed?.seedValue,
        isBye: pa.bye === true,
      };
    });

    const matchUps = (structure.matchUps || []).map((mu: any) => ({
      roundNumber: mu.roundNumber,
      roundPosition: mu.roundPosition,
      drawPositions: mu.drawPositions || [],
      score: mu.score?.scoreStringSide1 || '',
      winningSide: mu.winningSide,
      matchUpStatus: mu.matchUpStatus,
    }));

    const stage = structure.stage || 'MAIN';
    const isMain = stage === 'MAIN';
    const name = structure.structureName || (isMain ? 'Main Draw' : 'Consolation');

    const maxRound = matchUps.reduce((max: number, mu: any) => Math.max(max, mu.roundNumber || 0), 0);

    // Build roundLabelMap from engine-processed matchUps when available
    const structureProcessed = (params.processedMatchUps || []).filter(
      (m: any) => m.structureId === structure.structureId,
    );
    let roundLabelMap: Record<number, string> | undefined;
    if (structureProcessed.length) {
      roundLabelMap = {};
      for (const mu of structureProcessed) {
        if (mu.roundNumber && !roundLabelMap[mu.roundNumber]) {
          roundLabelMap[mu.roundNumber] = mu.abbreviatedRoundName || mu.roundName || `R${mu.roundNumber}`;
        }
      }
    }

    return {
      name,
      stage,
      drawData: {
        drawName: name,
        drawSize,
        drawType: 'SINGLE_ELIMINATION',
        totalRounds: maxRound,
        slots,
        matchUps,
        seedAssignments: seedAssignments
          .filter((sa: any) => sa.participantId)
          .map((sa: any) => {
            const p = participantMap.get(sa.participantId);
            return {
              seedValue: sa.seedValue,
              participantName: p ? participantName(p) : '',
              nationality: p ? nationality(p) : '',
            };
          }),
        roundLabelMap,
      },
    };
  });
}

export function renderConsolationDraw(
  doc: jsPDF,
  structures: ConsolationStructure[],
  format: DrawFormatConfig,
  regions: PageRegions,
): void {
  const margins = format.page.margins;
  let y = regions.contentY;

  // Sort: MAIN first, then CONSOLATION, then others
  const stageOrder: Record<string, number> = { MAIN: 0, CONSOLATION: 1, PLAY_OFF: 2 };
  const sorted = [...structures]
    .filter((s) => s.drawData.drawSize > 0)
    .sort((a, b) => (stageOrder[a.stage] ?? 9) - (stageOrder[b.stage] ?? 9));

  for (const structure of sorted) {
    const isMain = structure.stage === 'MAIN';
    const estimatedHeight = structure.drawData.drawSize * 3.5 + 8;

    // New page if needed
    if (y + estimatedHeight > regions.contentY + regions.contentHeight && y > regions.contentY + 10) {
      doc.addPage();
      y = regions.contentY;
    }

    // Section header with top padding
    y += 3;
    setFont(doc, isMain ? SIZE.HEADING : SIZE.BODY, STYLE.BOLD);
    if (!isMain) doc.setTextColor(120, 40, 40);
    doc.text(structure.name, margins.left, y);
    if (!isMain) doc.setTextColor(0);
    y += isMain ? 4 : 3;

    // Render bracket
    const structureRegions: PageRegions = {
      ...regions,
      contentY: y,
      contentHeight: Math.min(estimatedHeight, regions.contentY + regions.contentHeight - y),
    };

    renderTraditionalDraw(doc, structure.drawData, format, structureRegions);
    y += estimatedHeight + 4;
  }
}
