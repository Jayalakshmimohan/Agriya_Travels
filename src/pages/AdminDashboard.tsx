import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Lock, Phone, Mail, MapPin, Users, Calendar, RefreshCw,
  TrendingUp, Sparkles, AlertCircle, LogOut, ChevronRight, Package,
} from 'lucide-react';

type LeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost';

interface Lead {
  id: string;
  created_at: string;
  source: string;
  focus: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  destination: string | null;
  travel_date: string | null;
  travellers: number | null;
  budget: string | null;
  message: string | null;
  score: number | null;
  score_breakdown: ScoreBreakdown | null;
  ai_summary: string | null;
  status: LeadStatus;
}

interface ScoreBreakdown {
  base: number;
  total: number;
  aiAdjustment?: number;
  components: { factor: string; points: number; max: number; reason: string }[];
}

const STATUSES: LeadStatus[] = ['new', 'contacted', 'quoted', 'won', 'lost'];

const STATUS_STYLE: Record<LeadStatus, string> = {
  new: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  contacted: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  quoted: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  won: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  lost: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

const TOKEN_KEY = 'agriya_admin_token';

function scoreColour(score: number | null): string {
  if (score === null) return 'text-theme-muted';
  if (score >= 70) return 'text-emerald-600';
  if (score >= 45) return 'text-amber-600';
  return 'text-slate-500';
}

export default function AdminDashboard() {
  const [token, setToken] = useState<string>('');
  const [authed, setAuthed] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [insights, setInsights] = useState<any | null>(null);
  const [narration, setNarration] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');

  // Kept in sessionStorage, not localStorage: this token reads customer PII,
  // so it should not outlive the browser session on a shared machine.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(TOKEN_KEY);
      if (saved) {
        setToken(saved);
        setAuthed(true);
      }
    } catch {
      /* private mode */
    }
  }, []);

  const api = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const res = await fetch(`/api/admin${path}`, {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) throw new Error('unauthorized');
      return res.json();
    },
    [token]
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const [leadsRes, insightsRes] = await Promise.all([
        api(`/leads${query}`),
        api('/insights'),
      ]);
      if (leadsRes.success) setLeads(leadsRes.data);
      if (insightsRes.success) {
        setInsights(insightsRes.data);
        setNarration(insightsRes.narration);
      }
    } catch (err) {
      if ((err as Error).message === 'unauthorized') {
        setAuthed(false);
        setAuthError('That token was rejected.');
        try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
      }
    } finally {
      setLoading(false);
    }
  }, [api, token, statusFilter]);

  useEffect(() => {
    if (authed) void load();
  }, [authed, load]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const candidate = tokenInput.trim();
    if (!candidate) return;

    const res = await fetch('/api/admin/leads?limit=1', {
      headers: { Authorization: `Bearer ${candidate}` },
    });

    if (res.ok) {
      try { sessionStorage.setItem(TOKEN_KEY, candidate); } catch { /* ignore */ }
      setToken(candidate);
      setAuthed(true);
      setTokenInput('');
    } else if (res.status === 503) {
      setAuthError('Admin API is not configured — set ADMIN_API_TOKEN on the server.');
    } else {
      setAuthError('Invalid token.');
    }
  };

  const signOut = () => {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    setToken('');
    setAuthed(false);
    setLeads([]);
    setSelected(null);
  };

  const openLead = async (id: string) => {
    const res = await api(`/leads/${id}`);
    if (res.success) setSelected(res.data);
  };

  const changeStatus = async (id: string, status: LeadStatus) => {
    await api(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await load();
    await openLead(id);
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg px-4">
        <form
          onSubmit={signIn}
          className="w-full max-w-sm bg-theme-card border border-theme-border rounded-3xl p-8 shadow-xl"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-gold/15 text-theme-gold mb-6">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold font-serif text-theme-heading">Agriya Admin</h1>
          <p className="text-xs text-theme-muted mt-1 mb-6">
            Enter the access token to view enquiries.
          </p>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Access token"
            className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-heading outline-none focus:border-theme-gold transition-colors"
          />
          {authError && (
            <p className="text-xs text-red-500 mt-3 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> {authError}
            </p>
          )}
          <button
            type="submit"
            className="w-full mt-5 bg-theme-navy text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-theme-teal transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      <header className="bg-theme-navy text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif">Enquiry Dashboard</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Agriya Travels — internal</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void load()}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> Exit
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Totals */}
        {insights && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total enquiries', value: insights.totals.leads },
              { label: 'Contactable', value: insights.totals.contactable },
              { label: 'Awaiting call', value: insights.totals.newLeads },
              { label: 'Won', value: insights.totals.won },
              { label: 'Itineraries generated', value: insights.totals.plansGenerated },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-theme-card border border-theme-border rounded-2xl p-5"
              >
                <p className="text-2xl font-bold text-theme-heading">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-theme-muted mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* AI narration */}
        {narration && (
          <section className="bg-theme-navy text-white rounded-3xl p-6 sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-theme-gold flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4" /> What this data says
            </h2>
            <div className="text-sm text-slate-200 font-light leading-relaxed whitespace-pre-line">
              {narration}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Call list */}
          <section className="xl:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-bold font-serif text-theme-heading">
                Call list <span className="text-theme-muted font-sans text-xs font-normal">(highest score first)</span>
              </h2>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', ...STATUSES] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s as LeadStatus | 'all')}
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
                      statusFilter === s
                        ? 'bg-theme-navy text-white border-theme-navy'
                        : 'bg-theme-card text-theme-muted border-theme-border hover:border-theme-gold'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {loading && leads.length === 0 ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-theme-gold" />
              </div>
            ) : leads.length === 0 ? (
              <div className="bg-theme-card border border-theme-border rounded-2xl p-10 text-center">
                <p className="text-sm text-theme-muted">No enquiries yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {leads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => void openLead(lead.id)}
                    className={`text-left bg-theme-card border rounded-2xl p-5 hover:border-theme-gold transition-colors ${
                      selected?.lead?.id === lead.id ? 'border-theme-gold' : 'border-theme-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-theme-heading text-sm">
                            {lead.name || 'Anonymous enquiry'}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLE[lead.status]}`}>
                            {lead.status}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-theme-muted">
                            {lead.source.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-2.5 text-[11px] text-theme-muted flex-wrap">
                          {lead.destination && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {lead.destination}</span>
                          )}
                          {lead.travellers && (
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {lead.travellers}</span>
                          )}
                          {lead.travel_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {new Date(lead.travel_date).toLocaleDateString('en-IN')}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>
                          )}
                        </div>

                        {lead.ai_summary && (
                          <p className="text-[11px] text-theme-muted italic mt-2.5 line-clamp-2">
                            {lead.ai_summary}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`text-2xl font-bold ${scoreColour(lead.score)}`}>
                          {lead.score ?? '—'}
                        </p>
                        <p className="text-[9px] uppercase tracking-widest text-theme-muted">score</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Detail + demand */}
          <aside className="flex flex-col gap-6">
            {selected ? (
              <div className="bg-theme-card border border-theme-border rounded-2xl p-6 flex flex-col gap-5">
                <div>
                  <h3 className="font-bold font-serif text-lg text-theme-heading">
                    {selected.lead.name || 'Anonymous enquiry'}
                  </h3>
                  <p className="text-[11px] text-theme-muted mt-0.5">
                    Enquiry #{selected.lead.id} · {new Date(selected.lead.created_at).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {selected.lead.phone && (
                    <a href={`tel:${selected.lead.phone}`} className="flex items-center gap-1.5 text-[11px] font-bold bg-theme-navy text-white px-3 py-2 rounded-lg">
                      <Phone className="h-3 w-3" /> Call
                    </a>
                  )}
                  {selected.lead.phone && (
                    <a
                      href={`https://wa.me/${selected.lead.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[11px] font-bold bg-[#25D366] text-white px-3 py-2 rounded-lg"
                    >
                      WhatsApp
                    </a>
                  )}
                  {selected.lead.email && (
                    <a href={`mailto:${selected.lead.email}`} className="flex items-center gap-1.5 text-[11px] font-bold bg-theme-bg border border-theme-border text-theme-heading px-3 py-2 rounded-lg">
                      <Mail className="h-3 w-3" /> Email
                    </a>
                  )}
                </div>

                {selected.lead.message && (
                  <div className="bg-theme-bg rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-theme-muted mb-1.5">Their message</p>
                    <p className="text-xs text-theme-heading leading-relaxed">{selected.lead.message}</p>
                  </div>
                )}

                {/* Why this score */}
                {selected.lead.score_breakdown && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-theme-muted mb-2.5">
                      Why {selected.lead.score}?
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {selected.lead.score_breakdown.components.map((c: any) => (
                        <div key={c.factor} className="flex items-start justify-between gap-3 text-[11px]">
                          <span className="text-theme-muted">{c.reason}</span>
                          <span className="font-bold text-theme-heading shrink-0">
                            {c.points}/{c.max}
                          </span>
                        </div>
                      ))}
                      {typeof selected.lead.score_breakdown.aiAdjustment === 'number' && (
                        <div className="flex items-center justify-between gap-3 text-[11px] pt-1.5 border-t border-theme-border">
                          <span className="text-theme-muted flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-theme-gold" /> AI read of their message
                          </span>
                          <span className="font-bold text-theme-heading">
                            {selected.lead.score_breakdown.aiAdjustment > 0 ? '+' : ''}
                            {selected.lead.score_breakdown.aiAdjustment}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {selected.recommendations?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-theme-muted mb-2.5 flex items-center gap-1.5">
                      <Package className="h-3 w-3" /> Suggest these packages
                    </p>
                    <div className="flex flex-col gap-2">
                      {selected.recommendations.map((r: any) => (
                        <div key={r.package.id} className="bg-theme-bg rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-theme-heading">{r.package.title}</span>
                            <span className="text-[10px] text-theme-gold font-bold shrink-0">
                              {r.package.starting_price}
                            </span>
                          </div>
                          <p className="text-[10px] text-theme-muted mt-1">{r.reasons.join(' · ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated itineraries */}
                {selected.plans?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-theme-muted mb-2">
                      Itineraries they generated
                    </p>
                    {selected.plans.map((p: any) => (
                      <div key={p.id} className="text-[11px] text-theme-heading bg-theme-bg rounded-xl p-3 mb-2">
                        {p.plan?.title}
                        <span className="block text-theme-muted mt-0.5">{p.plan?.cost}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pipeline */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-theme-muted mb-2">Move to</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => void changeStatus(selected.lead.id, s)}
                        disabled={selected.lead.status === s}
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 ${STATUS_STYLE[s]}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                {selected.events?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-theme-muted mb-2">History</p>
                    <div className="flex flex-col gap-1.5">
                      {selected.events.map((e: any) => (
                        <div key={e.id} className="flex items-center gap-2 text-[10px] text-theme-muted">
                          <ChevronRight className="h-3 w-3 shrink-0" />
                          <span className="font-bold text-theme-heading">{e.type.replace('_', ' ')}</span>
                          <span>{new Date(e.created_at).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-theme-card border border-theme-border rounded-2xl p-8 text-center">
                <p className="text-xs text-theme-muted">Select an enquiry to see details.</p>
              </div>
            )}

            {/* Demand */}
            {insights?.topDestinations?.length > 0 && (
              <div className="bg-theme-card border border-theme-border rounded-2xl p-6">
                <h3 className="text-[10px] uppercase tracking-widest text-theme-muted mb-4 flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3" /> Most requested
                </h3>
                <div className="flex flex-col gap-2.5">
                  {insights.topDestinations.map((d: any) => (
                    <div key={d.destination} className="flex items-center justify-between text-xs">
                      <span className="text-theme-heading">{d.destination}</span>
                      <span className="text-theme-muted">
                        {d.enquiries} · avg {d.avgTravellers} pax
                      </span>
                    </div>
                  ))}
                </div>

                {insights.unservedDestinations?.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-theme-border">
                    <p className="text-[10px] uppercase tracking-widest text-theme-muted mb-2">
                      Asked for, no package
                    </p>
                    <p className="text-[11px] text-theme-heading">
                      {insights.unservedDestinations.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
