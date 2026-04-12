import { existsSync } from 'fs';
import { resolve } from 'path';

export const FIXTURES_DIR = resolve(__dirname, '../../fixtures');
export const REFERENCE_DIR = resolve(FIXTURES_DIR, 'reference');

/**
 * True when the local fixtures/ directory exists.
 * Parser and fidelity tests depend on third-party PDFs that are
 * gitignored (too large / redistribution concerns). These tests
 * run locally but are skipped in CI where fixtures/ is absent.
 */
export const hasFixtures = existsSync(FIXTURES_DIR);
export const hasReferenceFixtures = existsSync(REFERENCE_DIR);
