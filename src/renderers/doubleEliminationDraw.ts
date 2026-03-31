/**
 * Double elimination draw renderer.
 *
 * Layout: Winner's bracket (top ~45%) + Loser's bracket (bottom ~45%).
 * Both brackets flow left-to-right.
 *
 * The factory's DOUBLE_ELIMINATION draw type produces three structures:
 * - Main (MAIN) — winner's bracket, includes the championship match as R4
 * - Backdraw (CONSOLATION) — loser's bracket with feed rounds
 * - Decider (PLAY_OFF) — "if first loss" match (not rendered; implied by the final)
 *
 * Main bracket round label overrides:
 * - F-Q (qualifying final) → SF (semifinal of the overall tournament)
 * - F (final in main) → F (the championship match)
 * - Winner of F auto-advances to Winner column
 */

import jsPDF from 'jspdf';
import type { DrawFormatConfig, PageRegions } from '../config/types';
import type { DrawData } from '../core/extractDrawData';
import { renderTraditionalDraw } from './traditionalDraw';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export interface DoubleEliminationData {
  winnersBracket: DrawData;
  losersBracket: DrawData;
  deciderMatch?: DrawData;
}

export function renderDoubleEliminationDraw(
  doc: jsPDF,
  data: DoubleEliminationData,
  format: DrawFormatConfig,
  regions: PageRegions,
): void {
  const margins = format.page.margins;
  const totalHeight = regions.contentHeight;

  const winnersHeight = totalHeight * 0.44;
  const losersHeight = totalHeight * 0.44;
  const deciderWidth = 30;
  const bracketWidth = regions.contentWidth - deciderWidth - 8;

  // Override main bracket round labels: F-Q → SF, F → F
  const winnersData = overrideMainRoundLabels(data.winnersBracket);

  // Winner's bracket header
  let y = regions.contentY + 3;
  setFont(doc, SIZE.BODY, STYLE.BOLD);
  doc.setTextColor(30, 80, 30);
  doc.text("Winner's Bracket", margins.left, y);
  doc.setTextColor(0);
  y += 3;

  const winnersRegions: PageRegions = {
    ...regions,
    contentY: y,
    contentHeight: winnersHeight - 6,
    contentWidth: bracketWidth,
  };
  renderTraditionalDraw(doc, winnersData, format, winnersRegions);

  // Loser's bracket header
  y = regions.contentY + winnersHeight + 6;
  setFont(doc, SIZE.BODY, STYLE.BOLD);
  doc.setTextColor(140, 40, 40);
  doc.text("Loser's Bracket (Backdraw)", margins.left, y);
  doc.setTextColor(0);
  y += 3;

  const losersRegions: PageRegions = {
    ...regions,
    contentY: y,
    contentHeight: losersHeight - 6,
    contentWidth: bracketWidth,
  };
  renderTraditionalDraw(doc, data.losersBracket, format, losersRegions);

  // Decider section — positioned to the right of both brackets, vertically centered
  const deciderX = margins.left + bracketWidth + 8;
  const deciderCenterY = regions.contentY + totalHeight / 2;
  const boxWidth = deciderWidth - 2;
  const boxHeight = 14;

  // "Decider" label
  setFont(doc, SIZE.SMALL, STYLE.BOLD);
  doc.text('Decider', deciderX + boxWidth / 2, deciderCenterY - boxHeight - 4, { align: 'center' });

  // Solid match box
  doc.setDrawColor(60);
  doc.setLineWidth(0.5);
  doc.rect(deciderX, deciderCenterY - boxHeight - 1, boxWidth, boxHeight);

  // Divider in match box
  doc.setLineWidth(0.2);
  doc.line(deciderX, deciderCenterY - boxHeight / 2 - 1, deciderX + boxWidth, deciderCenterY - boxHeight / 2 - 1);

  // Populate decider box with participant names if available
  if (data.deciderMatch?.matchUps?.length) {
    const decMu = data.deciderMatch.matchUps[0];
    const slotMap = new Map(data.deciderMatch.slots.map((s) => [s.drawPosition, s]));

    if (decMu.drawPositions[0]) {
      const slot = slotMap.get(decMu.drawPositions[0]);
      if (slot?.participantName) {
        const isWinner = decMu.winningSide === 1;
        setFont(doc, SIZE.TINY, isWinner ? STYLE.BOLD : STYLE.NORMAL);
        doc.text(slot.participantName, deciderX + 1, deciderCenterY - boxHeight / 2 - 3, { maxWidth: boxWidth - 2 });
      }
    }
    if (decMu.drawPositions[1]) {
      const slot = slotMap.get(decMu.drawPositions[1]);
      if (slot?.participantName) {
        const isWinner = decMu.winningSide === 2;
        setFont(doc, SIZE.TINY, isWinner ? STYLE.BOLD : STYLE.NORMAL);
        doc.text(slot.participantName, deciderX + 1, deciderCenterY - 3, { maxWidth: boxWidth - 2 });
      }
    }

    // Score in the match box
    if (decMu.score) {
      setFont(doc, SIZE.TINY, STYLE.NORMAL);
      doc.setTextColor(60, 60, 160);
      doc.text(decMu.score, deciderX + boxWidth - 1, deciderCenterY - boxHeight + 2, { align: 'right' });
      doc.setTextColor(0);
    }
  }
}

/** Override round labels in the main bracket for double elimination display */
function overrideMainRoundLabels(drawData: DrawData): DrawData {
  const map = { ...(drawData.roundLabelMap || {}) };

  for (const r of Object.keys(map)) {
    if (map[Number(r)] === 'F-Q') map[Number(r)] = 'SF';
  }

  return { ...drawData, roundLabelMap: map };
}
