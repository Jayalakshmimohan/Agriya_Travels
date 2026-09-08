import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Sparkles } from 'lucide-react';
import TravelAssistantChat from './TravelAssistantChat';
import { ASSISTANT_NAME } from '../data';

/**
 * Site-wide travel agent — named in ASSISTANT_NAME — reachable from every page.
 *
 * Bottom-right, because that is where people look for a chat launcher. An
 * earlier version put it bottom-left to avoid sitting beside the WhatsApp
 * bubble, which was tidy and wrong — someone hunting for "the chatbot" checks
 * one corner, does not find it, and concludes there isn't one. WhatsApp moved
 * to the left instead: discoverability of the primary entry point beats
 * symmetry between two secondary ones.
 */
export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  // Escape closes it, as with any dialog.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop is mobile-only: on desktop the panel is small enough
                that blocking the page behind it would be more annoying than
                helpful. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-sm sm:hidden"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-label={`${ASSISTANT_NAME}, the Agriya travel agent`}
              className="fixed z-[70] flex flex-col overflow-hidden rounded-3xl border border-theme-border bg-theme-bg shadow-2xl
                         inset-x-3 bottom-3 top-16
                         sm:inset-x-auto sm:top-auto sm:right-8 sm:bottom-44 sm:w-[420px] sm:h-[min(600px,68vh)]"
            >
              <header className="flex items-center justify-between gap-3 bg-theme-navy px-5 py-4 text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme-gold/20 text-theme-gold">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold font-serif leading-tight">{ASSISTANT_NAME}</p>
                    <p className="text-[10px] text-slate-300 flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> Travel agent · ask in your own words
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label={`Close ${ASSISTANT_NAME}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              {/* The panel scrolls, not the composer inside it. */}
              <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                <TravelAssistantChat compact />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Launcher */}
      <div className="fixed bottom-[120px] lg:bottom-6 right-4 lg:right-8 z-[60] group">
        {!isOpen && !hasOpened && (
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-theme-navy text-white text-xs font-bold rounded-lg shadow-lg opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap pointer-events-none">
            Plan a trip with {ASSISTANT_NAME}
          </div>
        )}

        <button
          onClick={() => setIsOpen((o) => !o)}
          aria-label={isOpen ? `Close ${ASSISTANT_NAME}` : `Open ${ASSISTANT_NAME}, the travel agent`}
          aria-expanded={isOpen}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_30px_rgba(11,42,58,0.45)] transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-theme-gold focus:ring-offset-2
            ${isOpen ? 'bg-theme-teal' : 'bg-theme-navy'}`}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <Bot className="h-7 w-7" />
              {/* One-time nudge that this is new; stops once opened. */}
              {!hasOpened && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-theme-gold opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-theme-gold border-2 border-white" />
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </>
  );
}
