/**
 * Visual comparison of PDFs using pdf-to-img + pixelmatch.
 *
 * Converts PDF pages to PNG images and compares them pixel-by-pixel.
 * Supports snapshot-based regression testing: first run creates snapshots,
 * subsequent runs compare against them and produce diff images.
 */

import { pdf } from 'pdf-to-img';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

export interface CompareResult {
  page: number;
  mismatchedPixels: number;
  totalPixels: number;
  mismatchPercent: number;
  diffPath?: string;
  snapshotCreated: boolean;
}

export interface CompareOptions {
  scale?: number;
  threshold?: number;
  snapshotsDir: string;
  snapshotName: string;
  updateSnapshots?: boolean;
}

export async function pdfToImages(pdfBuffer: Buffer, scale: number = 2.0): Promise<Buffer[]> {
  const pages: Buffer[] = [];
  const doc = await pdf(pdfBuffer, { scale });
  for await (const page of doc) {
    pages.push(page);
  }
  return pages;
}

export async function comparePdfToSnapshot(pdfBuffer: Buffer, options: CompareOptions): Promise<CompareResult[]> {
  const { scale = 2.0, threshold = 0.1, snapshotsDir, snapshotName, updateSnapshots = false } = options;

  mkdirSync(snapshotsDir, { recursive: true });
  const pages = await pdfToImages(pdfBuffer, scale);
  const results: CompareResult[] = [];

  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1;
    const snapPath = resolve(snapshotsDir, `${snapshotName}-page${pageNum}.png`);
    const diffPath = resolve(snapshotsDir, `${snapshotName}-page${pageNum}-diff.png`);

    if (!existsSync(snapPath) || updateSnapshots) {
      writeFileSync(snapPath, pages[i]);
      results.push({
        page: pageNum,
        mismatchedPixels: 0,
        totalPixels: 0,
        mismatchPercent: 0,
        snapshotCreated: true,
      });
      continue;
    }

    const actual = PNG.sync.read(pages[i]);
    const expected = PNG.sync.read(readFileSync(snapPath));

    // Handle size mismatches
    if (actual.width !== expected.width || actual.height !== expected.height) {
      writeFileSync(resolve(snapshotsDir, `${snapshotName}-page${pageNum}-actual.png`), pages[i]);
      results.push({
        page: pageNum,
        mismatchedPixels: actual.width * actual.height,
        totalPixels: actual.width * actual.height,
        mismatchPercent: 100,
        snapshotCreated: false,
      });
      continue;
    }

    const diff = new PNG({ width: actual.width, height: actual.height });
    const mismatched = pixelmatch(actual.data, expected.data, diff.data, actual.width, actual.height, {
      threshold,
    });

    const totalPixels = actual.width * actual.height;
    const mismatchPercent = (mismatched / totalPixels) * 100;

    if (mismatched > 0) {
      writeFileSync(diffPath, PNG.sync.write(diff));
    }

    results.push({
      page: pageNum,
      mismatchedPixels: mismatched,
      totalPixels,
      mismatchPercent,
      diffPath: mismatched > 0 ? diffPath : undefined,
      snapshotCreated: false,
    });
  }

  return results;
}

export async function comparetwoPdfs(
  pdfA: Buffer,
  pdfB: Buffer,
  outputDir: string,
  nameA: string = 'a',
  nameB: string = 'b',
  scale: number = 2.0,
  threshold: number = 0.1,
): Promise<CompareResult[]> {
  mkdirSync(outputDir, { recursive: true });
  const pagesA = await pdfToImages(pdfA, scale);
  const pagesB = await pdfToImages(pdfB, scale);
  const maxPages = Math.max(pagesA.length, pagesB.length);
  const results: CompareResult[] = [];

  for (let i = 0; i < maxPages; i++) {
    const pageNum = i + 1;

    if (!pagesA[i] || !pagesB[i]) {
      results.push({
        page: pageNum,
        mismatchedPixels: -1,
        totalPixels: 0,
        mismatchPercent: 100,
        snapshotCreated: false,
      });
      continue;
    }

    writeFileSync(resolve(outputDir, `${nameA}-page${pageNum}.png`), pagesA[i]);
    writeFileSync(resolve(outputDir, `${nameB}-page${pageNum}.png`), pagesB[i]);

    const imgA = PNG.sync.read(pagesA[i]);
    const imgB = PNG.sync.read(pagesB[i]);

    // Resize to match if needed (use smaller dimensions)
    const width = Math.min(imgA.width, imgB.width);
    const height = Math.min(imgA.height, imgB.height);

    if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
      results.push({
        page: pageNum,
        mismatchedPixels: -1,
        totalPixels: width * height,
        mismatchPercent: -1,
        snapshotCreated: false,
      });
      continue;
    }

    const diff = new PNG({ width, height });
    const mismatched = pixelmatch(imgA.data, imgB.data, diff.data, width, height, { threshold });
    const totalPixels = width * height;

    writeFileSync(resolve(outputDir, `diff-page${pageNum}.png`), PNG.sync.write(diff));

    results.push({
      page: pageNum,
      mismatchedPixels: mismatched,
      totalPixels,
      mismatchPercent: (mismatched / totalPixels) * 100,
      diffPath: resolve(outputDir, `diff-page${pageNum}.png`),
      snapshotCreated: false,
    });
  }

  return results;
}
