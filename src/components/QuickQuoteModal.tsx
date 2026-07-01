import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, FileText } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data';

export default function QuickQuoteModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    budget: '',
    people: '2',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `Hi Agriya Travels! Quick Quote Request:\n\nName: ${formData.name}\nDestination: ${formData.destination}\nBudget: ${formData.budget || 'Not specified'}\nPeople: ${formData.people}\n\nPlease share options and pricing.`;
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
    setFormData({ name: '', destination: '', budget: '', people: '2' });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[80px] lg:bottom-6 left-4 lg:left-8 z-[60] flex items-center justify-center gap-2 rounded-full bg-theme-gold px-4 py-3 text-sm font-bold text-theme-heading shadow-[0_8px_30px_rgb(212,175,55,0.4)] transition-all hover:scale-105 focus:outline-none"
        aria-label="Quick Quote"
      >
        <FileText className="h-5 w-5" />
        <span>Quick Quote</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              className="fixed bottom-0 left-0 right-0 z-[70] m-4 sm:bottom-20 sm:left-4 sm:right-auto sm:m-0 sm:w-80 rounded-2xl bg-theme-card p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-theme-heading font-serif">Quick Quote</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-theme-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    required
                    type="text"
                    placeholder="Your Name"
                    className="w-full rounded-lg border border-theme-border bg-theme-card px-4 py-2.5 text-sm focus:border-theme-gold focus:bg-theme-card focus:outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <input
                    required
                    type="text"
                    placeholder="Where to?"
                    className="w-full rounded-lg border border-theme-border bg-theme-card px-4 py-2.5 text-sm focus:border-theme-gold focus:bg-theme-card focus:outline-none"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                   <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Budget"
                      className="w-full rounded-lg border border-theme-border bg-theme-card px-4 py-2.5 text-sm focus:border-theme-gold focus:bg-theme-card focus:outline-none"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    />
                  </div>
                  <div className="w-24">
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="Pax"
                      className="w-full rounded-lg border border-theme-border bg-theme-card px-4 py-2.5 text-sm focus:border-theme-gold focus:bg-theme-card focus:outline-none"
                      value={formData.people}
                      onChange={(e) => setFormData({ ...formData, people: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-theme-navy px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 focus:outline-none"
                >
                  <Send className="h-4 w-4" />
                  Get Quote on WA
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
