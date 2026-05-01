/**
 * Print Policy explainer — a single-page tour of the composition
 * pipeline for callers who want to understand how
 * `resolveCompositionConfig`, `executePrint`, and the per-print-type
 * generators relate.
 *
 * Sibling to `Introduction.stories.ts` (which covers the per-generator
 * surface) and `PrintDispatcher.stories.ts` (which exercises the
 * pipeline interactively). This page is the conceptual map; the
 * other two are the implementation tour and live demo respectively.
 */
import type { Meta, StoryObj } from '@storybook/html';

function createExplainer(): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText =
    'padding: 24px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 920px; line-height: 1.55;';

  container.innerHTML = `
    <h1 style="margin:0 0 8px">Print Policy Pipeline</h1>
    <p style="color:#666;margin:0 0 24px">
      How printed-artifact composition is authored, persisted, and resolved
      end-to-end across the CourtHive stack.
    </p>

    <h2>Three-layer composition</h2>
    <p>
      A printed artifact's appearance is the deep-merge of three
      <code>Partial&lt;CompositionConfig&gt;</code> overlays — provider default,
      tournament override, runtime tweaks — applied in that order. Later
      layers win on per-field collisions. Unset fields fall through to
      <code>pdf-factory</code>'s hardcoded defaults at generation time.
    </p>

    <pre style="background:#f0f4ff;padding:12px;border-radius:4px;font-size:13px;line-height:1.4"><code>provider default      (admin-client → providerConfigSettings.policies.printPolicies[printType])
       │
       │ deep-merged onto by
       ▼
tournament override   (factory POLICY_TYPE_PRINT extension)
       │
       │ deep-merged onto by
       ▼
runtime tweaks        (modal-time edits the user just made)
       │
       │ resolveCompositionConfig produces:
       ▼
resolved CompositionConfig
       │
       │ passed to executePrint(request, { tournamentEngine })
       ▼
per-print-type generator
       │
       ▼
PDF blob</code></pre>

    <h2>Why three layers?</h2>
    <p>Each layer answers a different question:</p>
    <ul>
      <li>
        <strong>Provider default</strong> — "How does <em>this organization</em>
        format their draws?" A federation, club, or tour sets one composition
        per print type that applies to every tournament they run.
      </li>
      <li>
        <strong>Tournament override</strong> — "What does <em>this specific
        event</em> need to differ from the provider default?" Slam-specific
        sponsor logos, a custom alert banner for the qualifying weekend,
        a regional language label — narrow, deliberate departures.
      </li>
      <li>
        <strong>Runtime tweak</strong> — "What does the user want
        <em>just for this one print</em>?" Toggling "include scores" off
        for a media draft, switching to landscape because the printer
        is paper-jammed in portrait — transient, not persisted.
      </li>
    </ul>

    <h2>Entry points</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f5f5f5;text-align:left">
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Function</th>
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Purpose</th>
      </tr></thead>
      <tbody>
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #eee"><code>resolveCompositionConfig({ providerConfig, tournamentRecord, printType, runtime? })</code></td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee">Three-layer merge → resolved <code>Partial&lt;CompositionConfig&gt;</code></td>
        </tr>
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #eee"><code>executePrint(request, { tournamentEngine })</code></td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee">Validates request, fetches needed data from the engine, calls the matching generator, returns <code>PrintResult</code></td>
        </tr>
        <tr>
          <td style="padding:6px 12px"><code>PrintRequest</code> (discriminated union)</td>
          <td style="padding:6px 12px">Per-print-type request shape — see table below</td>
        </tr>
      </tbody>
    </table>

    <h2>Print types</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px">
      <thead><tr style="background:#f5f5f5;text-align:left">
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">type</th>
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Required fields</th>
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Engine APIs used</th>
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Generator</th>
      </tr></thead>
      <tbody>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>schedule</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>scheduledDate</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>competitionScheduleMatchUps</code> + <code>getVenuesAndCourts</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateOrderOfPlayPDF</code></td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>playerList</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">— (optional <code>eventId</code>)</td><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>getParticipants</code> + <code>getEvent</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generatePlayerListPDF</code></td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>signInSheet</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>eventId</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>getParticipants</code> + <code>getEvent</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateSignInSheetPDF</code></td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>courtCards</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">— (optional <code>scheduledDate</code>, <code>venueId</code>)</td><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>competitionScheduleMatchUps</code> + <code>getVenuesAndCourts</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateCourtCardPDF</code></td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>matchCard</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>matchUpIds[]</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>allTournamentMatchUps</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateMatchCardPDF</code></td></tr>
        <tr><td style="padding:4px 12px"><code>draw</code></td><td style="padding:4px 12px"><code>drawId</code></td><td style="padding:4px 12px"><code>getEventData</code></td><td style="padding:4px 12px">Auto-detect: <code>generateTraditionalDrawPDF</code> / <code>generateConsolationDrawPDF</code> / <code>generateDoubleEliminationPDF</code> (or split via <code>composition.content.draw.splitStrategy</code>)</td></tr>
      </tbody>
    </table>

    <h2>End-to-end example</h2>
    <pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;font-size:13px;line-height:1.4"><code>import { resolveCompositionConfig, executePrint } from 'pdf-factory';
import { tournamentEngine } from 'tods-competition-factory';

// 1. Resolve the composition for this print
const composition = resolveCompositionConfig({
  providerConfig: providerConfig.get(),     // delivered at login
  tournamentRecord: currentTournament,      // factory record with extensions
  printType: 'schedule',
  runtime: {                                // unsaved modal edits
    page: { orientation: 'landscape' },
    content: { schedule: { alertBanner: 'Centre Court closes at 23:00' } },
  },
});

// 2. Dispatch — engine queries + generator dispatch happen inside
const result = executePrint(
  { type: 'schedule', scheduledDate: '2026-06-29', composition },
  { tournamentEngine },
);

// 3. Use the result
if (result.success && result.blob) {
  window.open(URL.createObjectURL(result.blob));
}</code></pre>

    <h2>Where each piece lives</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px">
      <thead><tr style="background:#f5f5f5;text-align:left">
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Repo</th>
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Role</th>
      </tr></thead>
      <tbody>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee"><code>tods-competition-factory</code></td><td style="padding:6px 12px;border-bottom:1px solid #eee"><code>POLICY_TYPE_PRINT</code> constant + default fixture for the tournament-override layer</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee"><code>competition-factory-server</code></td><td style="padding:6px 12px;border-bottom:1px solid #eee"><code>providerConfigSettings.policies.printPolicies</code> — provider default storage. Treated as opaque blob</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee"><code>competition-factory-server/admin-client</code></td><td style="padding:6px 12px;border-bottom:1px solid #eee">Provider settings editor with the Print Configuration section that authors the provider default</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee"><code>courthive-components</code></td><td style="padding:6px 12px;border-bottom:1px solid #eee"><code>createPrintCompositionEditor</code> — the reusable editor element embedded above</td></tr>
        <tr><td style="padding:6px 12px;border-bottom:1px solid #eee"><code>pdf-factory</code></td><td style="padding:6px 12px;border-bottom:1px solid #eee">Resolver, dispatcher, generators, type definitions (this repo)</td></tr>
        <tr><td style="padding:6px 12px"><code>TMX</code></td><td style="padding:6px 12px">Print modals (consumer-only) — call resolver + dispatcher with modal-runtime tweaks as the third layer</td></tr>
      </tbody>
    </table>

    <h2>See also</h2>
    <ul>
      <li><strong>PDF / Print Dispatcher</strong> stories — interactive demo of the pipeline across all 6 print types.</li>
      <li><strong>PDF / Introduction</strong> — per-generator surface (the layer below the dispatcher).</li>
      <li><a href="https://courthive.github.io/competition-factory/docs/policies/printPolicy" target="_blank" rel="noopener">Print Policy</a> in the factory documentation.</li>
      <li><code>Mentat/planning/PRINT_COMPOSITION_POLICY_PLAN.md</code> — architectural rationale.</li>
    </ul>
  `;

  return container;
}

const meta: Meta = {
  title: 'PDF/Print Policy',
  render: createExplainer,
  parameters: { layout: 'fullscreen' },
};

export default meta;

export const Overview: StoryObj = {};
