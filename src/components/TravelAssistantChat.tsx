import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Loader2, Sparkles, Info, AlertTriangle, CheckCircle2,
  Train, Utensils, Landmark, BedDouble, Receipt, MessageCircle, ShieldAlert,
  MapPin, CalendarRange, Package as PackageIcon,
} from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data';

interface CostLine {
  type: string;
  label: string;
  detail?: string;
  amountInr: number;
  quantity: number;
  unit: string;
}

interface Option {
  id: string;
  title: string;
  summary: string;
  score: number;
  reasons: string[];
  warnings: string[];
  withinBudget: boolean | null;
  cost: { lines: CostLine[]; totalInr: number; currency: string };
}

interface SuggestedPackage {
  id: string;
  title: string;
  duration: string | null;
  startingPrice: string | null;
}

interface DestinationSuggestion {
  slug: string;
  name: string;
  region: string | null;
  destinationType: string | null;
  description: string | null;
  score: number;
  reasons: string[];
  bestMonths: string[];
  packages: SuggestedPackage[];
}

interface Reply {
  conversationId: string;
  status: 'needs_info' | 'recommended' | 'suggested' | 'no_options';
  message: string;
  question?: string;
  options: Option[];
  suggestions?: DestinationSuggestion[];
  guidance?: { title: string; dressCode: string | null; notes: string | null; source: string | null } | null;
  disclosure: string;
  confidence: string;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
  reply?: Reply;
}

const EXAMPLE =
  "I'm a new traveller. I want to travel from Chennai to Tirupati on September 7, 2026 by Vande Bharat. My budget is ₹2,000. I need food for the journey and I also want darshan. If possible, recommend accommodation too.";

const money = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  transport: Train,
  food: Utensils,
  darshan: Landmark,
  accommodation: BedDouble,
  service_fee: Receipt,
  tax: Receipt,
  discount: Receipt,
};

interface TravelAssistantChatProps {
  /** Tightens spacing and unsticks the composer for the floating panel. */
  compact?: boolean;
}

export default function TravelAssistantChat({ compact = false }: TravelAssistantChatProps) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, busy]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;

    setError(null);
    setTurns((t) => [...t, { role: 'user', text: message }]);
    setInput('');
    setBusy(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          ...(conversationId ? { conversationId } : {}),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(
          json?.reason === 'no_api_key'
            ? 'The travel assistant is not configured on this server yet.'
            : json?.message ?? 'Something went wrong. Please try again.'
        );
        return;
      }

      const reply: Reply = json.data;
      setConversationId(reply.conversationId);
      setTurns((t) => [...t, { role: 'assistant', text: reply.message, reply }]);
    } catch {
      setError('Could not reach the assistant. Please check your connection.');
    } finally {
      setBusy(false);
    }
  };

  const lastReply = [...turns].reverse().find((t) => t.reply)?.reply;

  const whatsappUrl = (() => {
    const best = lastReply?.options?.[0];
    const text = best
      ? `Hi Agriya Travels, your assistant suggested: ${best.title} — ${money(best.cost.totalInr)}. Please help me confirm real availability and book.`
      : 'Hi Agriya Travels, I was using your travel assistant and would like some help.';
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  })();

  return (
    <div className={`flex flex-col ${compact ? 'gap-4' : 'gap-6'}`}>
      {/* Conversation */}
      <div className={`flex flex-col ${compact ? 'gap-4' : 'gap-5'} ${compact ? '' : 'min-h-[280px]'}`}>
        {turns.length === 0 && !busy && (
          <div className={`bg-theme-card border border-theme-border rounded-3xl ${compact ? 'p-4' : 'p-6 sm:p-8'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-gold/15 text-theme-gold">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold font-serif text-lg text-theme-heading">
                  Tell us about your trip
                </h3>
                <p className="text-[11px] text-theme-muted">
                  Describe it in your own words — we'll work out the options and the cost.
                </p>
              </div>
            </div>
            <button
              onClick={() => void send(EXAMPLE)}
              className="text-left w-full bg-theme-bg border border-theme-border hover:border-theme-gold rounded-2xl p-4 transition-colors"
            >
              <span className="text-[10px] uppercase tracking-widest text-theme-gold font-bold">
                Try this
              </span>
              <p className="text-xs text-theme-heading mt-1.5 leading-relaxed">{EXAMPLE}</p>
            </button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {turns.map((turn, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={turn.role === 'user' ? 'flex justify-end' : ''}
            >
              {turn.role === 'user' ? (
                <div className="bg-theme-navy text-white rounded-2xl rounded-br-md px-5 py-3.5 max-w-[85%] text-sm leading-relaxed">
                  {turn.text}
                </div>
              ) : (
                <div className="flex flex-col gap-5 w-full">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-theme-gold/15 text-theme-gold">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="bg-theme-card border border-theme-border rounded-2xl rounded-tl-md px-5 py-3.5 text-sm text-theme-heading leading-relaxed">
                      {turn.text}
                    </div>
                  </div>

                  {turn.reply?.options && turn.reply.options.length > 0 && (
                    <div className="flex flex-col gap-4 sm:pl-11">
                      {turn.reply.options.map((option, idx) => (
                        <OptionCard key={option.id} option={option} isTop={idx === 0} />
                      ))}
                    </div>
                  )}

                  {turn.reply?.suggestions && turn.reply.suggestions.length > 0 && (
                    <div className="flex flex-col gap-3 sm:pl-11">
                      {turn.reply.suggestions.map((s, idx) => (
                        <SuggestionCard key={s.slug} suggestion={s} isTop={idx === 0} />
                      ))}
                    </div>
                  )}

                  {turn.reply?.guidance && (
                    <div className="sm:pl-11">
                      <div className="bg-theme-navy/5 border border-theme-border rounded-2xl p-5">
                        <h4 className="text-[10px] uppercase tracking-widest text-theme-muted mb-2 flex items-center gap-1.5">
                          <Landmark className="h-3 w-3" /> {turn.reply.guidance.title}
                        </h4>
                        {turn.reply.guidance.dressCode && (
                          <p className="text-[11px] text-theme-heading leading-relaxed mb-2">
                            <span className="font-bold">Dress code: </span>
                            {turn.reply.guidance.dressCode}
                          </p>
                        )}
                        {turn.reply.guidance.notes && (
                          <p className="text-[11px] text-theme-muted leading-relaxed">
                            {turn.reply.guidance.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {turn.reply && (turn.reply.status === 'recommended' || turn.reply.status === 'suggested') && (
                    <div className="sm:pl-11">
                      <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4">
                        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                          {turn.reply.disclosure}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {busy && (
          <div className="flex gap-3 items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-gold/15 text-theme-gold">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <span className="text-xs text-theme-muted">Working out your options…</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 rounded-2xl p-4">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Handoff */}
      {lastReply?.status === 'recommended' && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-2xl font-bold text-sm"
        >
          <MessageCircle className="h-4 w-4 fill-current" />
          Continue on WhatsApp to confirm availability
        </a>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className={`flex gap-3 ${compact ? '' : 'sticky bottom-4'}`}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          placeholder={
            turns.length === 0
              ? 'e.g. Chennai to Tirupati on 7 September, ₹2,000 budget…'
              : 'Type your answer…'
          }
          className="flex-1 bg-theme-card border border-theme-border rounded-2xl px-5 py-4 text-sm text-theme-heading outline-none focus:border-theme-gold transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="bg-theme-navy text-white px-6 rounded-2xl font-bold text-xs uppercase tracking-wider disabled:opacity-40 hover:bg-theme-teal transition-colors flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}

/**
 * A destination idea, deliberately without a total price.
 *
 * Shows the agency's published "from" price per package but never a trip
 * total: there are no dates and no traveller count yet, so any total would be
 * invented. The card's job is to end with "tell me your dates".
 */
function SuggestionCard({
  suggestion,
  isTop,
}: {
  key?: React.Key;
  suggestion: DestinationSuggestion;
  isTop: boolean;
}) {
  return (
    <div
      className={`bg-theme-card border rounded-2xl p-5 transition-colors ${
        isTop ? 'border-theme-gold' : 'border-theme-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold font-serif text-theme-heading text-sm flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-theme-gold shrink-0" />
              {suggestion.name}
            </h4>
            {isTop && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-theme-gold text-theme-heading px-2 py-0.5 rounded-full">
                Closest match
              </span>
            )}
          </div>
          {suggestion.region && (
            <p className="text-[10px] uppercase tracking-widest text-theme-muted mt-1">
              {suggestion.region}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-theme-heading">{suggestion.score}%</p>
          <p className="text-[9px] uppercase tracking-widest text-theme-muted">match</p>
        </div>
      </div>

      {suggestion.description && (
        <p className="text-[11px] text-theme-muted leading-relaxed mt-3">
          {suggestion.description}
        </p>
      )}

      {suggestion.reasons.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {suggestion.reasons.map((reason, i) => (
            <li key={i} className="text-[11px] text-theme-muted flex items-start gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
              {reason}
            </li>
          ))}
        </ul>
      )}

      {suggestion.bestMonths.length > 0 && (
        <p className="text-[10px] text-theme-muted mt-3 flex items-center gap-1.5">
          <CalendarRange className="h-3 w-3 shrink-0" />
          Best months: {suggestion.bestMonths.join(', ')}
        </p>
      )}

      {suggestion.packages.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-theme-border flex flex-col gap-2">
          {suggestion.packages.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-3">
              <span className="text-[11px] text-theme-heading flex items-start gap-1.5 min-w-0">
                <PackageIcon className="h-3 w-3 shrink-0 mt-0.5 text-theme-gold" />
                <span>
                  {p.title}
                  {p.duration && (
                    <span className="block text-theme-muted">{p.duration}</span>
                  )}
                </span>
              </span>
              {p.startingPrice && (
                <span className="text-[11px] font-bold text-theme-heading shrink-0">
                  from {p.startingPrice}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// `key` is declared here for the same reason FleetCard does: this project's
// TS config surfaces it as a prop rather than stripping it.
function OptionCard({
  option,
  isTop,
}: {
  key?: React.Key;
  option: Option;
  isTop: boolean;
}) {
  const [open, setOpen] = useState(isTop);

  return (
    <div
      className={`bg-theme-card border rounded-2xl overflow-hidden transition-colors ${
        isTop ? 'border-theme-gold' : 'border-theme-border'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-theme-heading text-sm">{option.title}</h4>
              {isTop && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-theme-gold text-theme-heading px-2 py-0.5 rounded-full">
                  Best match
                </span>
              )}
              {option.withinBudget === true && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> In budget
                </span>
              )}
              {option.withinBudget === false && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Over budget
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-theme-heading">{money(option.cost.totalInr)}</p>
            <p className="text-[9px] uppercase tracking-widest text-theme-muted">total</p>
          </div>
        </div>

        {option.reasons.length > 0 && (
          <ul className="mt-3.5 flex flex-col gap-1.5">
            {option.reasons.map((reason, i) => (
              <li key={i} className="text-[11px] text-theme-muted flex items-start gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                {reason}
              </li>
            ))}
          </ul>
        )}

        {option.warnings.length > 0 && (
          <ul className="mt-2.5 flex flex-col gap-1.5">
            {option.warnings.map((warning, i) => (
              <li key={i} className="text-[11px] text-amber-600 flex items-start gap-1.5">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                {warning}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-4 text-[10px] font-bold uppercase tracking-wider text-theme-gold flex items-center gap-1.5"
        >
          <Info className="h-3 w-3" />
          {open ? 'Hide' : 'Show'} price breakdown
        </button>
      </div>

      {open && (
        <div className="border-t border-theme-border bg-theme-bg px-5 py-4">
          <div className="flex flex-col gap-2">
            {option.cost.lines.map((line, i) => {
              const Icon = ICONS[line.type] ?? Receipt;
              return (
                <div key={i} className="flex items-start justify-between gap-3 text-[11px]">
                  <span className="text-theme-muted flex items-start gap-2 min-w-0">
                    <Icon className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>
                      {line.label}
                      {line.quantity > 1 && (
                        <span className="text-theme-muted/70"> × {line.quantity}</span>
                      )}
                      {line.detail && (
                        <span className="block text-theme-muted/70">{line.detail}</span>
                      )}
                    </span>
                  </span>
                  <span className="font-bold text-theme-heading shrink-0 tabular-nums">
                    {money(line.amountInr)}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-theme-border text-xs">
              <span className="font-bold uppercase tracking-wider text-theme-heading">Total</span>
              <span className="font-bold text-theme-heading tabular-nums">
                {money(option.cost.totalInr)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
