/**
 * Map a Partial<CompositionConfig> (resolved from the print-policy
 * pipeline) to the generator-specific `OrderOfPlayOptions` shape.
 *
 * Sensible defaults are applied where the composition is silent —
 * the dispatcher needs to produce a usable PDF even when the provider
 * has no policy and the tournament has no override.
 */

import type { CompositionConfig } from './editorTypes';
import type { OrderOfPlayOptions } from '../generators/orderOfPlay';

export function composeOrderOfPlayOptions(composition: Partial<CompositionConfig>): OrderOfPlayOptions {
  const header = composition.header
    ? {
        ...composition.header,
        layout: composition.header.layout ?? 'itf',
        tournamentName: composition.header.tournamentName ?? '',
      }
    : undefined;

  const footer = composition.footer
    ? { ...composition.footer, layout: composition.footer.layout ?? 'standard' }
    : undefined;

  const scheduleContent = composition.content?.schedule;

  return {
    header,
    footer,
    page: composition.page,
    cellStyle: scheduleContent?.cellStyle ?? 'detailed',
    showMatchNumbers: scheduleContent?.showMatchNumbers,
    alertBanner: scheduleContent?.alertBanner,
  };
}
