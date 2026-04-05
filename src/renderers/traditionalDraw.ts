import jsPDF from 'jspdf';
import type { DrawFormatConfig, PageRegions } from '../config/types';
import type { DrawData, DrawSlot, DrawMatchUp } from '../core/extractDrawData';
import { getRoundLabel } from '../core/extractDrawData';
import { formatPlayerEntrySplit, formatMatchScore } from './formatEntry';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export interface TraditionalDrawConfig {
  lineHeight: number;
  roundColumnWidth: number;
  firstRoundWidth: number;
  secondRoundWidth: number;
  connectorGap: number;
  fontSize: number;
  scoreFontSize: number;
}

export function getDrawConfig(positionCount: number, regions: PageRegions, roundCount?: number): TraditionalDrawConfig {
  const totalRounds = roundCount || Math.log2(positionCount);

  // Height: reserve 9mm for round headers + gap. The bracket spans positionCount-1 gaps.
  const headerReserve = 9;
  const availableHeight = regions.contentHeight - headerReserve;
  const lineHeight = availableHeight / positionCount;
  const isDense = lineHeight < 3.5;

  // Width: first round + connectorGap + (totalRounds-1) later round columns + connectorGap each + winner column
  // Total columns after R1 = totalRounds (rounds 2..N = totalRounds-1, plus 1 winner column)
  const connectorGap = isDense ? 0.8 : 1.5;
  const laterColumns = totalRounds; // includes winner column
  const totalConnectorWidth = connectorGap * (laterColumns + 1); // gap before each later column + gap after R1

  // First round gets enough for position number + name; later rounds share the rest equally
  // Dense draws (64/128) get a narrower R1 to give later rounds more room for name + score
  const isVeryDense = lineHeight < 2;
  const firstRoundPct = isDense ? 0.18 : 0.3;
  const firstRoundWidth = Math.min(isDense ? 38 : 65, regions.contentWidth * firstRoundPct);
  const remainingWidth = regions.contentWidth - firstRoundWidth - totalConnectorWidth;

  // For very dense draws (128), give R2 extra width for inline scores
  const r2Bonus = isVeryDense ? 8 : 0;
  const adjustedRemaining = remainingWidth - r2Bonus;
  const roundColumnWidth = Math.min(65, Math.max(8, adjustedRemaining / Math.max(1, laterColumns)));
  const secondRoundWidth = roundColumnWidth + r2Bonus;

  // Font sizing adapts to density
  let fontSize = SIZE.SMALL;
  if (lineHeight < 2.5) fontSize = 5;
  else if (lineHeight < 3.5) fontSize = SIZE.TINY;

  return {
    lineHeight,
    roundColumnWidth,
    firstRoundWidth,
    secondRoundWidth,
    connectorGap,
    fontSize,
    scoreFontSize: isDense ? 5 : SIZE.TINY,
  };
}

export function renderTraditionalDraw(
  doc: jsPDF,
  drawData: DrawData,
  format: DrawFormatConfig,
  regions: PageRegions,
  positionOffset: number = 0,
  positionCount?: number,
): void {
  // Detect feed structure: any round with match count >= previous round
  const isFeedStructure = detectFeedStructure(drawData.matchUps);

  if (isFeedStructure) {
    renderFeedDraw(doc, drawData, format, regions);
  } else {
    renderPowerOf2Draw(doc, drawData, format, regions, positionOffset, positionCount);
  }
}

function detectFeedStructure(matchUps: DrawMatchUp[]): boolean {
  const roundCounts = new Map<number, number>();
  for (const mu of matchUps) {
    roundCounts.set(mu.roundNumber, (roundCounts.get(mu.roundNumber) || 0) + 1);
  }
  const rounds = [...roundCounts.keys()].sort((a, b) => a - b);
  for (let i = 1; i < rounds.length; i++) {
    const prev = roundCounts.get(rounds[i - 1]) || 0;
    const curr = roundCounts.get(rounds[i]) || 0;
    if (curr >= prev) return true;
  }
  return false;
}

/**
 * Renders feed-in structures.
 *
 * Feed-in draws have alternating elimination and feed rounds:
 *   FEED_IN 12: R1(4 matches) → R2(4 feed) → R3(2) → R4(1)
 *   FIC 16 consolation: R1(4) → R2(4 feed) → R3(2) → R4(2 feed) → R5(1) → R6(1 feed)
 *
 * The first round renders draw positions as player lines. Feed rounds render
 * the fed-in participant as a new player line entering from the left, while
 * the advancing winner comes via a connector from the previous round.
 * Elimination rounds merge pairs with standard bracket connectors.
 */
function renderFeedDraw(doc: jsPDF, drawData: DrawData, format: DrawFormatConfig, regions: PageRegions): void {
  const margins = format.page.margins;
  const headerReserve = 9;
  const contentTop = regions.contentY + headerReserve;
  const contentHeight = regions.contentHeight - headerReserve;

  const roundMap = groupMatchUpsByRound(drawData.matchUps);
  const sortedRounds = [...roundMap.keys()].sort((a, b) => a - b);
  const totalRoundCols = sortedRounds.length;
  const slotMap = new Map(drawData.slots.map((s) => [s.drawPosition, s]));

  const feedRoundSet = identifyFeedRounds(sortedRounds, roundMap);

  const { feedConfig, connectorGap, firstRoundWidth, roundColumnWidth, fontSize, scoreFontSize } = computeFeedLayout(
    contentHeight,
    roundMap,
    sortedRounds,
    totalRoundCols,
    regions,
  );

  const getColX = (ci: number) => {
    if (ci === 0) return margins.left;
    return margins.left + firstRoundWidth + connectorGap + (ci - 1) * (roundColumnWidth + connectorGap);
  };

  renderFeedRoundHeaders(
    doc,
    sortedRounds,
    drawData,
    feedConfig,
    format,
    regions,
    getColX,
    totalRoundCols,
    roundColumnWidth,
  );

  const roundSlotYs = computeFeedSlotYs(
    sortedRounds,
    totalRoundCols,
    roundMap,
    feedRoundSet,
    contentTop,
    contentHeight,
    feedConfig.lineHeight,
  );

  renderFeedRounds(
    doc,
    sortedRounds,
    totalRoundCols,
    roundMap,
    roundSlotYs,
    feedRoundSet,
    slotMap,
    feedConfig,
    format,
    getColX,
    firstRoundWidth,
    roundColumnWidth,
    connectorGap,
    scoreFontSize,
  );

  renderFeedWinnerColumn(
    doc,
    drawData,
    sortedRounds,
    totalRoundCols,
    roundMap,
    roundSlotYs,
    slotMap,
    getColX,
    contentTop,
    contentHeight,
    roundColumnWidth,
    fontSize,
    scoreFontSize,
    format,
  );
}

function groupMatchUpsByRound(matchUps: DrawMatchUp[]): Map<number, DrawMatchUp[]> {
  const roundMap = new Map<number, DrawMatchUp[]>();
  for (const mu of matchUps) {
    if (!roundMap.has(mu.roundNumber)) roundMap.set(mu.roundNumber, []);
    roundMap.get(mu.roundNumber)!.push(mu);
  }
  for (const [, mus] of roundMap) mus.sort((a, b) => a.roundPosition - b.roundPosition);
  return roundMap;
}

function identifyFeedRounds(sortedRounds: number[], roundMap: Map<number, DrawMatchUp[]>): Set<number> {
  const feedRoundSet = new Set<number>();
  for (let i = 1; i < sortedRounds.length; i++) {
    const prev = roundMap.get(sortedRounds[i - 1])?.length || 0;
    const curr = roundMap.get(sortedRounds[i])?.length || 0;
    if (curr >= prev) feedRoundSet.add(sortedRounds[i]);
  }
  return feedRoundSet;
}

function computeFeedLayout(
  contentHeight: number,
  roundMap: Map<number, DrawMatchUp[]>,
  sortedRounds: number[],
  totalRoundCols: number,
  regions: PageRegions,
): {
  feedConfig: TraditionalDrawConfig;
  connectorGap: number;
  firstRoundWidth: number;
  roundColumnWidth: number;
  fontSize: number;
  scoreFontSize: number;
} {
  const connectorGap = 1.5;
  const r1MatchCount = roundMap.get(sortedRounds[0])?.length || 1;
  const lineHeight = contentHeight / (r1MatchCount * 2);
  const isDense = lineHeight < 3.5;
  const firstRoundWidth = Math.min(isDense ? 50 : 60, regions.contentWidth * 0.25);
  const remainingWidth = regions.contentWidth - firstRoundWidth - connectorGap * (totalRoundCols + 1);
  const roundColumnWidth = Math.max(8, remainingWidth / Math.max(1, totalRoundCols));

  let fontSize = SIZE.SMALL;
  if (lineHeight < 2.5) fontSize = 5;
  else if (lineHeight < 3.5) fontSize = SIZE.TINY;
  const scoreFontSize = isDense ? 5 : SIZE.TINY;

  const feedConfig: TraditionalDrawConfig = {
    lineHeight,
    roundColumnWidth,
    firstRoundWidth,
    secondRoundWidth: roundColumnWidth,
    connectorGap,
    fontSize,
    scoreFontSize,
  };

  return { feedConfig, connectorGap, firstRoundWidth, roundColumnWidth, fontSize, scoreFontSize };
}

function computeFeedSlotYs(
  sortedRounds: number[],
  totalRoundCols: number,
  roundMap: Map<number, DrawMatchUp[]>,
  feedRoundSet: Set<number>,
  contentTop: number,
  contentHeight: number,
  lineHeight: number,
): Map<number, { topY: number; bottomY: number; midY: number }[]> {
  const roundSlotYs = new Map<number, { topY: number; bottomY: number; midY: number }[]>();

  for (let ci = 0; ci < totalRoundCols; ci++) {
    const roundNum = sortedRounds[ci];
    const matchCount = roundMap.get(roundNum)?.length || 0;

    if (feedRoundSet.has(roundNum)) {
      const prevRound = sortedRounds[ci - 1];
      const prevSlots = roundSlotYs.get(prevRound) || [];
      const slots = prevSlots.slice(0, matchCount).map((ps) => {
        const armSpan = ps.bottomY - ps.topY;
        const maxArm = lineHeight * 2;
        if (armSpan > maxArm) {
          return { topY: ps.midY - lineHeight, bottomY: ps.midY + lineHeight, midY: ps.midY };
        }
        return { topY: ps.topY, bottomY: ps.bottomY, midY: ps.midY };
      });
      roundSlotYs.set(roundNum, slots);
    } else if (ci === 0) {
      const totalSlots = matchCount * 2;
      const slotSpacing = contentHeight / (totalSlots + 1);
      const slots: { topY: number; bottomY: number; midY: number }[] = [];
      for (let m = 0; m < matchCount; m++) {
        const topY = contentTop + slotSpacing * (m * 2 + 1);
        const bottomY = contentTop + slotSpacing * (m * 2 + 2);
        slots.push({ topY, bottomY, midY: (topY + bottomY) / 2 });
      }
      roundSlotYs.set(roundNum, slots);
    } else {
      const prevRound = sortedRounds[ci - 1];
      const prevSlots = roundSlotYs.get(prevRound) || [];
      const slots: { topY: number; bottomY: number; midY: number }[] = [];
      for (let m = 0; m < matchCount; m++) {
        const topSlot = prevSlots[m * 2];
        const bottomSlot = prevSlots[m * 2 + 1];
        if (topSlot && bottomSlot) {
          const topY = topSlot.midY;
          const bottomY = bottomSlot.midY;
          slots.push({ topY, bottomY, midY: (topY + bottomY) / 2 });
        }
      }
      roundSlotYs.set(roundNum, slots);
    }
  }

  return roundSlotYs;
}

function renderFeedRounds(
  doc: jsPDF,
  sortedRounds: number[],
  totalRoundCols: number,
  roundMap: Map<number, DrawMatchUp[]>,
  roundSlotYs: Map<number, { topY: number; bottomY: number; midY: number }[]>,
  feedRoundSet: Set<number>,
  slotMap: Map<number, DrawSlot>,
  feedConfig: TraditionalDrawConfig,
  format: DrawFormatConfig,
  getColX: (ci: number) => number,
  firstRoundWidth: number,
  roundColumnWidth: number,
  connectorGap: number,
  scoreFontSize: number,
): void {
  for (let ci = 0; ci < totalRoundCols; ci++) {
    const roundNum = sortedRounds[ci];
    const matchUps = roundMap.get(roundNum) || [];
    const slotYs = roundSlotYs.get(roundNum) || [];
    const colX = getColX(ci);
    const colWidth = ci === 0 ? firstRoundWidth : roundColumnWidth;
    const isFeed = feedRoundSet.has(roundNum);
    const rightX = colX + colWidth;
    const nextRoundIsFeed = ci < totalRoundCols - 1 && feedRoundSet.has(sortedRounds[ci + 1]);

    for (let mi = 0; mi < matchUps.length; mi++) {
      const mu = matchUps[mi];
      const sy = slotYs[mi];
      if (!sy) continue;

      doc.setDrawColor(40);
      doc.setLineWidth(0.25);

      if (ci === 0) {
        renderFeedFirstRound(
          doc,
          mu,
          sy,
          slotMap,
          format,
          feedConfig,
          colX,
          firstRoundWidth,
          rightX,
          connectorGap,
          nextRoundIsFeed,
        );
      } else if (isFeed) {
        renderFeedRound(
          doc,
          mu,
          sy,
          slotMap,
          roundMap,
          sortedRounds,
          ci,
          format,
          feedConfig,
          colX,
          roundColumnWidth,
          rightX,
          connectorGap,
          nextRoundIsFeed,
        );
      } else {
        renderFeedEliminationRound(
          doc,
          mu,
          sy,
          slotMap,
          format,
          feedConfig,
          colX,
          roundColumnWidth,
          rightX,
          connectorGap,
          nextRoundIsFeed,
        );
      }

      if (ci < totalRoundCols - 1) {
        const nextColX = getColX(ci + 1);
        if (nextRoundIsFeed) {
          doc.line(rightX, sy.midY, nextColX, sy.midY);
        } else {
          doc.line(rightX + connectorGap, sy.midY, nextColX, sy.midY);
        }
      }

      if (mu.score) {
        const scoreStr = formatMatchScore(mu.score, format);
        setFont(doc, scoreFontSize, STYLE.NORMAL);
        doc.setTextColor(60, 60, 160);
        const scoreBaselineY = sy.midY + scoreFontSize * 0.12;
        doc.text(scoreStr, rightX - 1, scoreBaselineY, { align: 'right' });
        doc.setTextColor(0);
      }
    }
  }
}

function renderFeedFirstRound(
  doc: jsPDF,
  mu: DrawMatchUp,
  sy: { topY: number; bottomY: number; midY: number },
  slotMap: Map<number, DrawSlot>,
  format: DrawFormatConfig,
  feedConfig: TraditionalDrawConfig,
  colX: number,
  firstRoundWidth: number,
  rightX: number,
  connectorGap: number,
  nextRoundIsFeed: boolean,
): void {
  if (mu.drawPositions[0])
    drawPlayerLine(
      doc,
      slotMap.get(mu.drawPositions[0]),
      mu.drawPositions[0],
      format,
      feedConfig,
      colX,
      sy.topY,
      firstRoundWidth,
    );
  if (mu.drawPositions[1])
    drawPlayerLine(
      doc,
      slotMap.get(mu.drawPositions[1]),
      mu.drawPositions[1],
      format,
      feedConfig,
      colX,
      sy.bottomY,
      firstRoundWidth,
    );

  drawRightBracketConnector(doc, sy, rightX, connectorGap, nextRoundIsFeed);
}

function renderFeedRound(
  doc: jsPDF,
  mu: DrawMatchUp,
  sy: { topY: number; bottomY: number; midY: number },
  slotMap: Map<number, DrawSlot>,
  roundMap: Map<number, DrawMatchUp[]>,
  sortedRounds: number[],
  ci: number,
  format: DrawFormatConfig,
  feedConfig: TraditionalDrawConfig,
  colX: number,
  roundColumnWidth: number,
  rightX: number,
  connectorGap: number,
  nextRoundIsFeed: boolean,
): void {
  const prevRoundNum = sortedRounds[ci - 1];
  const prevMatchUps = roundMap.get(prevRoundNum) || [];
  const prevWinnerPositions = new Set<number>();
  for (const pmu of prevMatchUps) {
    if (pmu.winningSide) {
      prevWinnerPositions.add(pmu.drawPositions[pmu.winningSide - 1]);
    }
  }

  const advDp = mu.drawPositions.find((dp) => dp && prevWinnerPositions.has(dp));
  const fedDp = mu.drawPositions.find((dp) => dp && dp !== advDp);

  doc.line(colX, sy.midY, colX, sy.bottomY);

  if (fedDp) {
    drawPlayerLine(doc, slotMap.get(fedDp), fedDp, format, feedConfig, colX, sy.topY, roundColumnWidth);
  } else {
    doc.line(colX, sy.topY, colX + roundColumnWidth, sy.topY);
  }
  doc.line(colX, sy.bottomY, colX + roundColumnWidth, sy.bottomY);
  if (advDp) {
    const advSlot = slotMap.get(advDp);
    if (advSlot?.participantName) {
      drawAdvancingName(doc, advSlot, format, feedConfig, colX, sy.bottomY);
    }
  }

  drawRightBracketConnector(doc, sy, rightX, connectorGap, nextRoundIsFeed);
}

function renderFeedEliminationRound(
  doc: jsPDF,
  mu: DrawMatchUp,
  sy: { topY: number; bottomY: number; midY: number },
  slotMap: Map<number, DrawSlot>,
  format: DrawFormatConfig,
  feedConfig: TraditionalDrawConfig,
  colX: number,
  roundColumnWidth: number,
  rightX: number,
  connectorGap: number,
  nextRoundIsFeed: boolean,
): void {
  doc.line(colX, sy.topY, colX + roundColumnWidth, sy.topY);
  doc.line(colX, sy.bottomY, colX + roundColumnWidth, sy.bottomY);

  if (mu.drawPositions[0]) {
    const topSlot = slotMap.get(mu.drawPositions[0]);
    if (topSlot?.participantName) {
      drawAdvancingName(doc, topSlot, format, feedConfig, colX, sy.topY);
    }
  }
  if (mu.drawPositions[1]) {
    const bottomSlot = slotMap.get(mu.drawPositions[1]);
    if (bottomSlot?.participantName) {
      drawAdvancingName(doc, bottomSlot, format, feedConfig, colX, sy.bottomY);
    }
  }

  drawRightBracketConnector(doc, sy, rightX, connectorGap, nextRoundIsFeed);
}

function drawRightBracketConnector(
  doc: jsPDF,
  sy: { topY: number; bottomY: number },
  rightX: number,
  connectorGap: number,
  nextRoundIsFeed: boolean,
): void {
  if (nextRoundIsFeed) {
    doc.line(rightX, sy.topY, rightX, sy.bottomY);
  } else {
    doc.line(rightX + connectorGap, sy.topY, rightX + connectorGap, sy.bottomY);
    doc.line(rightX, sy.topY, rightX + connectorGap, sy.topY);
    doc.line(rightX, sy.bottomY, rightX + connectorGap, sy.bottomY);
  }
}

function renderFeedWinnerColumn(
  doc: jsPDF,
  drawData: DrawData,
  sortedRounds: number[],
  totalRoundCols: number,
  roundMap: Map<number, DrawMatchUp[]>,
  roundSlotYs: Map<number, { topY: number; bottomY: number; midY: number }[]>,
  slotMap: Map<number, DrawSlot>,
  getColX: (ci: number) => number,
  contentTop: number,
  contentHeight: number,
  roundColumnWidth: number,
  fontSize: number,
  scoreFontSize: number,
  format: DrawFormatConfig,
): void {
  if (drawData.noWinnerColumn) return;

  const winnerColX = getColX(totalRoundCols);
  const lastRound = sortedRounds.at(-1)!;
  const lastSlots = roundSlotYs.get(lastRound) || [];
  const winnerMidY = lastSlots[0]?.midY || contentTop + contentHeight / 2;

  doc.setDrawColor(40);
  doc.setLineWidth(0.25);
  doc.line(winnerColX, winnerMidY, winnerColX + Math.min(65, roundColumnWidth), winnerMidY);

  const finalMu = (roundMap.get(lastRound) || [])[0];
  if (finalMu?.winningSide) {
    const winnerPos = finalMu.drawPositions[finalMu.winningSide - 1];
    const winnerSlot = slotMap.get(winnerPos);
    if (winnerSlot) {
      setFont(doc, fontSize + 1, STYLE.BOLD);
      const { name: winnerName } = formatPlayerEntrySplit(winnerSlot, format);
      doc.text(winnerName, winnerColX + 1, winnerMidY - 0.5);

      if (finalMu.score) {
        const scoreStr = formatMatchScore(finalMu.score, format);
        setFont(doc, scoreFontSize, STYLE.NORMAL);
        doc.setTextColor(60, 60, 160);
        doc.text(scoreStr, winnerColX + 1, winnerMidY + scoreFontSize * 0.4);
        doc.setTextColor(0);
      }
    }
  }
}

function renderFeedRoundHeaders(
  doc: jsPDF,
  sortedRounds: number[],
  drawData: DrawData,
  config: TraditionalDrawConfig,
  format: DrawFormatConfig,
  regions: PageRegions,
  getColX: (ci: number) => number,
  totalRoundCols: number,
  roundColumnWidth: number,
): void {
  const headerFontSize = config.fontSize <= SIZE.TINY ? 5.5 : SIZE.SMALL;
  setFont(doc, headerFontSize, STYLE.BOLD);
  doc.setTextColor(40);

  for (let ci = 0; ci < totalRoundCols; ci++) {
    const roundNum = sortedRounds[ci];
    const defaultLabel = getRoundLabel(roundNum, drawData.totalRounds);
    const label = drawData.roundLabelMap?.[roundNum] || format.roundLabels[defaultLabel] || defaultLabel;
    const x = getColX(ci);
    const width = ci === 0 ? config.firstRoundWidth : roundColumnWidth;
    doc.text(label, x + width / 2, regions.contentY + 2, { align: 'center' });
    doc.setDrawColor(160);
    doc.setLineWidth(0.15);
    doc.line(x + 2, regions.contentY + 3.5, x + width - 2, regions.contentY + 3.5);
  }

  const winnerX = getColX(totalRoundCols);
  doc.text('Winner', winnerX + roundColumnWidth / 2, regions.contentY + 2, { align: 'center' });
  doc.setDrawColor(160);
  doc.line(winnerX + 2, regions.contentY + 3.5, winnerX + roundColumnWidth - 2, regions.contentY + 3.5);
  doc.setTextColor(0);
}

function renderPowerOf2Draw(
  doc: jsPDF,
  drawData: DrawData,
  format: DrawFormatConfig,
  regions: PageRegions,
  positionOffset: number = 0,
  positionCount?: number,
): void {
  const count = positionCount || drawData.drawSize;
  const actualRoundCount = drawData.totalRounds || Math.ceil(Math.log2(count));
  const computedRounds = Math.log2(count);
  // Use actual round count from data when it differs from the computed value
  // (e.g., qualifying structures that don't resolve to a single winner)
  const totalRounds = Number.isInteger(computedRounds) ? Math.min(computedRounds, actualRoundCount) : actualRoundCount;
  const config = getDrawConfig(count, regions, totalRounds);
  const margins = format.page.margins;

  const startX = margins.left;
  const startY = regions.contentY + 9;

  renderRoundHeaders(
    doc,
    totalRounds,
    drawData.totalRounds,
    config,
    format,
    startX,
    regions.contentY + 2,
    drawData.roundLabelMap,
    drawData.noWinnerColumn,
  );

  for (let round = 0; round < totalRounds; round++) {
    renderPowerOf2Round(doc, drawData, format, config, count, round, totalRounds, startX, startY, positionOffset);
  }

  if (drawData.noWinnerColumn) return;

  renderPowerOf2WinnerColumn(doc, drawData, format, config, totalRounds, startX, startY);
}

function renderPowerOf2Round(
  doc: jsPDF,
  drawData: DrawData,
  format: DrawFormatConfig,
  config: TraditionalDrawConfig,
  count: number,
  round: number,
  totalRounds: number,
  startX: number,
  startY: number,
  positionOffset: number,
): void {
  const matchesInRound = count / Math.pow(2, round + 1);
  const spacing = config.lineHeight * Math.pow(2, round);
  const roundX = getRoundX(round, config, startX);
  const roundOffset = ((Math.pow(2, round) - 1) * config.lineHeight) / 2;
  const stride = Math.pow(2, round + 1) * config.lineHeight;

  for (let match = 0; match < matchesInRound; match++) {
    const topSlotY = startY + roundOffset + match * stride;
    const bottomSlotY = topSlotY + spacing;
    const midY = (topSlotY + bottomSlotY) / 2;

    if (round === 0) {
      const topPos = positionOffset + match * 2 + 1;
      const bottomPos = positionOffset + match * 2 + 2;
      drawPlayerLine(doc, findSlot(drawData.slots, topPos), topPos, format, config, roundX, topSlotY);
      drawPlayerLine(doc, findSlot(drawData.slots, bottomPos), bottomPos, format, config, roundX, bottomSlotY);
    } else {
      const colWidth = getRoundWidth(round, config);
      doc.setDrawColor(40);
      doc.setLineWidth(0.25);
      doc.line(roundX, topSlotY, roundX + colWidth, topSlotY);
      doc.line(roundX, bottomSlotY, roundX + colWidth, bottomSlotY);
    }

    const isFinalRound = round === totalRounds - 1;
    const rightX = roundX + getRoundWidth(round, config);

    // Always draw the bracket connector (vertical + horizontals between the two slots)
    doc.setDrawColor(40);
    doc.setLineWidth(0.25);
    doc.line(rightX + config.connectorGap, topSlotY, rightX + config.connectorGap, bottomSlotY);
    doc.line(rightX, topSlotY, rightX + config.connectorGap, topSlotY);
    doc.line(rightX, bottomSlotY, rightX + config.connectorGap, bottomSlotY);

    // Horizontal line from bracket midpoint to the next round (skip on qualifying final)
    if (!isFinalRound || !drawData.noWinnerColumn) {
      const nextRoundX = getRoundX(round + 1, config, startX);
      doc.line(rightX + config.connectorGap, midY, nextRoundX, midY);
    }

    const mu = findMatchUp(drawData.matchUps, round + 1, match + 1);

    if (isFinalRound && drawData.noWinnerColumn) {
      // Final qualifying round: draw a short winner line and name to the right
      const advancingSlot = getAdvancingSlot(mu, drawData.slots);
      if (advancingSlot) {
        doc.setDrawColor(40);
        doc.setLineWidth(0.25);
        doc.line(rightX + config.connectorGap, midY, rightX + config.connectorGap + config.roundColumnWidth, midY);
        drawAdvancingName(doc, advancingSlot, format, config, rightX + config.connectorGap, midY);
        if (mu?.score) {
          renderMatchScore(doc, mu, format, config, spacing, rightX + config.connectorGap, round, midY);
        }
      }
    } else if (!isFinalRound) {
      const advancingSlot = getAdvancingSlot(mu, drawData.slots);
      if (advancingSlot) {
        const nextRoundX = getRoundX(round + 1, config, startX);
        drawAdvancingName(doc, advancingSlot, format, config, nextRoundX, midY);
        if (mu?.score) {
          renderMatchScore(doc, mu, format, config, spacing, nextRoundX, round, midY);
        }
      }
    }
  }
}

function renderMatchScore(
  doc: jsPDF,
  mu: DrawMatchUp,
  format: DrawFormatConfig,
  config: TraditionalDrawConfig,
  spacing: number,
  nextRoundX: number,
  round: number,
  midY: number,
): void {
  const scoreStr = formatMatchScore(mu.score!, format);
  setFont(doc, config.scoreFontSize, STYLE.NORMAL);
  doc.setTextColor(60, 60, 160);
  const nextRoundSlotHeight = spacing * 2;
  const isDenseRound = nextRoundSlotHeight < config.scoreFontSize * 1.2;
  if (isDenseRound) {
    const nextColWidth = getRoundWidth(round + 1, config);
    const colRight = nextRoundX + nextColWidth - 1;
    doc.text(scoreStr, colRight, midY - 0.5, { align: 'right' });
  } else {
    const scoreOffset = config.scoreFontSize * 0.4;
    doc.text(scoreStr, nextRoundX + 1, midY - 0.5 + scoreOffset);
  }
  doc.setTextColor(0);
}

function renderPowerOf2WinnerColumn(
  doc: jsPDF,
  drawData: DrawData,
  format: DrawFormatConfig,
  config: TraditionalDrawConfig,
  totalRounds: number,
  startX: number,
  startY: number,
): void {
  const winnerX = getRoundX(totalRounds, config, startX);
  const finalRoundOffset = ((Math.pow(2, totalRounds - 1) - 1) * config.lineHeight) / 2;
  const finalSpacing = config.lineHeight * Math.pow(2, totalRounds - 1);
  const winnerMidY = startY + finalRoundOffset + finalSpacing / 2;

  doc.setDrawColor(40);
  doc.setLineWidth(0.25);
  doc.line(winnerX, winnerMidY, winnerX + config.roundColumnWidth, winnerMidY);

  const finalMu = findMatchUp(drawData.matchUps, totalRounds, 1);
  if (finalMu?.winningSide) {
    const winnerPos = finalMu.drawPositions[finalMu.winningSide - 1];
    const winnerSlot = findSlot(drawData.slots, winnerPos);
    if (winnerSlot) {
      setFont(doc, config.fontSize + 1, STYLE.BOLD);
      const { name: winnerName } = formatPlayerEntrySplit(winnerSlot, format);
      doc.text(winnerName, winnerX + 1, winnerMidY - 0.5);

      if (finalMu.score) {
        const scoreStr = formatMatchScore(finalMu.score, format);
        setFont(doc, config.scoreFontSize, STYLE.NORMAL);
        doc.setTextColor(60, 60, 160);
        doc.text(scoreStr, winnerX + 1, winnerMidY + config.scoreFontSize * 0.4);
        doc.setTextColor(0);
      }
    }
  }
}

function renderRoundHeaders(
  doc: jsPDF,
  segmentRounds: number,
  totalRounds: number,
  config: TraditionalDrawConfig,
  format: DrawFormatConfig,
  startX: number,
  y: number,
  roundLabelMap?: Record<number, string>,
  noWinnerColumn?: boolean,
): void {
  const isDense = config.fontSize <= SIZE.TINY;
  const headerFontSize = isDense ? 5.5 : SIZE.SMALL;

  setFont(doc, headerFontSize, STYLE.BOLD);
  doc.setTextColor(40);

  // Round headers for R1..Rn
  for (let round = 0; round < segmentRounds; round++) {
    const roundNumber = totalRounds - segmentRounds + round + 1;
    const defaultLabel = getRoundLabel(roundNumber, totalRounds);
    const label = roundLabelMap?.[roundNumber] || format.roundLabels[defaultLabel] || defaultLabel;
    const x = getRoundX(round, config, startX);
    const width = getRoundWidth(round, config);
    const centerX = x + width / 2;

    doc.text(label, centerX, y, { align: 'center' });

    doc.setDrawColor(160);
    doc.setLineWidth(0.15);
    doc.line(x + 2, y + 1.5, x + width - 2, y + 1.5);
  }

  // Winner column header (only on pages that include the final)
  if (!noWinnerColumn) {
    const winnerX = getRoundX(segmentRounds, config, startX);
    doc.text('Winner', winnerX + config.roundColumnWidth / 2, y, { align: 'center' });
    doc.setDrawColor(160);
    doc.setLineWidth(0.15);
    doc.line(winnerX + 2, y + 1.5, winnerX + config.roundColumnWidth - 2, y + 1.5);
  }

  doc.setTextColor(0);
}

function getRoundWidth(round: number, config: TraditionalDrawConfig): number {
  if (round === 0) return config.firstRoundWidth;
  if (round === 1) return config.secondRoundWidth;
  return config.roundColumnWidth;
}

function getRoundX(round: number, config: TraditionalDrawConfig, startX: number): number {
  if (round === 0) return startX;
  let x = startX + config.firstRoundWidth + config.connectorGap;
  for (let r = 1; r < round; r++) {
    x += getRoundWidth(r, config) + config.connectorGap;
  }
  return x;
}

function drawPlayerLine(
  doc: jsPDF,
  slot: DrawSlot | undefined,
  drawPosition: number,
  format: DrawFormatConfig,
  config: TraditionalDrawConfig,
  x: number,
  y: number,
  colWidth?: number,
): void {
  const posNumWidth = config.fontSize <= 5 ? 4 : 5;
  const natGapWidth = config.fontSize <= 5 ? 5 : 6;
  const width = colWidth || config.firstRoundWidth;

  // Draw position number (left-aligned)
  const textOffset = config.lineHeight < 2 ? 0.15 : 0.3;
  setFont(doc, config.scoreFontSize, STYLE.NORMAL);
  doc.setTextColor(120);
  doc.text(`${drawPosition}`, x, y - textOffset, { align: 'left' });
  doc.setTextColor(0);

  // Nationality / country code in the gap between position number and line
  if (slot?.nationality) {
    setFont(doc, config.scoreFontSize, STYLE.NORMAL);
    doc.setTextColor(100);
    doc.text(slot.nationality, x + posNumWidth + natGapWidth - 1, y - textOffset, { align: 'right' });
    doc.setTextColor(0);
  }

  // Horizontal line (starts after the nationality gap)
  const lineStart = x + posNumWidth + natGapWidth;
  const lineEnd = x + width;
  doc.setDrawColor(40);
  doc.setLineWidth(0.25);
  doc.line(lineStart, y, lineEnd, y);

  if (!slot) return;

  const { name } = formatPlayerEntrySplit(slot, format);
  if (!name) return;

  setFont(doc, config.fontSize, slot.isBye ? STYLE.ITALIC : STYLE.NORMAL);
  if (slot.isBye) doc.setTextColor(150);

  // If name is too wide, use abbreviated form (F. LASTNAME)
  const availableWidth = lineEnd - lineStart - 2;
  let displayName = name;
  if (doc.getTextWidth(name) > availableWidth) {
    displayName = abbreviateName(slot.participantName);
  }
  const nameOffset = config.lineHeight < 2 ? 0.2 : 0.5;
  doc.text(displayName, lineStart + 1, y - nameOffset);
  if (slot.isBye) doc.setTextColor(0);
}

function drawAdvancingName(
  doc: jsPDF,
  slot: DrawSlot,
  format: DrawFormatConfig,
  config: TraditionalDrawConfig,
  x: number,
  y: number,
): void {
  const shortName = abbreviateName(slot.participantName);
  let seed = '';
  if (slot.seedValue) {
    seed = format.seedFormat === 'parens' ? `(${slot.seedValue})` : `[${slot.seedValue}]`;
  }
  const display = seed ? `${shortName} ${seed}` : shortName;

  setFont(doc, config.fontSize, STYLE.BOLD);
  doc.text(display, x + 1, y - 0.5);
}

function abbreviateName(fullName: string): string {
  const commaMatch = fullName.match(/^([^,]+),\s*(.+)/);
  if (commaMatch) return `${commaMatch[2][0]}. ${commaMatch[1]}`;
  const spaceMatch = fullName.match(/^(\S+)\s+(.+)/);
  if (spaceMatch) return `${spaceMatch[1][0]}. ${spaceMatch[2]}`;
  return fullName;
}

function findSlot(slots: DrawSlot[], drawPosition: number): DrawSlot | undefined {
  return slots.find((s) => s.drawPosition === drawPosition);
}

function findMatchUp(matchUps: DrawMatchUp[], roundNumber: number, roundPosition: number): DrawMatchUp | undefined {
  return matchUps.find((mu) => mu.roundNumber === roundNumber && mu.roundPosition === roundPosition);
}

/** Find the advancing participant slot for a matchUp (handles both completed and BYE matchUps) */
function getAdvancingSlot(mu: DrawMatchUp | undefined, slots: DrawSlot[]): DrawSlot | undefined {
  if (!mu) return undefined;

  if (mu.winningSide) {
    const winnerPos = mu.drawPositions[mu.winningSide - 1];
    return findSlot(slots, winnerPos);
  }

  // BYE matchUp: the non-BYE participant advances
  if (mu.matchUpStatus === 'BYE') {
    for (const pos of mu.drawPositions) {
      const slot = findSlot(slots, pos);
      if (slot && !slot.isBye && slot.participantName) return slot;
    }
  }

  return undefined;
}
