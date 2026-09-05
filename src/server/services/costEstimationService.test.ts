import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCost, toPaise, weakestConfidence, disclosureFor,
  violatesBookingClaim, type FeeRule, type CostInput,
} from './costEstimationService';

const FEES: FeeRule[] = [
  { kind: 'service_fee', label: 'Agriya service fee', amountInr: 100 },
  { kind: 'tax', label: 'GST (5%)', percent: 5 },
];

test('toPaise handles the strings Postgres returns for NUMERIC', () => {
  assert.equal(toPaise('690.00'), 69000);
  assert.equal(toPaise('0.00'), 0);
  assert.equal(toPaise(1355), 135500);
  assert.equal(toPaise('105.5'), 10550);
});

test('toPaise rejects junk rather than silently producing NaN', () => {
  assert.throws(() => toPaise('abc'));
  assert.throws(() => toPaise('₹690'));
  assert.throws(() => toPaise(Number.NaN));
});

test('no floating point drift across many small amounts', () => {
  // 0.1 + 0.2 !== 0.3 in float. Ten 10.10 lines must be exactly 101.
  const lines: CostInput[] = Array.from({ length: 10 }, (_, i) => ({
    type: 'food' as const, label: `meal ${i}`, unitPrice: '10.10',
    quantity: 1, unit: 'per_meal',
  }));
  assert.equal(calculateCost(lines).subtotalInr, 101);
});

test('Tirupati day trip, one traveller — the primary scenario', () => {
  const result = calculateCost(
    [
      { type: 'transport', label: 'Vande Bharat 20677 CC', unitPrice: '690.00',
        quantity: 1, unit: 'per_person', dataSource: 'SYNTHETIC', confidence: 'ILLUSTRATIVE' },
      { type: 'food', label: 'Onboard veg breakfast', unitPrice: '150.00',
        quantity: 1, unit: 'per_meal', dataSource: 'SYNTHETIC', confidence: 'ILLUSTRATIVE' },
      { type: 'darshan', label: 'Special Entry Darshan', unitPrice: '300.00',
        quantity: 1, unit: 'per_person', dataSource: 'SYNTHETIC', confidence: 'ILLUSTRATIVE' },
    ],
    FEES
  );

  assert.equal(result.subtotalInr, 1140);
  assert.equal(result.serviceFeesInr, 100);
  assert.equal(result.taxesInr, 62);      // 5% of 1240
  assert.equal(result.totalInr, 1302);
  assert.ok(result.totalInr < 2000, 'day trip must fit the Rs.2,000 budget');
});

test('return trip crosses the Rs.2,000 budget — the honest-answer case', () => {
  const result = calculateCost(
    [
      { type: 'transport', label: 'Vande Bharat 20677 CC return', unitPrice: '690.00',
        quantity: 2, unit: 'per_person' },
      { type: 'food', label: 'Onboard veg breakfast', unitPrice: '150.00',
        quantity: 1, unit: 'per_meal' },
      { type: 'darshan', label: 'Special Entry Darshan', unitPrice: '300.00',
        quantity: 1, unit: 'per_person' },
    ],
    FEES
  );

  assert.equal(result.subtotalInr, 1830);
  assert.equal(result.totalInr, 2026.5);
  assert.ok(result.totalInr > 2000, 'return trip must be reported as over budget');
});

test('taxes apply after discounts, never before', () => {
  const result = calculateCost(
    [{ type: 'transport', label: 'fare', unitPrice: '1000.00', quantity: 1, unit: 'per_person' }],
    [
      { kind: 'discount', label: 'Promo', amountInr: 200 },
      { kind: 'tax', label: 'GST (5%)', percent: 5 },
    ]
  );
  assert.equal(result.discountsInr, 200);
  assert.equal(result.taxesInr, 40);       // 5% of 800, not of 1000
  assert.equal(result.totalInr, 840);
});

test('quantity scales per-person components', () => {
  const result = calculateCost([
    { type: 'transport', label: 'fare', unitPrice: '690.00', quantity: 4, unit: 'per_person' },
  ]);
  assert.equal(result.subtotalInr, 2760);
});

test('zero-priced darshan is a line, not a rounding artefact', () => {
  const result = calculateCost([
    { type: 'darshan', label: 'Sarva Darshan (Free)', unitPrice: '0.00', quantity: 1, unit: 'per_person' },
  ]);
  assert.equal(result.subtotalInr, 0);
  assert.equal(result.lines.length, 1);
});

test('zero-quantity components are dropped entirely', () => {
  const result = calculateCost([
    { type: 'accommodation', label: 'room', unitPrice: '1200.00', quantity: 0, unit: 'per_night' },
  ]);
  assert.equal(result.lines.length, 0);
  assert.equal(result.totalInr, 0);
});

test('one synthetic component makes the whole quote ILLUSTRATIVE', () => {
  const result = calculateCost([
    { type: 'transport', label: 'real fare', unitPrice: '690.00', quantity: 1,
      unit: 'per_person', dataSource: 'REAL_VERIFIED', confidence: 'CONFIRMED' },
    { type: 'darshan', label: 'demo slot', unitPrice: '300.00', quantity: 1,
      unit: 'per_person', dataSource: 'SYNTHETIC', confidence: 'ILLUSTRATIVE' },
  ]);
  assert.equal(result.confidence, 'ILLUSTRATIVE');
  assert.equal(result.allComponentsReal, false);
});

test('fees and taxes do not inflate the quote confidence', () => {
  // Fee lines are CONFIRMED by nature; they must not mask synthetic components.
  const result = calculateCost(
    [{ type: 'transport', label: 'demo fare', unitPrice: '690.00', quantity: 1,
       unit: 'per_person', dataSource: 'SYNTHETIC', confidence: 'ILLUSTRATIVE' }],
    FEES
  );
  assert.equal(result.confidence, 'ILLUSTRATIVE');
});

test('weakestConfidence picks the lowest, and defaults safely when empty', () => {
  assert.equal(weakestConfidence(['CONFIRMED', 'INDICATIVE']), 'INDICATIVE');
  assert.equal(weakestConfidence(['CONFIRMED', 'CONFIRMED']), 'CONFIRMED');
  assert.equal(weakestConfidence([]), 'ILLUSTRATIVE');
});

test('booking-claim guard rejects confident language on demo data', () => {
  assert.ok(violatesBookingClaim('Your seat is confirmed.', 'ILLUSTRATIVE'));
  assert.ok(violatesBookingClaim('We have reserved your room.', 'INDICATIVE'));
  assert.ok(!violatesBookingClaim('This option matches your requirements.', 'ILLUSTRATIVE'));
  assert.ok(!violatesBookingClaim('Your seat is confirmed.', 'CONFIRMED'));
});

test('every confidence level has a disclosure', () => {
  for (const level of ['ILLUSTRATIVE', 'INDICATIVE', 'CONFIRMED'] as const) {
    assert.ok(disclosureFor(level).length > 10);
  }
  assert.match(disclosureFor('ILLUSTRATIVE'), /not live|not a reservation/i);
});
