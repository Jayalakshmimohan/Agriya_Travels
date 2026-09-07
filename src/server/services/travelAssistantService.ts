import { generateWithFallback, hasGeminiKey } from '../ai/gemini';
import {
  findDestination, findTransport, findFood, findDarshan, findAccommodation,
  findPackagesForDestination, getGlobalFees, getTempleGuidance,
  type TransportOption, type FoodOption, type DarshanOption, type AccommodationOption,
} from '../db/repositories/travelRepo';
import {
  calculateCost, disclosureFor, violatesBookingClaim,
  type CostInput, type CostBreakdown, type FeeRule, type ConfidenceLevel,
} from './costEstimationService';
import {
  findMissingRequirements, totalTravellers, isDiscoveryRequest,
  type TravelRequirement,
} from '../schemas/travelRequirement';
import {
  discoverDestinations, type DestinationSuggestion,
} from './destinationDiscoveryService';
import { extractRequirements } from './requirementExtractionService';
import {
  createConversation, findConversation, saveRequirements, appendMessage,
} from '../db/repositories/conversationRepo';

export interface AssistantOption {
  id: string;
  title: string;
  summary: string;
  score: number;
  reasons: string[];
  warnings: string[];
  cost: CostBreakdown;
  withinBudget: boolean | null;
  components: {
    transport?: TransportOption;
    returnTransport?: TransportOption;
    food?: FoodOption;
    darshan?: DarshanOption;
    accommodation?: AccommodationOption;
  };
}

export interface AssistantReply {
  conversationId: string;
  status: 'needs_info' | 'recommended' | 'suggested' | 'no_options';
  message: string;
  question?: string;
  requirement: TravelRequirement;
  options: AssistantOption[];
  /**
   * Destination ideas for a "where should I go?" request. Deliberately
   * unpriced — there are no dates or traveller counts yet, so any figure
   * would be invented.
   */
  suggestions?: DestinationSuggestion[];
  guidance?: { title: string; dressCode: string | null; notes: string | null; source: string | null } | null;
  disclosure: string;
  confidence: ConfidenceLevel;
}

const money = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const toFeeRules = (rows: Awaited<ReturnType<typeof getGlobalFees>>): FeeRule[] =>
  rows.map((r) => ({
    kind: r.kind as FeeRule['kind'],
    label: r.label,
    amountInr: r.amount_inr,
    percent: r.percent,
  }));

/**
 * Scores a candidate combination.
 *
 * Destination is a hard gate upstream (we only ever build options for the
 * requested destination), so it earns no points here. Provenance carries a
 * penalty so that as real data replaces synthetic, real options rise to the
 * top without any code change.
 */
function scoreOption(args: {
  requirement: TravelRequirement;
  cost: CostBreakdown;
  transport?: TransportOption;
  food?: FoodOption;
  darshan?: DarshanOption;
  accommodation?: AccommodationOption;
  budgetCeiling: number | null;
}): { score: number; reasons: string[]; warnings: string[] } {
  const { requirement: req, cost, transport, food, darshan, accommodation } = args;
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Budget fit — 25
  if (args.budgetCeiling !== null) {
    const ratio = cost.totalInr / args.budgetCeiling;
    if (ratio <= 1) {
      score += 25;
      reasons.push(`Total ${money(cost.totalInr)} fits your ${money(args.budgetCeiling)} budget`);
    } else if (ratio <= 1.5) {
      score += Math.round(25 * (1.5 - ratio) * 2);
      warnings.push(
        `${money(cost.totalInr)} is ${money(cost.totalInr - args.budgetCeiling)} over your budget`
      );
    } else {
      warnings.push(`${money(cost.totalInr)} is well above your ${money(args.budgetCeiling)} budget`);
    }
  } else {
    score += 12;
  }

  // Transport preference — 20
  if (transport) {
    const pref = req.transport.preference?.toLowerCase();
    const matchesNamed =
      pref &&
      (transport.service_class_family?.includes(pref.replace(/[\s-]+/g, '_')) ||
        transport.service_name?.toLowerCase().includes(pref));

    if (matchesNamed) {
      score += 20;
      reasons.push(`${transport.service_name} matches your ${req.transport.preference} preference`);
    } else if (req.transport.mode && transport.mode === req.transport.mode) {
      score += 12;
      reasons.push(`Travel by ${transport.mode} as you asked`);
    } else {
      score += 4;
      if (pref) warnings.push(`No ${req.transport.preference} option found — showing the closest alternative`);
    }

    // Date compatibility — 15. Reaching here means the service runs and we
    // hold inventory for the date, so the only question is seat state.
    if (transport.status === 'AVAILABLE') {
      score += 15;
      reasons.push(`Departs ${transport.departure_time.slice(0, 5)} on your travel date`);
    } else if (transport.status === 'RAC' || transport.status === 'WAITLIST') {
      score += 6;
      warnings.push(`Seats are tight on this service (${transport.status})`);
    }
  }

  // Requirement coverage — 20
  const required = req.needs.filter((n) => n !== 'transport');
  if (required.length > 0) {
    let met = 0;
    if (required.includes('food') && food) { met++; reasons.push(`${food.provider_name} — ${food.meal_type} included`); }
    if (required.includes('darshan') && darshan) { met++; reasons.push(`${darshan.name} included`); }
    if (required.includes('accommodation') && accommodation) { met++; reasons.push(`Stay at ${accommodation.hotel_name}`); }
    score += Math.round((met / required.length) * 20);
    for (const need of required) {
      const covered =
        (need === 'food' && food) || (need === 'darshan' && darshan) ||
        (need === 'accommodation' && accommodation);
      if (!covered) warnings.push(`We could not find a ${need} option for this date`);
    }
  } else {
    score += 10;
  }

  // Dietary match — 10
  if (req.dietaryPreference && food) {
    if (food.diet_type === req.dietaryPreference) {
      score += 10;
      reasons.push(`${food.diet_type.replace('_', '-')} meal as preferred`);
    }
  } else if (food) {
    score += 5;
  }

  // Provenance penalty — real data should outrank demo data automatically.
  if (!cost.allComponentsReal) score -= 15;

  return { score: Math.max(0, Math.min(100, score)), reasons, warnings };
}

async function explainWithGemini(
  option: AssistantOption,
  req: TravelRequirement
): Promise<string> {
  // The model receives the finished numbers and may not restate arithmetic.
  const prompt = `You are a travel consultant at Agriya Travels in Chennai.

The traveller asked for:
${JSON.stringify(
  { origin: req.origin, destination: req.destination, date: req.travelDate,
    transport: req.transport, budget: req.budget, needs: req.needs,
    travellers: totalTravellers(req) },
  null, 2
)}

We have already selected and priced this option. The figures are final and were
calculated by our system:

${JSON.stringify(
  { title: option.title,
    lines: option.cost.lines.map((l) => ({ label: l.label, amount: l.amountInr })),
    total: option.cost.totalInr,
    withinBudget: option.withinBudget,
    reasons: option.reasons,
    warnings: option.warnings },
  null, 2
)}

Write 2-4 short sentences explaining why this suits them, in warm plain English.

Strict rules:
- Do NOT state any number that is not in the data above. Do NOT recalculate anything.
- This availability is from a demonstration dataset. Never say a seat, room or
  darshan slot is confirmed, booked, reserved or guaranteed.
- If it is over budget, say so plainly in the first sentence.
- No greeting, no sign-off, no bullet points.`;

  const { text: raw } = await generateWithFallback({ contents: prompt });
  const text = raw.trim();
  if (!text) return option.summary;

  // Prompt instructions are guidance; this is the actual guard.
  if (violatesBookingClaim(text, option.cost.confidence)) {
    console.warn('Explanation claimed a booking on non-confirmed data; using the neutral summary.');
    return option.summary;
  }
  return text;
}

/** Neutral fallback when Gemini is unavailable — still specific and useful. */
function summariseSuggestions(suggestions: DestinationSuggestion[]): string {
  const names = suggestions.map((s) => s.name);
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `Based on what you described, ${list} look like the closest matches in our range.`;
}

async function explainSuggestions(
  suggestions: DestinationSuggestion[],
  req: TravelRequirement
): Promise<string> {
  const prompt = `You are a travel consultant at Agriya Travels in Chennai.

A traveller described the kind of trip they want, without naming a place:
${JSON.stringify(req.preferences, null, 2)}

Our system matched these destinations from the agency's own catalogue. The
names, prices and reasons are final — they came from our database:

${JSON.stringify(
  suggestions.map((s) => ({
    name: s.name,
    region: s.region,
    why: s.reasons,
    bestMonths: s.bestMonths,
    packages: s.packages.map((p) => ({ title: p.title, from: p.startingPrice, duration: p.duration })),
  })),
  null, 2
)}

Write 2-4 warm sentences introducing these as ideas. Name them.

Strict rules:
- Only mention destinations and prices from the data above. Invent nothing.
- Do NOT state a total trip cost — we have no dates or traveller count yet.
- End by asking for their travel dates and how many people are going.
- No greeting, no sign-off, no bullet points.`;

  const { text } = await generateWithFallback({ contents: prompt });
  return text.trim() || summariseSuggestions(suggestions);
}

export async function handleMessage(args: {
  message: string;
  conversationId?: string | null;
  sessionId?: string | null;
}): Promise<AssistantReply> {
  const conversation = args.conversationId
    ? await findConversation(args.conversationId)
    : await createConversation(args.sessionId ?? undefined);

  if (!conversation) throw new Error('Conversation not found');

  await appendMessage({
    conversationId: conversation.id,
    role: 'user',
    content: args.message,
  });

  // 1. Extract, merging into anything gathered on earlier turns.
  const { requirement, model, tokenUsage } = await extractRequirements(
    args.message,
    conversation.extracted_requirements ?? null
  );

  // 2. "Where should I go?" is a different question from "what does this
  //    cost?", and answering it with "where would you like to travel to?" is
  //    the wrong reply to "suggest places for me".
  if (isDiscoveryRequest(requirement)) {
    const suggestions = await discoverDestinations(requirement);

    if (suggestions.length === 0) {
      const msg =
        "I could not match that to anywhere in our current destinations. Tell me a little more — the kind of scenery, climate or pace you have in mind — or name a place and I will price it for you.";
      await saveRequirements(conversation.id, requirement, 'gathering');
      await appendMessage({
        conversationId: conversation.id, role: 'assistant', content: msg,
        extracted: requirement, model, tokenUsage,
      });
      return {
        conversationId: conversation.id, status: 'no_options', message: msg,
        requirement, options: [], suggestions: [],
        disclosure: disclosureFor('ILLUSTRATIVE'), confidence: 'ILLUSTRATIVE',
      };
    }

    let message = summariseSuggestions(suggestions);
    if (hasGeminiKey()) {
      try {
        message = await explainSuggestions(suggestions, requirement);
      } catch (err) {
        console.warn('Suggestion narration unavailable:', (err as Error).message);
      }
    }

    await saveRequirements(conversation.id, requirement, 'recommended');
    await appendMessage({
      conversationId: conversation.id, role: 'assistant', content: message,
      extracted: requirement,
      retrievedIds: {
        destinations: suggestions.map((s) => s.slug),
        packages: suggestions.flatMap((s) => s.packages.map((p) => p.id)),
      },
      model, tokenUsage,
    });

    return {
      conversationId: conversation.id,
      status: 'suggested',
      message,
      requirement,
      options: [],
      suggestions,
      // Package prices are the agency's own published figures, so this is not
      // demo inventory — but nothing here is a bookable quote either.
      disclosure:
        'These are destination ideas with our published starting prices. Tell me your dates and how many are travelling and I can work out a full cost.',
      confidence: 'INDICATIVE',
    };
  }

  // 3. Otherwise it is a quote request — ask before guessing.
  const missing = findMissingRequirements(requirement);
  const blocking = missing.filter((m) => m.blocking);

  if (blocking.length > 0) {
    await saveRequirements(conversation.id, requirement, 'gathering');
    const question = blocking[0].question;
    await appendMessage({
      conversationId: conversation.id, role: 'assistant',
      content: question, extracted: requirement, model, tokenUsage,
    });

    return {
      conversationId: conversation.id,
      status: 'needs_info',
      message: question,
      question,
      requirement,
      options: [],
      disclosure: disclosureFor('ILLUSTRATIVE'),
      confidence: 'ILLUSTRATIVE',
    };
  }

  // 3. Retrieve — SQL only.
  const [originDest, targetDest] = await Promise.all([
    requirement.origin ? findDestination(requirement.origin) : Promise.resolve(null),
    findDestination(requirement.destination!),
  ]);

  if (!targetDest) {
    const msg = `We don't yet cover ${requirement.destination} in our travel data. Our team can still plan it for you — shall I pass your requirements on?`;
    await saveRequirements(conversation.id, requirement, 'gathering');
    await appendMessage({ conversationId: conversation.id, role: 'assistant', content: msg });
    return {
      conversationId: conversation.id, status: 'no_options', message: msg,
      requirement, options: [], disclosure: disclosureFor('ILLUSTRATIVE'),
      confidence: 'ILLUSTRATIVE',
    };
  }

  const pax = totalTravellers(requirement) ?? 1;
  const date = requirement.travelDate!;

  const transportOptions = originDest
    ? await findTransport({
        originDestinationId: originDest.id,
        destDestinationId: targetDest.id,
        travelDate: date,
        mode: requirement.transport.mode,
        preference: requirement.transport.preference,
      })
    : [];

  const wantsFood = requirement.needs.includes('food');
  const wantsDarshan = requirement.needs.includes('darshan');
  const wantsStay =
    requirement.needs.includes('accommodation') ||
    requirement.optionalNeeds.some((n) => /accommod|hotel|stay/i.test(n));

  const bestTransport = transportOptions[0];

  const [foodOptions, darshanOptions, stayOptions, fees, guidance] = await Promise.all([
    wantsFood
      ? findFood({
          destinationId: targetDest.id,
          routeId: bestTransport?.route_id ?? null,
          dietType: requirement.dietaryPreference,
        })
      : Promise.resolve([] as FoodOption[]),
    wantsDarshan
      ? findDarshan({ destinationId: targetDest.id, date })
      : Promise.resolve([] as DarshanOption[]),
    wantsStay
      ? findAccommodation({ destinationId: targetDest.id, stayDate: date, travellers: pax, limit: 3 })
      : Promise.resolve([] as AccommodationOption[]),
    getGlobalFees(),
    getTempleGuidance(targetDest.id),
  ]);

  const feeRules = toFeeRules(fees);

  const budgetCeiling =
    requirement.budget.amount === null
      ? null
      : requirement.budget.basis === 'per_person'
        ? requirement.budget.amount * pax
        : requirement.budget.amount;

  // 4. Build candidate combinations. Cheapest darshan and food keep the
  //    headline option affordable; alternatives are surfaced separately.
  const cheapestFood = foodOptions[0];
  const paidDarshan = darshanOptions.find((d) => Number(d.price_inr) > 0);
  const freeDarshan = darshanOptions.find((d) => Number(d.price_inr) === 0);
  const chosenDarshan = paidDarshan ?? freeDarshan;
  const cheapestStay = stayOptions[0];

  const options: AssistantOption[] = [];

  const buildOption = (
    id: string,
    title: string,
    parts: {
      transport?: TransportOption;
      returnTransport?: TransportOption;
      food?: FoodOption;
      darshan?: DarshanOption;
      accommodation?: AccommodationOption;
    }
  ): AssistantOption => {
    const inputs: CostInput[] = [];

    if (parts.transport) {
      inputs.push({
        type: 'transport',
        label: `${parts.transport.service_name ?? 'Transport'} (${parts.transport.class_code})`,
        detail: `${parts.transport.origin_code} → ${parts.transport.dest_code}, dep ${parts.transport.departure_time.slice(0, 5)}`,
        unitPrice: parts.transport.fare_inr, quantity: pax, unit: 'per_person',
        dataSource: parts.transport.availability_source,
        confidence: parts.transport.confidence as ConfidenceLevel,
      });
    }
    if (parts.returnTransport) {
      inputs.push({
        type: 'transport',
        label: `${parts.returnTransport.service_name ?? 'Transport'} (return)`,
        unitPrice: parts.returnTransport.fare_inr, quantity: pax, unit: 'per_person',
        dataSource: parts.returnTransport.availability_source,
        confidence: parts.returnTransport.confidence as ConfidenceLevel,
      });
    }
    if (parts.food) {
      inputs.push({
        type: 'food',
        label: `${parts.food.provider_name} — ${parts.food.meal_type} (${parts.food.diet_type})`,
        unitPrice: parts.food.price_inr, quantity: pax, unit: 'per_meal',
        dataSource: parts.food.data_source, confidence: 'ILLUSTRATIVE',
      });
    }
    if (parts.darshan) {
      inputs.push({
        type: 'darshan',
        label: parts.darshan.name,
        detail: parts.darshan.slot_start ? `Slot ${parts.darshan.slot_start.slice(0, 5)}` : undefined,
        unitPrice: parts.darshan.price_inr, quantity: pax, unit: 'per_person',
        dataSource: parts.darshan.availability_source ?? parts.darshan.type_source,
        confidence: (parts.darshan.confidence as ConfidenceLevel) ?? 'ILLUSTRATIVE',
      });
    }
    if (parts.accommodation) {
      const rooms = Math.ceil(pax / Math.max(1, parts.accommodation.max_occupancy));
      inputs.push({
        type: 'accommodation',
        label: `${parts.accommodation.hotel_name} — ${parts.accommodation.room_name}`,
        detail: `${rooms} room${rooms > 1 ? 's' : ''}, 1 night`,
        unitPrice: parts.accommodation.price_per_night_inr, quantity: rooms, unit: 'per_night',
        dataSource: parts.accommodation.data_source,
        confidence: parts.accommodation.confidence as ConfidenceLevel,
      });
    }

    const cost = calculateCost(inputs, feeRules);
    const { score, reasons, warnings } = scoreOption({
      requirement, cost, ...parts, budgetCeiling,
    });

    return {
      id, title,
      summary: `${title} — ${money(cost.totalInr)} total for ${pax} traveller${pax > 1 ? 's' : ''}.`,
      score, reasons, warnings, cost,
      withinBudget: budgetCeiling === null ? null : cost.totalInr <= budgetCeiling,
      components: parts,
    };
  };

  if (bestTransport) {
    options.push(
      buildOption('day-trip', `Day trip to ${targetDest.name}`, {
        transport: bestTransport,
        food: cheapestFood,
        darshan: chosenDarshan,
      })
    );

    const returnLeg = transportOptions.find(
      (t) => t.route_id === bestTransport.route_id && t.class_code === bestTransport.class_code
    );
    if (requirement.isRoundTrip !== false && returnLeg) {
      options.push(
        buildOption('return-trip', `Return trip to ${targetDest.name}`, {
          transport: bestTransport, returnTransport: returnLeg,
          food: cheapestFood, darshan: chosenDarshan,
        })
      );
    }

    if (cheapestStay) {
      options.push(
        buildOption('with-stay', `${targetDest.name} with an overnight stay`, {
          transport: bestTransport, food: cheapestFood,
          darshan: chosenDarshan, accommodation: cheapestStay,
        })
      );
    }

    // A cheaper alternative service, when one exists and differs.
    const cheaperAlt = transportOptions.find(
      (t) => t.route_id !== bestTransport.route_id && Number(t.fare_inr) < Number(bestTransport.fare_inr)
    );
    if (cheaperAlt) {
      options.push(
        buildOption('budget-alt', `Lower-cost option via ${cheaperAlt.service_name}`, {
          transport: cheaperAlt, food: cheapestFood, darshan: chosenDarshan,
        })
      );
    }
  }

  options.sort((a, b) => b.score - a.score);
  const top = options.slice(0, 4);

  if (top.length === 0) {
    const msg = `We couldn't find transport from ${requirement.origin} to ${targetDest.name} on ${date} in our data. Our team can look into other routes for you.`;
    await saveRequirements(conversation.id, requirement, 'gathering');
    await appendMessage({ conversationId: conversation.id, role: 'assistant', content: msg });
    return {
      conversationId: conversation.id, status: 'no_options', message: msg,
      requirement, options: [], disclosure: disclosureFor('ILLUSTRATIVE'),
      confidence: 'ILLUSTRATIVE',
    };
  }

  // 5. Gemini explains the top option. Never calculates.
  if (hasGeminiKey()) {
    try {
      top[0].summary = await explainWithGemini(top[0], requirement);
    } catch (err) {
      console.warn('Explanation unavailable, using the generated summary:', (err as Error).message);
    }
  }

  const confidence = top[0].cost.confidence;

  await saveRequirements(conversation.id, requirement, 'recommended');
  await appendMessage({
    conversationId: conversation.id,
    role: 'assistant',
    content: top[0].summary,
    extracted: requirement,
    retrievedIds: {
      destination: targetDest.id,
      transport: transportOptions.map((t) => t.schedule_id),
      food: foodOptions.map((f) => f.id),
      darshan: darshanOptions.map((d) => d.darshan_type_id),
      accommodation: stayOptions.map((s) => s.room_type_id),
    },
    model, tokenUsage,
  });

  return {
    conversationId: conversation.id,
    status: 'recommended',
    message: top[0].summary,
    requirement,
    options: top,
    guidance: guidance
      ? {
          title: guidance.name,
          dressCode: guidance.dress_code,
          notes: guidance.general_guidelines,
          source: guidance.official_url,
        }
      : null,
    disclosure: disclosureFor(confidence),
    confidence,
  };
}

export async function packagesFor(destinationSlug: string) {
  const dest = await findDestination(destinationSlug);
  return dest ? findPackagesForDestination(dest.id) : [];
}
