import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Newspaper, TrendingUp, ExternalLink, AlertTriangle, Sparkles, RefreshCw, Compass } from 'lucide-react';

interface NewsItem {
  title: string;
  category: 'Trend' | 'Tip' | 'Advisory' | 'News' | 'Insight' | string;
  summary: string;
  date: string;
  sourceTitle: string;
  sourceUrl?: string;
}

export default function TravelTipsTrends() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/travel-news');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setItems(result.data);
      } else {
        throw new Error(result.error || 'Invalid API response format');
      }
    } catch (err: any) {
      console.error('Error fetching travel tips & trends:', err);
      setError('Could not refresh the latest trends. Please check again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'advisory':
        return 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-800/30';
      case 'trend':
        return 'bg-theme-teal/10 text-theme-teal dark:text-theme-gold dark:bg-theme-gold/10 border border-theme-teal/20 dark:border-theme-gold/20';
      case 'tip':
        return 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50 dark:border-green-800/30';
      case 'news':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30';
      default:
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'advisory':
        return <AlertTriangle className="h-3 w-3" />;
      case 'trend':
        return <TrendingUp className="h-3 w-3" />;
      case 'tip':
        return <Sparkles className="h-3 w-3" />;
      default:
        return <Newspaper className="h-3 w-3" />;
    }
  };

  return (
    <section className="bg-theme-card border border-theme-border rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-theme-gold/5 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between z-10">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold font-serif text-theme-heading leading-tight flex items-center gap-2">
            <Compass className="h-6 w-6 text-theme-gold animate-pulse" />
            Travel Tips & Trends
          </h3>
          <p className="text-xs text-theme-muted font-light mt-1">
            Real-time travel advice and search-grounded destination insights
          </p>
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="p-2 text-theme-muted hover:text-theme-heading hover:bg-theme-navy/5 dark:hover:bg-white/5 rounded-full transition-all disabled:opacity-50"
          title="Refresh Feed"
          id="refresh-news-feed-btn"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-theme-navy/5 dark:bg-white/5 border border-theme-border/50 rounded-2xl p-5 flex flex-col gap-3 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-theme-border/50 rounded w-1/4" />
              <div className="h-5 bg-slate-200 dark:bg-theme-border/50 rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-theme-border/50 rounded" />
                <div className="h-3 bg-slate-200 dark:bg-theme-border/50 rounded w-5/6" />
              </div>
              <div className="mt-auto pt-4 flex justify-between">
                <div className="h-3 bg-slate-200 dark:bg-theme-border/50 rounded w-1/5" />
                <div className="h-3 bg-slate-200 dark:bg-theme-border/50 rounded w-1/6" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10 flex flex-col items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-theme-gold" />
          <p className="text-sm text-theme-muted font-light">{error}</p>
          <button
            onClick={fetchNews}
            className="text-xs font-bold bg-theme-navy text-white hover:bg-theme-navy/90 dark:bg-theme-gold dark:text-theme-heading dark:hover:bg-[#ebd074] px-4 py-2 rounded-xl transition-all"
            id="retry-news-feed-btn"
          >
            Retry Loading
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-theme-muted font-light">No new travel advice at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 z-10">
          {items.slice(0, 4).map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
              className="bg-theme-card border border-theme-border/75 hover:border-theme-gold/40 hover:shadow-lg rounded-2xl p-5 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider ${getCategoryColor(item.category)}`}>
                    {getCategoryIcon(item.category)}
                    {item.category}
                  </span>
                  <span className="text-[10px] text-theme-muted font-medium">{item.date}</span>
                </div>
                <h4 className="font-bold text-theme-heading text-sm leading-snug mb-2 group-hover:text-theme-gold transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] text-theme-muted font-light leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-theme-border/40 flex items-center justify-between text-[10px]">
                <span className="text-theme-muted">
                  Source: <strong className="text-theme-heading font-semibold">{item.sourceTitle}</strong>
                </span>
                {item.sourceUrl ? (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-theme-gold hover:text-theme-teal dark:hover:text-white font-bold flex items-center gap-1 transition-all"
                    id={`news-link-${index}`}
                  >
                    View Source <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ) : (
                  <span className="text-[9px] text-theme-muted/60 font-light flex items-center gap-0.5">
                    Verified Advisory
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
