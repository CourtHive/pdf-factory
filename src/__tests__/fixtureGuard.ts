import { existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

export const FIXTURES_DIR = resolve(__dirname, '../../fixtures');
export const REFERENCE_DIR = resolve(FIXTURES_DIR, 'reference');

/**
 * Parser and fidelity tests depend on third-party PDFs that are gitignored (too large /
 * redistribution concerns). They run locally and are skipped in CI, where fixtures/ is absent.
 *
 * There are THREE distinct conditions, because a fixtures directory is very often only PARTLY
 * populated — `download-draws.sh` can fail halfway, or someone drops in a single file by hand. Each
 * guard has to match what the test actually reads, or the test runs against something that is not
 * there and fails where it should have skipped:
 *
 *   hasFixtures          fixtures/            — the directory exists at all
 *   hasReferenceFixtures fixtures/reference/  — exists AND holds at least one PDF
 *   hasTodsFixture       fixtures/J300.tods   — a single FILE, which no directory check covers
 *
 * `hasReferenceFixtures` counts PDFs rather than testing the directory, because an EMPTY
 * `reference/` is exactly what a half-finished download leaves behind, and `existsSync` says yes to
 * it. Measured: the directory check alone still left two suites failing in that state.
 *
 * This is a floor, not a proof. A `reference/` holding *some* PDF but not the specific one a given
 * test names will still fail that test; several specs guard their own file with `existsSync` for
 * that reason. Guarding every filename here would move the fixture manifest away from the tests
 * that own it.
 */
const referencePdfCount = existsSync(REFERENCE_DIR)
  ? readdirSync(REFERENCE_DIR).filter((entry) => entry.toLowerCase().endsWith('.pdf')).length
  : 0;

export const hasFixtures = existsSync(FIXTURES_DIR);
export const hasReferenceFixtures = referencePdfCount > 0;
export const hasTodsFixture = existsSync(resolve(FIXTURES_DIR, 'J300.tods'));
