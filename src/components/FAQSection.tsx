import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "How do I book a tour package with Agriya Travels?",
    answer: "Booking is simple. You can reach out to us via WhatsApp, call our office, or use the 'Quick Quote' button on our website. Our travel experts will discuss your requirements, customize the itinerary if needed, and guide you through a seamless booking process."
  },
  {
    question: "Do you provide visa assistance for international trips?",
    answer: "Yes, we offer end-to-end visa assistance for all our outbound international holidays. From document collation and application processing to interview prep, our team ensures a hassle-free visa experience."
  },
  {
    question: "What are your payment policies and terms?",
    answer: "We believe in complete transparency. Typically, a nominal advance is required to confirm your booking, with the balance payable closer to the departure date. Detailed payment schedules and cancellation policies are provided upfront with every quotation."
  },
  {
    question: "Can I customize a package to suit my specific needs or budget?",
    answer: "Absolutely. Most of our itineraries serve as a baseline. We specialize in tailoring trips - from adjusting hotel categories and transit modes to adding niche local experiences. Every journey is designed around your preferences."
  },
  {
    question: "Is there 24/7 support available during the trip?",
    answer: "Yes. Once your journey begins, our dedicated operations team and local representatives remain available 24/7 to ensure your safety and comfort, promptly addressing any on-ground requirements."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-theme-card rounded-[2rem] p-8 sm:p-10 shadow-sm border border-theme-border flex flex-col gap-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-theme-card rounded-bl-[100%] pointer-events-none" />
      <div className="relative z-10 text-center mb-2">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-theme-heading mb-2">Frequently Asked Questions</h2>
        <p className="text-xs sm:text-sm text-theme-muted font-light max-w-2xl mx-auto">
          Everything you need to know before you embark on your next unforgettable journey.
        </p>
      </div>

      <div className="relative z-10 w-full space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-theme-gold/30 bg-theme-card shadow-sm' : 'border-theme-border bg-theme-card hover:border-theme-gold/50'}`}
            >
              <button
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus:outline-none"
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className="font-bold text-theme-heading text-xs sm:text-sm pr-4">{faq.question}</span>
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-theme-gold text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="p-4 sm:p-5 pt-0 text-[11px] sm:text-xs text-theme-muted font-light leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
