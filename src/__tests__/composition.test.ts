import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { createDoc, getPageRegions, getDefaultPageConfig } from '../composition/page';
import { renderHeader } from '../composition/headerLayouts';
import { renderFooter, measureFooterHeight } from '../composition/footerLayouts';
import type { HeaderConfig, FooterConfig } from '../config/types';

const OUTPUT_DIR = resolve(__dirname, '__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe('Page composition', () => {
  it('creates landscape doc for drawSize >= 32', () => {
    const config = getDefaultPageConfig();
    const doc = createDoc(config, 64);
    expect(doc.internal.pageSize.getWidth()).toBeGreaterThan(doc.internal.pageSize.getHeight());
  });

  it('creates portrait doc for drawSize < 32', () => {
    const config = getDefaultPageConfig();
    const doc = createDoc(config, 16);
    expect(doc.internal.pageSize.getHeight()).toBeGreaterThan(doc.internal.pageSize.getWidth());
  });

  it('calculates page regions correctly', () => {
    const config = getDefaultPageConfig();
    const doc = createDoc(config, 32);
    const regions = getPageRegions(doc, config, 25, 10);
    expect(regions.contentY).toEqual(config.margins.top + 25);
    expect(regions.contentHeight).toBeGreaterThan(100);
    expect(regions.contentWidth).toBeGreaterThan(200);
  });
});

describe('Header layouts', () => {
  it('renders grand-slam header', () => {
    const pageConfig = getDefaultPageConfig();
    const doc = createDoc(pageConfig, 64);
    const headerConfig: HeaderConfig = {
      layout: 'grand-slam',
      tournamentName: 'Wimbledon 2025',
      subtitle: "Gentlemen's Singles",
      startDate: '30 Jun 2025',
      endDate: '13 Jul 2025',
      location: 'London, England',
    };
    const height = renderHeader(doc, headerConfig, pageConfig);
    expect(height).toBeGreaterThan(15);

    const pdfBytes = doc.output('arraybuffer');
    writeFileSync(resolve(OUTPUT_DIR, 'header-grand-slam.pdf'), Buffer.from(pdfBytes));
  });

  it('renders itf header', () => {
    const pageConfig = getDefaultPageConfig();
    const doc = createDoc(pageConfig, 32);
    const headerConfig: HeaderConfig = {
      layout: 'itf',
      tournamentName: 'J300 Tucson',
      subtitle: 'Boys Singles - Main Draw',
      startDate: '09 Mar 2026',
      location: 'Tucson, USA',
      grade: 'J300',
      supervisor: 'Douglas Rice',
    };
    const height = renderHeader(doc, headerConfig, pageConfig);
    expect(height).toBeGreaterThan(10);

    const pdfBytes = doc.output('arraybuffer');
    writeFileSync(resolve(OUTPUT_DIR, 'header-itf.pdf'), Buffer.from(pdfBytes));
  });

  it('renders minimal header', () => {
    const pageConfig = getDefaultPageConfig();
    const doc = createDoc(pageConfig, 16);
    const headerConfig: HeaderConfig = {
      layout: 'minimal',
      tournamentName: 'Club Tournament',
      subtitle: 'Singles',
    };
    const height = renderHeader(doc, headerConfig, pageConfig);
    expect(height).toBeGreaterThan(0);
    expect(height).toBeLessThan(15);
  });

  it('returns 0 for none layout', () => {
    const pageConfig = getDefaultPageConfig();
    const doc = createDoc(pageConfig);
    const height = renderHeader(doc, { layout: 'none', tournamentName: '' }, pageConfig);
    expect(height).toEqual(0);
  });
});

describe('Footer layouts', () => {
  it('renders standard footer with page number and timestamp', () => {
    const config: FooterConfig = {
      layout: 'standard',
      showPageNumbers: true,
      showTimestamp: true,
      notes: ['All times are local.'],
    };
    const height = measureFooterHeight(config);
    expect(height).toBeGreaterThan(8);
  });

  it('renders standard footer on a doc', () => {
    const pageConfig = getDefaultPageConfig();
    const doc = createDoc(pageConfig, 32);
    const footerConfig: FooterConfig = {
      layout: 'standard',
      showPageNumbers: true,
      showTimestamp: true,
    };
    const height = renderFooter(doc, footerConfig, pageConfig, 1);
    expect(height).toBeGreaterThan(0);
  });

  it('returns 0 for none layout', () => {
    expect(measureFooterHeight({ layout: 'none' })).toEqual(0);
  });
});
