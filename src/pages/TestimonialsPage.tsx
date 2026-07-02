import React, { useState } from 'react';
import { testimonials as initialTestimonials } from '../data';
import TestimonialCard from '../components/TestimonialCard';
import SEO from '../components/SEO';
import PageTransition from '../components/PageTransition';
import { Star } from 'lucide-react';
import { Testimonial } from '../types';

export default function TestimonialsPage() {
  const [testimonialsList, setTestimonialsList] = useState<Testimonial[]>(initialTestimonials);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    content: '',
    rating: 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newTestimonial: Testimonial = {
        id: `t-new-${Date.now()}`,
        name: formData.name,
        location: formData.location,
        content: formData.content,
        rating: formData.rating,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
      };
      
      setTestimonialsList([newTestimonial, ...testimonialsList]);
      setFormData({ name: '', location: '', content: '', rating: 5 });
      setIsSubmitting(false);
      setShowForm(false);
    }, 600);
  };

  return (
    <PageTransition>
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
          {!showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className="mt-8 px-6 py-3 bg-theme-gold text-theme-navy font-bold rounded-full hover:bg-yellow-400 transition-colors inline-flex items-center gap-2 text-sm"
            >
              Share Your Experience
            </button>
          )}
        </div>
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
        
        {showForm && (
          <div className="max-w-2xl mx-auto mb-16 bg-theme-card p-6 sm:p-8 rounded-2xl shadow-sm border border-theme-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-serif text-theme-heading">Leave a Review</h3>
              <button 
                onClick={() => setShowForm(false)}
                className="text-sm text-theme-muted hover:text-theme-heading font-medium"
              >
                Cancel
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-theme-heading uppercase tracking-wider mb-2">Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full rounded-xl border border-theme-border bg-theme-bg/50 px-4 py-3 text-sm focus:border-theme-gold focus:ring-1 focus:ring-theme-gold outline-none transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-xs font-bold text-theme-heading uppercase tracking-wider mb-2">Location / Tour</label>
                  <input
                    type="text"
                    id="location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full rounded-xl border border-theme-border bg-theme-bg/50 px-4 py-3 text-sm focus:border-theme-gold focus:ring-1 focus:ring-theme-gold outline-none transition-colors"
                    placeholder="e.g. Kerala, India"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-theme-heading uppercase tracking-wider mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({...formData, rating: star})}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`h-6 w-6 ${star <= formData.rating ? 'fill-theme-gold text-theme-gold' : 'text-slate-300'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label htmlFor="content" className="block text-xs font-bold text-theme-heading uppercase tracking-wider mb-2">Your Experience</label>
                <textarea
                  id="content"
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg/50 px-4 py-3 text-sm focus:border-theme-gold focus:ring-1 focus:ring-theme-gold outline-none transition-colors resize-none"
                  placeholder="Tell us about your trip..."
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-theme-gold hover:bg-yellow-400 text-theme-navy font-bold rounded-xl transition-colors mt-6 flex justify-center items-center"
              >
                {isSubmitting ? (
                  <span className="inline-block h-5 w-5 border-2 border-theme-navy/30 border-t-theme-navy rounded-full animate-spin"></span>
                ) : 'Submit Review'}
              </button>
            </form>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonialsList.map(t => (
             <TestimonialCard key={t.id} t={t} />
          ))}
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
