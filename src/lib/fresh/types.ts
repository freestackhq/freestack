/**
 * Shapes for the fresh shelf-label UI.
 *
 * `Tool` mirrors schema/tool.schema.json. Fields marked "UI-only" are curated
 * in data/ but only the UI reads them; fields marked "Generated" are set by
 * scripts/generate.mjs from data/state/*.yaml, data/imported/*.yaml or the
 * aisle's numbers.
 */

export type Who = "anyone" | "student_any_id" | "student_school_email" | "startup_proof";
export type YesNoUnknown = "yes" | "no" | "unknown";
export type Source = "catalog" | "submitted" | "imported";
export type AisleGroup = "Build" | "AI" | "Free and Open Data" | "Claim Once";
export type SituationId = "school" | "student" | "indie" | "startup";

export interface Aisle {
  id: string;
  group: AisleGroup;
  name: string;
  /** Headline metric key, e.g. storage_gb. */
  metric: string;
  /** Unit shown after the number, e.g. "GB" or "a day". */
  unit: string;
  /** What the metric measures, e.g. "free storage". */
  label: string;
  /** Singular noun for counts ("8 free databases"). UI-only. */
  noun?: string;
  /** Filter chips for the aisle page, matched against Tool.type. UI-only. */
  types?: { id: string; label: string }[];
  /** Where related tools live instead. UI-only. */
  seeAlso?: { text: string; aisle: string; name: string };
  /** Lede for Claim Once pages. UI-only. */
  intro?: string;
  /** Biggest known headline value among labeled tools. Generated. */
  max?: number;
}

export interface SkipIf {
  reason: string;
  /** Tool id to use instead. */
  use?: string;
}

export interface Tool {
  id: string;
  name: string;
  kind: string;
  url: string;
  aisle: string;
  /** Value in the aisle's headline unit. null means not listed. */
  metric: number | null;
  /** Required when metric is null or qualified ("no limit", "per database"). */
  metric_note?: string;
  limits: string[];
  who: Who[];
  region: string | null;
  sell: YesNoUnknown;
  card: YesNoUnknown;
  catches: string[];
  use_if: string[];
  skip_if: SkipIf[];
  pricing_url: string;
  /** ISO date (YYYY-MM-DD) or null. */
  verified_at: string | null;
  verified_by: string | null;
  source: Source;

  /** One-line summary for the tool page. UI-only. */
  tagline?: string;
  /** Longer catch sentences for the tool page. UI-only. */
  catch_detail?: string[];
  /** Filter chip id inside the aisle (matches Aisle.types). UI-only. */
  type?: string;
  /** Situations this tool fits. UI-only. */
  fits?: SituationId[];
  /** Curator pick. Only shown when the label is checked. UI-only. */
  suggested?: boolean;
  /** Set by the trust loop when someone marked a line "Changed". UI-only. */
  review_pending?: boolean;
  /** Set by the weekly pricing-page scan (ISO date). UI-only. */
  vendor_changed_at?: string | null;
  /** Awesome list it came from, for imported entries. UI-only. */
  imported_from?: string;

  /** Longer plain description. */
  about?: string;
  tags?: string[];
  /** free forever, signup credit, free while a student, or a discount. */
  cost?: "free" | "credits" | "student" | "discount";
  /** Facts for API entries, as the vendor states them. */
  api?: {
    base_url?: string;
    docs?: string;
    auth?: string;
    cors?: YesNoUnknown;
    response?: string;
    openapi?: YesNoUnknown;
    models?: string;
    openai_compatible?: YesNoUnknown;
    streaming?: YesNoUnknown;
    self_host?: string;
    status?: string;
  };
  /** GitHub issue number of the open "Changed" report. Generated. */
  review_issue?: number | null;
  /** When that report was opened (ISO date). Generated. */
  review_opened?: string | null;
  /** Id of the awesome list an imported entry came from. Generated. */
  imported_list?: string;
  /** 5-step scale against the aisle's biggest value. Generated. */
  scale?:
    | { kind: "step"; step: 1 | 2 | 3 | 4 | 5; word: string }
    | { kind: "unknown"; word: "Not listed" }
    | { kind: "unlimited"; word: string };

  /** Claim Once programs only. UI-only. */
  program?: {
    order: number;
    /** Big number, e.g. "2 yrs" or "Enrolled". */
    lasts_big: string;
    /** Line under it, e.g. "then verify again". */
    lasts_sub: string;
    perks: string[];
    needs: string;
    lasts: string;
    claim_url: string;
  };
}

export interface Situation {
  id: SituationId;
  label: string;
}

export interface PresetRow {
  /** Job in the stack, e.g. "Hosting", "Database". */
  job: string;
  tool: string;
}

export interface Catch {
  slug: string;
  aisle: string;
  tool: string;
  question: string;
  answer: string;
  detail: string;
  includes: string[];
  still_fine: string;
  source_name: string;
  source_url: string;
  checked_at: string | null;
  /** Tool ids that avoid the catch. */
  avoid_with: string[];
  /** Plan name for "Already on Hobby?". Falls back to the tool name. UI-only. */
  plan?: string;
  /** Who to ask "when in doubt". Falls back to the tool name. UI-only. */
  vendor?: string;
  /** Heading over the avoid_with labels ("Free hosts that let you sell"). UI-only. */
  avoid_heading?: string;
}

export type LabelState =
  | "checked"
  | "unchecked"
  | "overdue"
  | "review"
  | "vendor-changed"
  | "imported";

/** A job in a stack (Build a stack rows, Home preset rows). UI-only. */
export interface Part {
  /** URL key: /build?hosting=cf-workers */
  key: string;
  /** Shown name; matches PresetRow.job ("Sign-in"). */
  label: string;
  /** Aisle its tools come from. */
  aisle: string;
  /** Only tools of these kinds, when one aisle holds more than one job. */
  kinds?: string[];
  /** Always shown in Build a stack, even when empty. */
  core?: boolean;
}
