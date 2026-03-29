/**
 * Quantitative fidelity report.
 *
 * Parses each reference PDF, counts extracted participants/scores/seeds,
 * compares against known ground truth, and outputs accuracy percentages.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { parsePdfBuffer } from '../../parser/pdfExtractor';
import { extractDrawFromPage } from '../../parser/drawExtractor';
import { extractDrawMerged } from '../../parser/drawExtractor';

const REFERENCE_DIR = resolve(__dirname, '../../../fixtures/reference');
const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

interface GroundTruth {
  file: string;
  name: string;
  pages: number;
  totalParticipants: number;
  totalSeeds: number;
  totalScores: number;
  useMerged: boolean;
}

const GROUND_TRUTH: GroundTruth[] = [
  {
    file: 'wimbledon_ms.pdf',
    name: 'Wimbledon MS 2025',
    pages: 2,
    totalParticipants: 128,
    totalSeeds: 32,
    totalScores: 127,
    useMerged: false,
  },
  {
    file: 'usopen_ms.pdf',
    name: 'US Open MS 2025',
    pages: 2,
    totalParticipants: 128,
    totalSeeds: 32,
    totalScores: 1,
    useMerged: false,
  },
  {
    file: 'ao_ws.pdf',
    name: 'Australian Open WS 2025',
    pages: 2,
    totalParticipants: 128,
    totalSeeds: 32,
    totalScores: 127,
    useMerged: false,
  },
  {
    file: 'rg_ws.pdf',
    name: 'Roland Garros WS 2025',
    pages: 2,
    totalParticipants: 128,
    totalSeeds: 32,
    totalScores: 127,
    useMerged: false,
  },
  {
    file: 'wta_dubai_ws.pdf',
    name: 'WTA Dubai WS 2025',
    pages: 1,
    totalParticipants: 64,
    totalSeeds: 16,
    totalScores: 63,
    useMerged: true,
  },
  {
    file: 'usopen_xd.pdf',
    name: 'US Open XD 2025',
    pages: 1,
    totalParticipants: 16,
    totalSeeds: 4,
    totalScores: 0,
    useMerged: false,
  },
];

describe('Quantitative fidelity report', () => {
  it('generates accuracy report for all reference PDFs', { timeout: 60000 }, async () => {
    const report: string[] = [
      '# PDF Extraction Fidelity Report',
      '',
      '| PDF | Pages | Participants | % | Seeds | % | Scores | % | Overall |',
      '|-----|-------|-------------|---|-------|---|--------|---|---------|',
    ];

    let totalAccuracy = 0;
    let pdfCount = 0;

    for (const gt of GROUND_TRUTH) {
      const pdfPath = resolve(REFERENCE_DIR, gt.file);
      if (!existsSync(pdfPath)) {
        report.push(`| ${gt.name} | - | N/A | - | N/A | - | N/A | - | N/A |`);
        continue;
      }

      const buffer = readFileSync(pdfPath);
      const parsed = await parsePdfBuffer(buffer);

      let totalParticipants = 0;
      let totalSeeds = 0;
      let totalScores = 0;

      for (let p = 0; p < parsed.pages.length; p++) {
        const extracted = gt.useMerged ? extractDrawMerged(parsed.pages[p]) : extractDrawFromPage(parsed.pages[p]);

        totalParticipants += extracted.participants.length;
        totalSeeds += extracted.participants.filter((p) => p.seedValue).length;
        totalScores += extracted.matchUps.length;
      }

      const partPct =
        gt.totalParticipants > 0 ? Math.min(100, Math.round((totalParticipants / gt.totalParticipants) * 100)) : 0;
      const seedPct = gt.totalSeeds > 0 ? Math.min(100, Math.round((totalSeeds / gt.totalSeeds) * 100)) : 0;
      const scorePct = gt.totalScores > 0 ? Math.min(100, Math.round((totalScores / gt.totalScores) * 100)) : 0;

      // Weight: 50% participants, 25% seeds, 25% scores
      const weights = gt.totalScores > 0 ? [0.5, 0.25, 0.25] : [0.7, 0.3, 0];
      const overall = Math.round(partPct * weights[0] + seedPct * weights[1] + scorePct * weights[2]);

      report.push(
        `| ${gt.name} | ${parsed.pages.length} | ${totalParticipants}/${gt.totalParticipants} | ${partPct}% | ${totalSeeds}/${gt.totalSeeds} | ${seedPct}% | ${totalScores}/${gt.totalScores} | ${scorePct}% | **${overall}%** |`,
      );

      totalAccuracy += overall;
      pdfCount++;
    }

    const avgAccuracy = pdfCount > 0 ? Math.round(totalAccuracy / pdfCount) : 0;
    report.push('');
    report.push(`**Average overall accuracy: ${avgAccuracy}%**`);
    report.push('');
    report.push('## Methodology');
    report.push('- Participants: count of player names extracted vs known draw size');
    report.push('- Seeds: count of seed values detected vs known seed count');
    report.push('- Scores: count of match scores extracted vs expected (drawSize - 1 for completed draws)');
    report.push('- Overall: weighted average (50% participants, 25% seeds, 25% scores)');
    report.push('- For draws without scores (blank/early), weight shifts to 70% participants, 30% seeds');
    report.push('');
    report.push('## Notes');
    report.push('- WTA Dubai uses merged text extraction (Chromium-generated PDF)');
    report.push('- US Open MS 2025 has very few scores (draw was early/blank)');
    report.push('- Australian Open uses (COUNTRY) format which reduces participant detection');
    report.push(`- Report generated: ${new Date().toISOString()}`);

    const reportText = report.join('\n');
    writeFileSync(resolve(OUTPUT_DIR, 'fidelity-accuracy-report.md'), reportText);

    console.log('\n' + reportText);
    expect(avgAccuracy).toBeGreaterThan(40);
  });
});
