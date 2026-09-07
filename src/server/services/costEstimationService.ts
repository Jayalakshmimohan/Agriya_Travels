/**
 * Deterministic cost calculation.
 *
 * This module is a pure function: no database, no network, no LLM. Gemini is
 * given the finished numbers and may only explain them. A model that invents a
 * fare for a pilgrim on a Rs.2,000 budget produces a complaint, not a bug
 * report, so the arithmetic lives here where it can be tested.
 *
 * All internal maths is in integer paise. Postgres returns NUMERIC as a string
 * precisely to avoid float drift, and parsing those into JS floats and adding
 * them would throw that away.
 */

export type ConfidenceLevel = 'CONFIRMED' | 'INDICATIVE' | 'ILLUSTRATIVE';

export type CostLineType =
  | 'transport' | 'accommodation' | 'food' | 'darshan'
  | 'activity' | 'transfer' | 'guide'
  | 'service_fee' | 'tax' | 'discount';

export interface CostInput {
  type: CostLineType;
  label: string;
  /** Rupees. Accepts the string Postgres returns for NUMERIC. */
  unitPrice: string | number;
  quantity: number;
  unit: string;
  dataSource?: string;
  confidence?: ConfidenceLevel;
  detail?: string;
}

export interface CostLine {
  type: CostLineType;
  label: string;
  detail?: string;
  unitPriceInr: number;
  quantity: number;
  unit: string;
  amountInr: number;
  dataSource: string;
  confidence: ConfidenceLevel;
}

export interface FeeRule {
  kind: 'service_fee' | 'tax' | 'discount' | 'surcharge';
  label: string;
  amountInr?: string | number | null;
  percent?: string | number | null;
}

export interface CostBreakdown {
  currency: 'INR';
  lines: CostLine[];
  subtotalInr: number;
  serviceFeesInr: number;
  taxesInr: number;
  discountsInr: number;
  totalInr: number;
  /** Weakest confidence among all contributing lines. */
  confidence: ConfidenceLevel;
  /** True when every component is real; drives the disclosure wording. */
  allComponentsReal: boolean;
}

// ---------------------------------------------------------------------------
// Money helpers — integer paise throughout
// ---------------------------------------------------------------------------

/** '690.00' | 690 -> 69000 paise. Throws rather than silently yielding NaN. */
export function toPaise(value: string | number): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`Invalid amount: ${value}`);
    return Math.round(value * 100);
  }
  const trimmed = value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid monetary value: "${value}"`);
  }
  return Math.round(Number(trimmed) * 100);
}

const toRupees = (paise: number): number => Math.round(paise) / 100;

const CONFIDENCE_ORDER: ConfidenceLevel[] = ['ILLUSTRATIVE', 'INDICATIVE', 'CONFIRMED'];

/** The weakest link wins: one synthetic component makes the whole quote illustrative. */
export function weakestConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  if (levels.length === 0) return 'ILLUSTRATIVE';
  return levels.reduce((weakest, level) =>
    CONFIDENCE_ORDER.indexOf(level) < CONFIDENCE_ORDER.indexOf(weakest) ? level : weakest
  );
}

const REAL_SOURCES = new Set(['REAL_VERIFIED', 'REAL_PUBLIC', 'EXTERNAL_PROVIDER', 'CLIENT_PROVIDED']);

// ---------------------------------------------------------------------------
// The calculation
// ---------------------------------------------------------------------------

export function calculateCost(inputs: CostInput[], fees: FeeRule[] = []): CostBreakdown {
  const lines: CostLine[] = [];
  let subtotalPaise = 0;

  for (const input of inputs) {
    if (input.quantity <= 0) continue;

    const unitPaise = toPaise(input.unitPrice);
    // Quantity can be fractional (e.g. 1.5 rooms is meaningless, but 0.5 days
    // of a guide is not), so round only at the line total.
    const amountPaise = Math.round(unitPaise * input.quantity);

    lines.push({
      type: input.type,
      label: input.label,
      detail: input.detail,
      unitPriceInr: toRupees(unitPaise),
      quantity: input.quantity,
      unit: input.unit,
      amountInr: toRupees(amountPaise),
      dataSource: input.dataSource ?? 'SYNTHETIC',
      confidence: input.confidence ?? 'ILLUSTRATIVE',
    });

    subtotalPaise += amountPaise;
  }

  // Fees apply to the subtotal, in declared order: absolute amounts and
  // discounts first, then percentages on the running total. Applying a
  // percentage tax before a discount would overcharge.
  let serviceFeesPaise = 0;
  let discountsPaise = 0;
  let taxesPaise = 0;

  for (const fee of fees.filter((f) => f.kind !== 'tax')) {
    const base = subtotalPaise;
    const paise = fee.amountInr != null
      ? toPaise(fee.amountInr)
      : Math.round((base * Number(fee.percent ?? 0)) / 100);

    if (fee.kind === 'discount') {
      discountsPaise += paise;
      lines.push({
        type: 'discount', label: fee.label,
        unitPriceInr: toRupees(paise), quantity: 1, unit: 'per_trip',
        amountInr: -toRupees(paise),
        dataSource: 'CLIENT_PROVIDED', confidence: 'CONFIRMED',
      });
    } else {
      serviceFeesPaise += paise;
      lines.push({
        type: 'service_fee', label: fee.label,
        unitPriceInr: toRupees(paise), quantity: 1, unit: 'per_trip',
        amountInr: toRupees(paise),
        dataSource: 'CLIENT_PROVIDED', confidence: 'CONFIRMED',
      });
    }
  }

  const taxableBase = subtotalPaise + serviceFeesPaise - discountsPaise;

  for (const fee of fees.filter((f) => f.kind === 'tax')) {
    const paise = fee.amountInr != null
      ? toPaise(fee.amountInr)
      : Math.round((taxableBase * Number(fee.percent ?? 0)) / 100);
    taxesPaise += paise;
    lines.push({
      type: 'tax', label: fee.label,
      unitPriceInr: toRupees(paise), quantity: 1, unit: 'per_trip',
      amountInr: toRupees(paise),
      dataSource: 'CLIENT_PROVIDED', confidence: 'CONFIRMED',
    });
  }

  const totalPaise = taxableBase + taxesPaise;

  // Fees and taxes are always certain; they must not drag the quote's
  // confidence up. Only the travel components decide it.
  const componentLines = lines.filter(
    (l) => l.type !== 'tax' && l.type !== 'service_fee' && l.type !== 'discount'
  );

  return {
    currency: 'INR',
    lines,
    subtotalInr: toRupees(subtotalPaise),
    serviceFeesInr: toRupees(serviceFeesPaise),
    taxesInr: toRupees(taxesPaise),
    discountsInr: toRupees(discountsPaise),
    totalInr: toRupees(totalPaise),
    confidence: weakestConfidence(componentLines.map((l) => l.confidence)),
    allComponentsReal: componentLines.every((l) => REAL_SOURCES.has(l.dataSource)),
  };
}

// ---------------------------------------------------------------------------
// Disclosure — attached in code, never left to the prompt
// ---------------------------------------------------------------------------

const DISCLOSURES: Record<ConfidenceLevel, string> = {
  ILLUSTRATIVE:
    'These options come from our demonstration travel dataset. Seat, room and darshan availability shown here is not live and is not a reservation. Our team will confirm real availability with you before anything is booked.',
  INDICATIVE:
    'Schedules and published fares are accurate, but live seat and room availability has not been confirmed yet. Our team will verify before booking.',
  CONFIRMED:
    'Availability and pricing confirmed with the provider.',
};

export function disclosureFor(confidence: ConfidenceLevel): string {
  return DISCLOSURES[confidence];
}

/**
 * Words that must not appear unless availability is genuinely CONFIRMED.
 * Prompt instructions are guidance, not a safety mechanism — this is checked
 * against generated prose before it reaches the user.
 */
const BOOKING_CLAIM_PATTERN =
  /\b(confirmed|booked|reserved|guaranteed|secured|ticketed)\b/i;

export function violatesBookingClaim(text: string, confidence: ConfidenceLevel): boolean {
  if (confidence === 'CONFIRMED') return false;
  return BOOKING_CLAIM_PATTERN.test(text);
}
