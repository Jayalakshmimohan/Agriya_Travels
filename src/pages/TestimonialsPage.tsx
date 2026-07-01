import React from 'react';
import { testimonials } from '../data';
import TestimonialCard from '../components/TestimonialCard';
import SEO from '../components/SEO';

export default function TestimonialsPage() {
  return (
    <>
      <SEO 
        title="Testimonials" 
        description="Read what our happy travelers have to say about their unforgettable experiences with Agriya Travels."
        keywords="Agriya Travels reviews, travel testimonials, customer feedback"
      />
      <div className="bg-theme-card min-h-screen pb-24">
      <div className="bg-theme-navy text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-theme-gold/10 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl font-bold font-serif text-white sm:text-5xl">Traveler Testimonials</h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 font-light max-w-2xl mx-auto">
            Read what our happy travelers have to say about their experiences with us.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map(t => (
             <TestimonialCard key={t.id} t={t} />
          ))}
          {/* Duplicating for layout sake if needed, or keeping it real */}
        </div>
      </div>
    </div>
    </>
  );
}
