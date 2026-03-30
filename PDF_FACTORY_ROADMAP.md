# PDF Factory Roadmap

Three areas of work needed to bring pdf-factory to production quality.

---

## 1. Missing Storybook Stories

**Problem**: 7 renderers exist, 72 reference PDFs, but only 7 stories — and several renderers have zero story coverage.

### Stories needed for existing renderers

**Compass Draw** (`compassDraw.ts`) — NO stories exist

- 8-draw compass (reference: `usta_8_compass.pdf`, `lta_8_compass.pdf`)
- 16-draw compass (reference: `lta_16_compass.pdf`)
- Multiple presets (ITF, LTA, USTA)

**Consolation Draw** (`consolationDraw.ts`) — NO stories exist

- 32-draw consolation (reference: `lta_32_consolation.pdf`)
- Various draw sizes with consolation brackets

**Double Elimination** (`doubleEliminationDraw.ts`) — NO stories exist

- 8-team portrait (reference: `double_elim_8_team_portrait.pdf`)
- 8-team landscape (reference: `double_elim_8_team.pdf`)
- 16-team portrait (reference: `double_elim_16_team_portrait.pdf`)
- 16-team landscape (reference: `double_elim_16_team.pdf`)
- Henderson County format (reference: `double_elim_henderson_county.pdf`)
- SportNgin format (reference: `double_elim_16_sportngin.pdf`)

**Lucky Draw** (`luckyDraw.ts`) — NO stories exist

- Various draw sizes
- With/without completed matchUps

**Traditional Draw** — exists but needs more variants

- ATP format draws (reference: `atp_draw1.pdf`, `atp_draw2.pdf`)
- WTA format draws (reference: `wta_brisbane_ws.pdf`, `wta_doha_ws.pdf`, `wta_dubai_ws.pdf`, `wta_hongkong_ws.pdf`, `wta_madrid_ws.pdf`, `wta_rome_ws.pdf`)
- Grand Slam formats:
  - Wimbledon MS/GS (reference: `wimbledon_ms.pdf`, `wimbledon_gs.pdf`)
  - US Open MS/XD (reference: `usopen_ms.pdf`, `usopen_xd.pdf`)
  - Australian Open (reference: `ao_ws.pdf`)
  - Roland Garros (reference: `rg_ws.pdf`)
- Protennislive format (reference: `protennislive_draw1.pdf`, `protennislive_draw2.pdf`)
- Serbian format (reference: `serbian_draw.pdf`)

**Schedule/OOP** — ScheduleV2 exists but needs more coverage

- WTA OOP formats (20+ reference PDFs: `wta_*_oop.pdf`)
- Wimbledon OOP formats (10+ reference PDFs: `wimbledon_oop_*.pdf`)
- US Open OOP (reference: `usopen_oop_day*.pdf`)
- ITF J300 OOP (reference: `j300_oop.pdf`)

### Each story should have

- Download PDF button (existing pattern)
- Preview in New Tab button (green, existing pattern)
- Storybook controls for draw size, preset, orientation, options

---

## 2. Fidelity Comparison Section in Storybook

**Problem**: Fidelity tests exist as automated pixel comparisons, but there's no way to visually inspect reference vs. generated PDFs side-by-side in Storybook.

### What's needed

**New story group: `PDF/Fidelity`**

For each reference PDF that has a corresponding generator:

- Left panel: rendered image of the original reference PDF (using pdf-to-img or pre-rendered PNG snapshots)
- Right panel: our generated PDF rendered as an image
- Below: fidelity score, pixel diff overlay toggle
- Controls: zoom, page selection (for multi-page PDFs)

### Implementation approach

- Pre-render reference PDFs to PNG at build time (or commit PNGs alongside PDFs)
- Generate our PDF in the story, render to canvas via pdf.js or to PNG via pdf-to-img
- Use the existing `visualCompare.ts` pixelmatch logic to show diff overlay
- Group by format: Grand Slam Draws, ATP/WTA Draws, OOP, Compass, etc.

### Reference-to-generator mapping needed

| Reference PDF         | Generator             | Preset            | Notes           |
| --------------------- | --------------------- | ----------------- | --------------- |
| `wimbledon_ms.pdf`    | traditionalDraw       | wimbledon         | 128 draw        |
| `usopen_ms.pdf`       | traditionalDraw       | usOpen            | 128 draw        |
| `ao_ws.pdf`           | traditionalDraw       | australianOpen    | Women's singles |
| `rg_ws.pdf`           | traditionalDraw       | rolandGarros      | Women's singles |
| `wta_*_ws.pdf`        | traditionalDraw       | (need WTA preset) | Various sizes   |
| `atp_draw*.pdf`       | traditionalDraw       | (need ATP preset) | Various sizes   |
| `lta_8_compass.pdf`   | compassDraw           | (need LTA preset) | 8-draw compass  |
| `usta_8_compass.pdf`  | compassDraw           | usta              | 8-draw compass  |
| `double_elim_*.pdf`   | doubleEliminationDraw | —                 | Various formats |
| `wimbledon_oop_*.pdf` | scheduleV2            | wimbledon         | OOP pages       |
| `wta_*_oop.pdf`       | scheduleV2            | (need WTA preset) | OOP pages       |
| `usopen_oop_*.pdf`    | scheduleV2            | usOpen            | OOP pages       |

### Missing presets

- **ATP draw preset** — currently no ATP-specific format
- **WTA draw preset** — currently no WTA-specific format
- **WTA OOP preset** — sequential time-slot format
- **LTA compass preset** — for compass draw rendering

---

## 3. Schedule Cell Configuration + Header/Footer Design Components

**Problem**: OOP/schedule cells are left-justified instead of centered, cell content is not configurable by providers, and there are no header/footer design components.

### 3a. Schedule cell rendering fixes

- Center-align text within each cell (participant names, event abbreviation, round)
- Proper vertical centering within cell height
- Consistent padding/margins

### 3b. Configurable cell content

Providers need to select what information appears in each schedule grid cell. Options should include:

- Participant names (full / abbreviated / last name only)
- Match number
- Event name / abbreviation
- Round name
- Nationality flags/codes
- Seedings
- Scheduled time
- Match format code
- Score (for completed matchUps)

**Storybook UI**: A "Cell Configuration" story with:

- Checkbox controls for each field
- Live preview of cells with different configurations
- Preset buttons (compact, detailed, broadcast, minimal)

### 3c. Header design component

Visual editor / Storybook stories for configuring PDF headers:

- **Layout options**: ITF standard, minimal, branded (with logo), Grand Slam
- **Fields**: tournament name, subtitle (event name/round), dates, venue, logo URL, sanctioning body logo
- **Typography**: font sizes, weights, alignment
- **Storybook stories**: preview each layout variant, controls for all fields

### 3d. Footer design component

Visual editor / Storybook stories for configuring PDF footers:

- **Layout options**: standard (page numbers), minimal, branded
- **Fields**: page number format ("Page X of Y" vs just "X"), timestamp, disclaimer text, organization name
- **Storybook stories**: preview each layout variant, controls for all fields

### 3e. Composition editor (future)

Full visual editor that combines header + footer + cell config + format preset into a saved `CompositionConfig`. The types for this already exist in `src/composition/editorTypes.ts` and `src/composition/printModalTypes.ts`. The editor would be a courthive-component that TMX and the admin app both use.

---

## Priority Order

1. **Stories for missing renderers** (compass, consolation, double elimination, lucky draw) — validates that renderers work at all
2. **Schedule cell centering** — quick fix, high visual impact
3. **More traditional draw stories** with format-specific presets (ATP, WTA, Grand Slam variants)
4. **Fidelity comparison section** — requires pre-rendered reference PNGs, significant infrastructure
5. **Cell configuration UI** — provider-facing feature
6. **Header/footer design components** — provider-facing feature
7. **Full composition editor** — integrates everything into a single config UI
