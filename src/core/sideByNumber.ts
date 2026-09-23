/**
 * A side by its OWN `sideNumber`, falling back to array order only when no side names one.
 *
 * Array position is not `sideNumber` — the mistake `DRAWPOSITIONS_CONSUMER_REMEDIATION_PLAN.md`
 * exists to remove. Hydrated matchUps (everything `competitionScheduleMatchUps` returns) carry it,
 * so the lookup is exact there. This module is also exported publicly and may be handed sparser
 * input, and these are DISPLAY paths — schedule rows and court cards, where no drawPosition is
 * derived — so order remains an acceptable last resort rather than a silent guess at a position.
 */
export function sideByNumber(sides: any[], sideNumber: number): any {
  return sides.find((side: any) => side?.sideNumber === sideNumber) ?? sides[sideNumber - 1];
}
