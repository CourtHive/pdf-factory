# Header & Footer Catalog from Reference PDFs

## Three Footer Tiers

### Tier 1: Minimal (Grand Slam draws)

- Timestamp ("Last updated" / "Report Created")
- Page number ("Page 1 - 2")
- Champion callout in bracket area
- **Used by**: Wimbledon, US Open, Roland Garros

### Tier 2: Medium (Tour-level draws)

- WTA Supervisor name + "RELEASED" date/time
- Seeded players table (two-column: player/rank)
- Prize money per round (with ranking points)
- Withdrawals with reasons
- Lucky Losers/Alternates
- **Used by**: WTA 500/1000, ATP 250/500, protennislive

### Tier 3: Full (National federation / ATP Finals)

- Official sign-off table with signature lines
- Tournament Director, Supervisor, Referee (named)
- Draw ceremony date/time
- Player representatives
- Chief Umpire signature line
- Seedings table + Lucky Losers table
- Tournament ID / Grade / Organizer metadata
- **Used by**: Croatian/Serbian federation, ATP Finals, ITF Junior

## Header Patterns

### Grand Slam

- Tournament crest/wordmark (left or flanking)
- Tournament name large, colored
- Event name below or to the right
- No dates/prize money in header
- Sponsor logo (e.g., IBM) top-right

### WTA/ATP Tour

- Tour logo (left) + Tournament logo (right) — flanking
- Tournament name centered, bold
- City, Country centered below
- Dates | Prize Money | Surface centered third line
- "SINGLES MAIN DRAW" or "TOP HALF" label right-aligned

### ITF Junior

- "ITF World Tennis Tour" left
- Tournament name bold left
- "ORDER OF PLAY" centered
- Metadata row: Week / City / Grade / Tournament Key / Supervisor

### National Federation

- Federation logo right
- Tournament name left
- Metadata row: Date / Organizer / City / Tournament ID / Grade / Chief Umpire
- Column headers for player data: Ranking / Seed / Name / Club

## OOP Footer Patterns

- Operational disclaimers ("Matches may be moved")
- Sign-in deadlines (Lucky Loser, Doubles)
- Officials table with names/roles
- No seedings or prize money

## Score Notation Variants

- Standard hyphenated: 6-4 7-6(3) — Grand Slams, WTA, ITF
- Superscript tiebreak: 76^5 — protennislive/ATP
- Comma separated: 60, 60 — Croatian/Serbian federation

## Layout Variants Needed

- **Mirrored bracket**: Two 16-halves progressing inward, winner in center (collegiate)
- **Portrait 32-draw**: LTA style, full draw on portrait page
- **Split halves**: Top Half / Bottom Half on separate pages (WTA 1000 for 128)
- **RR + Knockout**: Group tables + bracket on same page (ATP Finals)
- **Team format**: Team images, INTENNSE layout with team branding
