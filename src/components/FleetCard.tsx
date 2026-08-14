import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronLeft, ChevronRight, Images } from 'lucide-react';

export interface FleetOption {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  images: string[];
}

interface FleetCardProps {
  key?: React.Key;
  fleet: FleetOption;
  isSelected: boolean;
  onSelect: () => void;
}

export default function FleetCard({
  fleet,
  isSelected,
  onSelect
}: FleetCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isHovered && fleet.images.length > 1) {
      timerRef.current = window.setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % fleet.images.length);
      }, 1500);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isHovered, fleet.images.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? fleet.images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % fleet.images.length);
  };

  const handleDotClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setCurrentIndex(idx);
  };

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentIndex(0);
      }}
      className={`group relative flex flex-col gap-2 text-left rounded-2xl p-2.5 transition-all duration-300 border cursor-pointer select-none ${
        isSelected
          ? 'border-theme-gold bg-theme-gold/10 shadow-lg ring-2 ring-theme-gold/40 -translate-y-0.5'
          : 'border-theme-border/60 hover:border-theme-gold/40 hover:bg-theme-navy/5 hover:shadow-md'
      }`}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden w-full bg-slate-900 shadow-inner">
        {fleet.images.map((img, idx) => (
          <img
            key={img}
            src={img}
            alt={`${fleet.title} - View ${idx + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
              idx === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          />
        ))}

        {/* Selected badge */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-theme-gold text-slate-950 p-1.5 rounded-full shadow-md z-10 animate-scaleIn">
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </div>
        )}

        {/* Multi-image indicator count */}
        {fleet.images.length > 1 && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 z-10 border border-white/10">
            <Images className="h-3 w-3 text-theme-gold" />
            <span>{currentIndex + 1}/{fleet.images.length}</span>
          </div>
        )}

        {/* Interactive hover navigation arrows */}
        {fleet.images.length > 1 && (
          <div className={`absolute inset-y-0 inset-x-1 flex items-center justify-between pointer-events-none z-10 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <button
              type="button"
              onClick={handlePrev}
              className="pointer-events-auto h-7 w-7 rounded-full bg-black/70 backdrop-blur-sm text-white flex items-center justify-center hover:bg-theme-gold hover:text-slate-950 transition-all shadow-md cursor-pointer"
              aria-label="Previous vehicle photo"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="pointer-events-auto h-7 w-7 rounded-full bg-black/70 backdrop-blur-sm text-white flex items-center justify-center hover:bg-theme-gold hover:text-slate-950 transition-all shadow-md cursor-pointer"
              aria-label="Next vehicle photo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Dot indicators */}
        {fleet.images.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 z-10">
            {fleet.images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleDotClick(e, idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer p-0 border-0 ${
                  idx === currentIndex
                    ? 'w-4 bg-theme-gold shadow'
                    : 'w-1.5 bg-white/60 hover:bg-white backdrop-blur-xs'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="text-center pt-0.5">
        <span className="text-xs font-bold text-theme-heading block">
          {fleet.title}
        </span>
        <span className="text-[11px] font-light text-theme-muted block mt-0.5">
          {fleet.subtitle}
        </span>
      </div>
    </div>
  );
}
