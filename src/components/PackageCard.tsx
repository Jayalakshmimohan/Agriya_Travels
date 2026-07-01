import React, { useState } from 'react';
import { Clock, Users, MapPin, X } from 'lucide-react';
import { TourPackage } from '../types';
import { WHATSAPP_NUMBER } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface PackageCardProps {
  pkg: TourPackage;
  displayCurrency?: 'INR' | 'USD' | 'EUR';
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, displayCurrency = 'INR' }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Agriya Travels, I am interested in the ${pkg.title} package. Please share details.`)}`;

  let displayPrice = pkg.startingPrice;
  const numMatch = pkg.startingPrice.match(/[\d,]+/);
  if (numMatch && pkg.startingPrice !== 'Varies' && !pkg.startingPrice.includes('Custom')) {
    const num = parseInt(numMatch[0].replace(/,/g, ''), 10);
    if (displayCurrency === 'USD') {
      const usdValue = Math.round(num / 83);
      displayPrice = `$${usdValue.toLocaleString('en-US')}`;
    } else if (displayCurrency === 'EUR') {
      const eurValue = Math.round(num / 90);
      displayPrice = `€${eurValue.toLocaleString('en-US')}`;
    } else {
      displayPrice = `₹${num.toLocaleString('en-IN')}`;
    }
  }

  return (
    <>
    <div className="bg-theme-card rounded-[1.5rem] overflow-hidden shadow-sm border border-theme-border card-hover flex flex-col group h-full">
      <div className="h-40 sm:h-48 relative bg-slate-200 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse z-[15]" />
        )}
        <div className="absolute inset-0 bg-theme-navy/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
        <img
          src={pkg.imageUrl}
          alt={pkg.title}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
        />
        <div className={`absolute top-3 right-3 bg-theme-card/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-theme-heading shadow-lg z-20 flex items-center gap-1.5 ring-1 ring-black/5 transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <Clock className="h-3 w-3 text-theme-gold" />
          {pkg.duration}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between relative z-20 bg-theme-card">
        <div className="mb-4">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] font-bold text-theme-gold mb-2">
            <MapPin className="h-3 w-3" />
            {pkg.category}
          </div>
          <h4 className="text-base sm:text-lg font-serif font-bold leading-tight text-theme-heading mb-2 group-hover:text-theme-teal transition-colors">{pkg.title}</h4>
          <p className="text-xs text-theme-muted line-clamp-2 leading-relaxed font-light">{pkg.description}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4 text-[11px] text-theme-muted border-y border-theme-border py-3">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-theme-gold" />
            <span className="truncate font-medium">{pkg.bestFor}</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold bg-[#F1FAEE] text-theme-teal px-2 py-0.5 rounded-md truncate">Customizable</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Starting from</span>
            <div className="text-sm font-bold text-[#E63946]">{displayPrice}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQuickViewOpen(true)}
              className="flex items-center gap-1.5 bg-theme-navy/5 text-theme-navy px-4 py-2.5 rounded-full text-[11px] font-bold hover:bg-theme-navy/10 transition-colors"
            >
              Quick View
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-theme-navy text-theme-gold px-5 py-2.5 rounded-full text-[11px] font-bold shadow-md hover:bg-theme-teal transition-all hover:-translate-y-0.5"
            >
              Enquire
            </a>
          </div>
        </div>
      </div>
    </div>

    <AnimatePresence>
      {isQuickViewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-theme-navy/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
          >
            <button
              onClick={() => setIsQuickViewOpen(false)}
              className="absolute top-4 right-4 z-10 bg-white/50 hover:bg-white/90 backdrop-blur-sm p-2 rounded-full text-theme-navy transition-colors focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="h-48 sm:h-56 relative shrink-0">
              <img
                src={pkg.imageUrl}
                alt={pkg.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-theme-navy/90 to-transparent flex flex-col justify-end p-6">
                <div className="flex items-center gap-1 text-xs uppercase tracking-widest font-bold text-theme-gold mb-2">
                  <MapPin className="h-4 w-4" />
                  {pkg.category}
                </div>
                <h3 className="text-2xl font-serif font-bold text-white leading-tight">{pkg.title}</h3>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-theme-muted font-light leading-relaxed mb-6">
                {pkg.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Duration</div>
                  <div className="text-sm font-bold text-theme-heading">{pkg.duration}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Ideal For</div>
                  <div className="text-sm font-bold text-theme-heading">{pkg.bestFor}</div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-auto">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Starting Price</div>
                  <div className="text-2xl font-bold text-[#E63946]">{displayPrice}</div>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-theme-navy hover:bg-theme-teal text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg shadow-theme-navy/20 transition-all hover:-translate-y-0.5 whitespace-nowrap"
                >
                  Book Now
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}

export default PackageCard;
