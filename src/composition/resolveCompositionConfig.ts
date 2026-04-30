/**
 * Resolve the effective CompositionConfig for a given print type.
 *
 * Three-layer composition (provider default → tournament override → runtime):
 *
 *   1. Provider default — read from `providerConfigSettings.policies.printPolicies[printType]`
 *      delivered to the client at login. Owned by the provider admin
 *      via admin-client.
 *   2. Tournament override — read from the tournament record's extension
 *      attached under the `POLICY_TYPE_PRINT = 'print'` attribute. Owned
 *      per-tournament (typically also via admin-client, with TMX as
 *      consumer-only).
 *   3. Runtime tweaks — modal-time options the user has just edited but
 *      not persisted (e.g., "include scores" toggled off for this one
 *      print only).
 *
 * Each layer is a `Partial<CompositionConfig>`; later layers deep-merge
 * over earlier ones. The returned config is a fresh object — callers
 * may mutate it freely.
 *
 * See Mentat/planning/PRINT_COMPOSITION_POLICY_PLAN.md for the
 * end-to-end architecture.
 */

import type { CompositionConfig } from './editorTypes';
import type { PrintRequest } from './printModalTypes';

export type PrintType = PrintRequest['type'];

const POLICY_TYPE_PRINT = 'print';

interface ProviderConfigShape {
  providerConfigSettings?: {
    policies?: {
      printPolicies?: Partial<Record<PrintType, Partial<CompositionConfig>>>;
    };
  };
}

interface TournamentRecordShape {
  extensions?: { name: string; value: any }[];
}

export interface ResolveCompositionConfigParams {
  /**
   * Provider config object as delivered to the client at login. The
   * resolver reads `providerConfigSettings.policies.printPolicies[printType]`.
   * Pass `undefined` if no provider context is available — in that case
   * resolution starts from the tournament override (or the runtime layer,
   * or the empty config).
   */
  providerConfig?: ProviderConfigShape;
  /**
   * The tournament record (as held by tournamentEngine). The resolver
   * inspects `extensions` for an entry where `name === POLICY_TYPE_PRINT`
   * and reads `extension.value[printType]`.
   */
  tournamentRecord?: TournamentRecordShape;
  /**
   * Which print type's config to resolve.
   */
  printType: PrintType;
  /**
   * Optional runtime tweaks — applied last, on top of everything else.
   * Use for unsaved modal edits.
   */
  runtime?: Partial<CompositionConfig>;
}

export function resolveCompositionConfig(params: ResolveCompositionConfigParams): Partial<CompositionConfig> {
  const { providerConfig, tournamentRecord, printType, runtime } = params;

  const providerDefault = providerConfig?.providerConfigSettings?.policies?.printPolicies?.[printType] ?? {};

  const printExtension = tournamentRecord?.extensions?.find((e) => e.name === POLICY_TYPE_PRINT);
  const tournamentOverride = (printExtension?.value?.[printType] ?? {}) as Partial<CompositionConfig>;

  return deepMerge(deepMerge(providerDefault, tournamentOverride), runtime ?? {});
}

/**
 * Recursive merge for plain objects. Arrays and primitives are replaced
 * (not concatenated / not deep-merged element-wise) — the natural
 * expectation for config overrides.
 */
function deepMerge<T extends Record<string, any>>(base: T, overlay: Partial<T>): T {
  const result: Record<string, any> = { ...base };
  for (const key of Object.keys(overlay) as (keyof T)[]) {
    const overlayValue = overlay[key];
    if (overlayValue === undefined) continue;
    const baseValue = result[key as string];
    if (isPlainObject(baseValue) && isPlainObject(overlayValue)) {
      result[key as string] = deepMerge(baseValue, overlayValue as Record<string, any>);
    } else {
      result[key as string] = overlayValue;
    }
  }
  return result as T;
}

function isPlainObject(v: unknown): v is Record<string, any> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
}
