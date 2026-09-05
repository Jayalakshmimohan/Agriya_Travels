import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, FileText } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data';
import { recordLead } from '../lib/leads';

export default function QuickQuoteModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    budget: '',
    people: '2',
  });

  const [errors, setErrors] = useState({
    name: '',
    destination: '',
    budget: '',
    people: '',
  });

  const validateField = (fieldName: string, value: string) => {
    let error = '';
    
    if (fieldName === 'name') {
      const trimmed = value.trim();
      if (!trimmed) {
        error = 'Name is required';
      } else if (!/^[a-zA-Z\s'-]{2,50}$/.test(trimmed)) {
        error = 'Name must only contain letters, spaces, hyphens, or apostrophes';
      }
    }
    
    if (fieldName === 'destination') {
      const trimmed = value.trim();
      if (!trimmed) {
        error = 'Destination is required';
      } else if (trimmed.length > 100) {
        error = 'Max 100 characters';
      } else if (!/^[a-zA-Z0-9\s,.'()-]+$/.test(trimmed)) {
        error = 'Destination contains invalid characters';
      }
    }
    
    if (fieldName === 'people') {
      const num = parseInt(value, 10);
      if (!value) {
        error = 'Required';
      } else if (isNaN(num) || num < 1 || num > 500) {
        error = 'Must be 1-500';
      }
    }

    if (fieldName === 'budget') {
      const trimmed = value.trim();
      if (trimmed && trimmed.length > 50) {
        error = 'Max 50 characters';
      }
    }

    setErrors(prev => ({ ...prev, [fieldName]: error }));
    return error;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
    setFormData(prev => ({ ...prev, name: val }));
    validateField('name', val);
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, destination: e.target.value }));
    validateField('destination', e.target.value);
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, budget: e.target.value }));
    validateField('budget', e.target.value);
  };

  const handlePeopleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, people: val }));
    validateField('people', val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameErr = validateField('name', formData.name);
    const destErr = validateField('destination', formData.destination);
    const peopleErr = validateField('people', formData.people);
    const budgetErr = validateField('budget', formData.budget);

    if (nameErr || destErr || peopleErr || budgetErr) {
      return;
    }

    recordLead({
      source: 'quick_quote',
      name: formData.name,
      destination: formData.destination,
      budget: formData.budget,
      travellers: formData.people,
    });

    const message = `Hi Agriya Travels! Quick Quote Request:\n\nName: ${formData.name}\nDestination: ${formData.destination}\nBudget: ${formData.budget || 'Not specified'}\nPeople: ${formData.people}\n\nPlease share options and pricing.`;
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
    setFormData({ name: '', destination: '', budget: '', people: '2' });
    setErrors({ name: '', destination: '', budget: '', people: '' });
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
              onClick={() => {
                setIsOpen(false);
                setErrors({ name: '', destination: '', budget: '', people: '' });
              }}
              className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              className="fixed bottom-0 left-0 right-0 z-[70] m-4 sm:bottom-20 sm:left-4 sm:right-auto sm:m-0 sm:w-80 rounded-2xl bg-theme-card p-6 shadow-2xl border border-theme-border/60"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/logo.png"
                    alt="Agriya Travels"
                    className="h-8 w-8 object-contain rounded-lg bg-white p-0.5 shadow-xs border border-theme-border/40 shrink-0"
                  />
                  <div>
                    <h3 className="text-base font-bold text-theme-heading font-serif leading-tight">Quick Quote</h3>
                    <p className="text-[10px] text-theme-muted">Agriya Travels</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setErrors({ name: '', destination: '', budget: '', people: '' });
                  }}
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
                    className={`w-full rounded-lg border bg-theme-card px-4 py-2.5 text-sm focus:bg-theme-card focus:outline-none transition-all ${
                      errors.name 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-theme-border focus:border-theme-gold'
                    }`}
                    value={formData.name}
                    onChange={handleNameChange}
                  />
                  {errors.name && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">⚠️ {errors.name}</p>
                  )}
                </div>
                <div>
                  <input
                    required
                    type="text"
                    placeholder="Where to?"
                    className={`w-full rounded-lg border bg-theme-card px-4 py-2.5 text-sm focus:bg-theme-card focus:outline-none transition-all ${
                      errors.destination 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-theme-border focus:border-theme-gold'
                    }`}
                    value={formData.destination}
                    onChange={handleDestinationChange}
                  />
                  {errors.destination && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">⚠️ {errors.destination}</p>
                  )}
                </div>
                <div className="flex gap-2 items-start">
                   <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Budget"
                      className={`w-full rounded-lg border bg-theme-card px-4 py-2.5 text-sm focus:bg-theme-card focus:outline-none transition-all ${
                        errors.budget 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-theme-border focus:border-theme-gold'
                      }`}
                      value={formData.budget}
                      onChange={handleBudgetChange}
                    />
                    {errors.budget && (
                      <p className="mt-1 text-[11px] text-red-500 font-medium">⚠️ {errors.budget}</p>
                    )}
                  </div>
                  <div className="w-24">
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="Pax"
                      className={`w-full rounded-lg border bg-theme-card px-4 py-2.5 text-sm focus:bg-theme-card focus:outline-none transition-all ${
                        errors.people 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-theme-border focus:border-theme-gold'
                      }`}
                      value={formData.people}
                      onChange={handlePeopleChange}
                    />
                    {errors.people && (
                      <p className="mt-1 text-[11px] text-red-500 font-medium">⚠️ {errors.people}</p>
                    )}
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
