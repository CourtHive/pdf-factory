/**
 * Resolve the effective CompositionConfig for a given print type.
 *
 * Layers, each deep-merged over the ones before it (CA 2026-10-21: the full policy hierarchy, deep-merged):
 *
 *   1. Provider default — `providerConfigSettings.policies.printPolicies[printType]`, delivered to the client at
 *      login and owned by the provider admin.
 *   2. Tournament — the tournament record's own print policy, `appliedPolicies.print[printType]`.
 *   3. Event — the event's own print policy, for a print that belongs to an event (a draw, a sign-in sheet, a
 *      player list).
 *   4. Draw — the drawDefinition's own print policy, for a print that belongs to a draw.
 *   5. Runtime tweaks — modal-time options the user has just edited but not persisted (e.g., "include scores"
 *      toggled off for this one print only).
 *
 * Layers 2–4 are where the factory's `attachPolicies({ policyDefinitions: { print: { ... } } })` stores a print
 * policy: the `appliedPolicies` extension of the element it was attached to. Until 2026-10-21 the resolver read an
 * extension NAMED `print`, which nothing writes, so no attached print policy ever reached a print.
 *
 * Unlike the factory's `getAppliedPolicies`, where an inner element's policy of a type replaces the outer one
 * whole, print layers deep-merge: a draw that sets only its header keeps the tournament's footer and page settings.
 * Arrays and primitives are replaced. The returned config is a fresh object — callers may mutate it freely.
 *
 * See Mentat/archive/planning/PRINT_COMPOSITION_POLICY_PLAN.md for the end-to-end architecture.
 */

import type { CompositionConfig } from './editorTypes';
import type { PrintRequest } from './printModalTypes';

export type PrintType = PrintRequest['type'];

const APPLIED_POLICIES = 'appliedPolicies';
const POLICY_TYPE_PRINT = 'print';

interface ProviderConfigShape {
  providerConfigSettings?: {
    policies?: {
      printPolicies?: Partial<Record<PrintType, Partial<CompositionConfig>>>;
    };
  };
}

/** A tournament record, event or drawDefinition: anything that can hold the factory's `appliedPolicies` extension. */
interface PolicyElementShape {
  extensions?: { name: string; value: any }[];
}

export interface ResolveCompositionConfigParams {
  /**
   * Provider config object as delivered to the client at login. The
   * resolver reads `providerConfigSettings.policies.printPolicies[printType]`.
   * Pass `undefined` if no provider context is available.
   */
  providerConfig?: ProviderConfigShape;
  /**
   * The full tournament record (as held by tournamentEngine), not `getTournamentInfo()` output, which has no
   * `extensions`. The resolver reads its own `appliedPolicies.print[printType]`.
   */
  tournamentRecord?: PolicyElementShape;
  /** The event the print belongs to, if any. Its own `appliedPolicies.print[printType]` overlays the tournament's. */
  event?: PolicyElementShape;
  /** The drawDefinition the print belongs to, if any. Its own print policy overlays the event's. */
  drawDefinition?: PolicyElementShape;
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
  const { providerConfig, tournamentRecord, event, drawDefinition, printType, runtime } = params;

  const layers: Partial<CompositionConfig>[] = [
    providerConfig?.providerConfigSettings?.policies?.printPolicies?.[printType] ?? {},
    elementPrintPolicy(tournamentRecord, printType),
    elementPrintPolicy(event, printType),
    elementPrintPolicy(drawDefinition, printType),
    runtime ?? {},
  ];

  return layers.reduce<Partial<CompositionConfig>>((resolved, layer) => deepMerge(resolved, layer), {});
}

/** The element's OWN print policy for the print type: not inherited from the element above it. */
function elementPrintPolicy(element: PolicyElementShape | undefined, printType: PrintType): Partial<CompositionConfig> {
  const appliedPolicies = element?.extensions?.find((extension) => extension?.name === APPLIED_POLICIES)?.value;
  return appliedPolicies?.[POLICY_TYPE_PRINT]?.[printType] ?? {};
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
