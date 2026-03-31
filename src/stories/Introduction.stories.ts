import type { Meta, StoryObj } from '@storybook/html';

function createIntro(): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText =
    'padding: 24px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 900px; line-height: 1.6;';
  container.innerHTML = `
    <h1 style="margin:0 0 8px">pdf-factory</h1>
    <p style="color:#666;margin:0 0 24px">PDF generation for tournament draws, schedules, and player lists.</p>

    <h2>Quick Start</h2>
    <pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;font-size:13px"><code>import { generateFromEventData } from 'pdf-factory';

// TMX integration — pass eventData from getEventData()
const { eventData } = tournamentEngine.getEventData({ drawId });
const pdf = generateFromEventData(eventData, {
  catalogPreset: 'wta-500',
});
pdf.save('draw.pdf');</code></pre>

    <h2>Data Pipeline</h2>
    <pre style="background:#f0f4ff;padding:12px;border-radius:4px;font-size:13px"><code>getEventData({ drawId })
  → eventData.drawsData[0].structures
    → structureToDrawData(structure)
      → generateTraditionalDrawPDF(drawData, options)</code></pre>

    <h2>Generators</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f5f5f5;text-align:left">
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Function</th>
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Draw Type</th>
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Notes</th>
      </tr></thead>
      <tbody>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateDrawPDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Auto-detect</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Smart routing</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateTraditionalDrawPDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Single elimination</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Standard bracket</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateSplitDrawPDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Large draws</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Multi-page + final rounds</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateFeedInDrawPDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Feed-in</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Auto-landscape for 5+ rounds</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateConsolationDrawPDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Consolation</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Multi-structure</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateDoubleEliminationPDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Double elimination</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Winners + losers + decider</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateCompassDrawPDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Compass</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Multi-direction brackets</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateLuckyDrawPDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Lucky draw</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Box pyramid layout</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateMirroredDrawPDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">NCAA/Collegiate</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Two halves inward, winner center</td></tr>
        <tr><td style="padding:4px 12px"><code>generateFromEventData()</code></td><td style="padding:4px 12px">Any</td><td style="padding:4px 12px">High-level TMX API</td></tr>
      </tbody>
    </table>

    <h2>Other Generators</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f5f5f5;text-align:left">
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Function</th>
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Output</th>
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Notes</th>
      </tr></thead>
      <tbody>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateSchedulePDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Order of Play</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Grid with courts as columns, centered cells, NB/time per match</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generatePlayerListPDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Player List</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Participant roster with entry status, events, nationality</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateCourtCardPDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Court Cards</td><td style="padding:4px 12px;border-bottom:1px solid #eee">One card per court — current match + up next</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateSignInSheetPDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Sign-In Sheet</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Participant sign-in table with signature column</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>generateMatchCardPDF()</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Match Cards</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Umpire scorecards with score boxes</td></tr>
        <tr><td style="padding:4px 12px"><code>generateSequentialOOP()</code></td><td style="padding:4px 12px">Sequential OOP</td><td style="padding:4px 12px">Court-by-court vertical schedule (WTA/Grand Slam style)</td></tr>
      </tbody>
    </table>

    <h3>Player List</h3>
    <pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;font-size:13px"><code>import { generatePlayerListPDF } from 'pdf-factory';
import { extractParticipantData } from 'pdf-factory';

const players = extractParticipantData({ participants, eventEntries });
const pdf = generatePlayerListPDF(players, {
  header: { tournamentName: 'Australian Open', startDate: '19 Jan' },
});
pdf.save('player-list.pdf');</code></pre>

    <h3>Court Cards</h3>
    <pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;font-size:13px"><code>import { generateCourtCardPDF } from 'pdf-factory';

const cards = [
  { courtName: 'Center Court', venueName: 'Main',
    currentMatch: { eventName: 'MS', roundName: 'SF',
      side1: { name: 'SINNER', nationality: 'ITA' },
      side2: { name: 'ALCARAZ', nationality: 'ESP' } },
    nextMatch: { eventName: 'WS', roundName: 'SF', scheduledTime: '3PM',
      side1: { name: 'SABALENKA', nationality: 'BLR' },
      side2: { name: 'GAUFF', nationality: 'USA' } }
  },
];
const pdf = generateCourtCardPDF(cards, { tournamentName: 'Open' });
pdf.save('court-cards.pdf');</code></pre>

    <h3>Order of Play</h3>
    <pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;font-size:13px"><code>import { generateSchedulePDF } from 'pdf-factory';

const pdf = generateSchedulePDF(scheduleData, {
  header: { layout: 'itf', tournamentName: 'J300 Tucson',
    subtitle: 'ORDER OF PLAY' },
  cellStyle: 'detailed',
  alertBanner: 'PLAY STARTS AT 11:00 AM',
});
pdf.save('order-of-play.pdf');</code></pre>

    <h2>Composition Catalog</h2>
    <p>Named presets bundle header, footer, and format configurations:</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f5f5f5;text-align:left">
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Preset</th>
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Header</th>
        <th style="padding:6px 12px;border-bottom:2px solid #ddd">Footer</th>
      </tr></thead>
      <tbody>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>grand-slam</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Centered uppercase, date/location</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Timestamp + page</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>wta-500</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Flanking logos, city/dates/surface</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Seedings + prizes + officials</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>itf-junior</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Left-aligned, grade/supervisor</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Officials sign-off</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>national-federation</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Metadata row</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Full sign-off + ceremony date</td></tr>
        <tr><td style="padding:4px 12px;border-bottom:1px solid #eee"><code>collegiate-ncaa</code></td><td style="padding:4px 12px;border-bottom:1px solid #eee">Grand Slam style</td><td style="padding:4px 12px;border-bottom:1px solid #eee">Standard</td></tr>
        <tr><td style="padding:4px 12px"><code>club-basic</code></td><td style="padding:4px 12px">Minimal single-line</td><td style="padding:4px 12px">Timestamp + page</td></tr>
      </tbody>
    </table>

    <h2>Header Layouts</h2>
    <p><code>grand-slam</code> · <code>itf</code> · <code>wta-tour</code> · <code>national-federation</code> · <code>minimal</code> · <code>none</code></p>

    <h2>Footer Layouts</h2>
    <p><code>standard</code> · <code>seedings-table</code> · <code>prize-money</code> · <code>officials-signoff</code> · <code>combined-tour</code> · <code>none</code></p>

    <h2>Entry Status Badges</h2>
    <p style="font-size:14px">
      <code>WILDCARD</code> → <strong>WC</strong> ·
      <code>QUALIFIER</code> → <strong>Q</strong> ·
      <code>LUCKY_LOSER</code> → <strong>LL</strong> ·
      <code>SPECIAL_EXEMPT</code> → <strong>SE</strong> ·
      <code>ALTERNATE</code> → <strong>ALT</strong> ·
      <code>PROTECTED_RANKING</code> → <strong>PR</strong> ·
      <code>DIRECT_ACCEPTANCE</code> → (none)
    </p>

    <h2>Key Features</h2>
    <ul style="font-size:14px">
      <li><strong>Feed rounds</strong> detected automatically — bracket connectors adapt</li>
      <li><strong>Scores</strong> inline in dense rounds, below name in spacious rounds</li>
      <li><strong>Advancing names</strong> bolded, abbreviated when too wide</li>
      <li><strong>Nationality</strong> in position gap between draw position and player line</li>
      <li><strong>256+ draws</strong> auto-split into quarters + 5-round final page</li>
      <li><strong>Headers/footers</strong> render on every page with correct page numbers</li>
    </ul>
  `;
  return container;
}

const meta: Meta = {
  title: 'Introduction',
  render: createIntro,
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {};
