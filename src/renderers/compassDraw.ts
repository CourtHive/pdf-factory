/**
 * Compass draw renderer.
 *
 * Renders a compass draw with the main bracket (East) at the top,
 * followed by consolation brackets for each compass direction.
 * Each sub-bracket is a small single-elimination draw rendered
 * with a section header showing the compass direction name.
 *
 * Layout:
 * - Page 1: East (main bracket) — full width, traditional lines
 * - Below or page 2: West, North, South, NE, NW, SE, SW — smaller brackets
 *   arranged in a grid layout
 */

import jsPDF from 'jspdf';
import type { DrawFormatConfig, PageRegions } from '../config/types';
import type { CompassDrawData, CompassStructure } from '../core/extractCompassData';
import type { DrawData } from '../core/extractDrawData';
import { renderTraditionalDraw } from './traditionalDraw';
import { setFont, SIZE, STYLE } from '../layout/fonts';

// Rendering order: main bracket first, then consolation directions
const DIRECTION_ORDER = ['E', 'W', 'N', 'S', 'NE', 'NW', 'SE', 'SW'];

export function renderCompassDraw(
  doc: jsPDF,
  compassData: CompassDrawData,
  format: DrawFormatConfig,
  regions: PageRegions,
): void {
  const margins = format.page.margins;
  const sortedStructures = [...compassData.structures].sort(
    (a, b) => DIRECTION_ORDER.indexOf(a.abbreviation) - DIRECTION_ORDER.indexOf(b.abbreviation),
  );

  let y = regions.contentY + 3;

  for (const structure of sortedStructures) {
    if (structure.drawSize === 0) continue;

    // Check if we need a new page
    const estimatedHeight = estimateStructureHeight(structure, regions);
    if (y + estimatedHeight > regions.contentY + regions.contentHeight) {
      doc.addPage();
      y = regions.contentY;
    }

    // Section header with compass direction
    const isMain = structure.abbreviation === 'E';
    setFont(doc, isMain ? SIZE.HEADING : SIZE.BODY, STYLE.BOLD);
    if (!isMain) doc.setTextColor(30, 60, 120);
    const label = isMain ? `Main Draw (${structure.name})` : `${structure.name} Draw`;
    doc.text(label, margins.left, y);
    if (!isMain) doc.setTextColor(0);
    y += isMain ? 5 : 4;

    // Render the bracket
    const structureRegions: PageRegions = {
      ...regions,
      contentY: y,
      contentHeight: estimatedHeight - 6,
    };

    const drawData = structureToDrawData(structure, compassData.drawName);
    renderTraditionalDraw(doc, drawData, format, structureRegions);

    y += estimatedHeight + 3;
  }
}

function estimateStructureHeight(structure: CompassStructure, regions: PageRegions): number {
  const maxHeight = regions.contentHeight * 0.7;
  const minLineHeight = 5;
  const lineHeight = Math.max(minLineHeight, Math.min(8, maxHeight / structure.drawSize));
  return structure.drawSize * lineHeight + 10;
}

function structureToDrawData(structure: CompassStructure, drawName: string): DrawData {
  return {
    drawName: `${drawName} - ${structure.name}`,
    drawSize: structure.drawSize,
    drawType: 'SINGLE_ELIMINATION',
    totalRounds: structure.totalRounds,
    slots: structure.slots,
    matchUps: structure.matchUps,
    seedAssignments: [],
  };
}
