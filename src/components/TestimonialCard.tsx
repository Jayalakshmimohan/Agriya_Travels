import React from 'react';
import { Star } from 'lucide-react';
import { Testimonial } from '../types';

interface TestimonialCardProps {
  t: Testimonial;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ t }) => {
  return (
    <div className="bg-theme-card rounded-[1.5rem] p-6 shadow-sm border border-theme-border flex flex-col h-full card-hover relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
         <Star className="h-16 w-16 fill-current text-theme-gold" />
      </div>
      <div className="flex text-theme-gold mb-4 relative z-10">
        {[...Array(t.rating || 5)].map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-current" />
        ))}
      </div>
      <p className="text-theme-muted text-xs italic mb-6 leading-relaxed flex-1 font-light relative z-10">"{t.content}"</p>
      <div className="mt-auto relative z-10 flex items-center gap-3">
        {t.avatarUrl ? (
          <img src={t.avatarUrl} alt={t.name} className="w-10 h-10 rounded-full bg-theme-navy/5 object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-theme-navy/5 flex items-center justify-center text-theme-heading font-serif font-bold text-xs uppercase">
             {t.name.charAt(0)}
          </div>
        )}
        <div>
          <h4 className="font-bold text-theme-heading text-xs">{t.name}</h4>
          <p className="text-[10px] text-theme-muted font-light">{t.location}</p>
        </div>
      </div>
    </div>
  );
}

export default TestimonialCard;
