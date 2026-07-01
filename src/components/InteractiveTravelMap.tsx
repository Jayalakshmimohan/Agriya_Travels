import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Plane, Clock, Users, ArrowRight, X, Sparkles, CloudSun, Thermometer, Calendar, Shirt, Share2, Check } from 'lucide-react';
import { tourPackages, WHATSAPP_NUMBER } from '../data';
import { useCurrency } from '../context/CurrencyContext';

interface Pin {
  id: string; // package ID
  name: string;
  x: number; // SVG X coordinate
  y: number; // SVG Y coordinate
  category: 'India' | 'International';
}

const PINS: Pin[] = [
  { id: 'ind-2', name: 'Kashmir', x: 390, y: 110, category: 'India' },
  { id: 'ind-5', name: 'Rajasthan', x: 330, y: 195, category: 'India' },
  { id: 'ind-4', name: 'Goa', x: 370, y: 280, category: 'India' },
  { id: 'ind-1', name: 'Kerala', x: 395, y: 340, category: 'India' },
  { id: 'ind-6', name: 'Tirupati', x: 412, y: 258, category: 'India' },
  { id: 'ind-3', name: 'Tamil Nadu Temples', x: 428, y: 315, category: 'India' },
  { id: 'int-1', name: 'Dubai', x: 195, y: 205, category: 'International' },
  { id: 'int-5', name: 'Maldives', x: 345, y: 395, category: 'International' },
  { id: 'int-3', name: 'Thailand', x: 575, y: 285, category: 'International' },
  { id: 'int-2', name: 'Singapore', x: 620, y: 350, category: 'International' },
];

export default function InteractiveTravelMap() {
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [hoveredPin, setHoveredPin] = useState<Pin | null>(null);
  const [copied, setCopied] = useState(false);
  const { currency } = useCurrency();

  const activePackage = selectedPin ? tourPackages.find(p => p.id === selectedPin.id) : null;

  const handleCopyLink = async (pkgId: string) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('package', pkgId);
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const getPrice = (priceStr: string) => {
    const numMatch = priceStr.match(/[\d,]+/);
    if (numMatch && priceStr !== 'Varies' && !priceStr.includes('Custom')) {
      const num = parseInt(numMatch[0].replace(/,/g, ''), 10);
      if (currency === 'USD') {
        return `$${Math.round(num / 83).toLocaleString('en-US')}`;
      } else if (currency === 'EUR') {
        return `€${Math.round(num / 90).toLocaleString('en-US')}`;
      } else {
        return `₹${num.toLocaleString('en-IN')}`;
      }
    }
    return priceStr;
  };

  return (
    <section className="bg-theme-card border border-theme-border rounded-[2.5rem] p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-theme-teal/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-theme-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-theme-gold flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3 w-3" /> Chennai Departure Hub Map
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-theme-heading leading-tight">
            Interactive Travel Map
          </h2>
          <p className="text-xs sm:text-sm text-theme-muted font-light mt-1">
            See how Agriya Travels connects you from Chennai to premium destinations. Click any pulsing pin to view details!
          </p>
        </div>
        
        {/* Map Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold bg-theme-navy/5 px-4 py-2 rounded-xl border border-theme-border shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-theme-gold animate-ping" />
            <span className="text-theme-heading font-serif">Chennai Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-theme-teal" />
            <span className="text-theme-muted">Domestic Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-theme-accent" />
            <span className="text-theme-muted">International Route</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[8/5] min-h-[300px] bg-theme-navy/5 border border-theme-border/60 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
        {/* SVG Map Base */}
        <svg 
          viewBox="0 0 800 500" 
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-theme-border/30" />
            </pattern>
            <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Compass / Visual Accent */}
          <g transform="translate(80, 420)" className="opacity-25 text-theme-muted">
            <circle r="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="-35" y1="0" x2="35" y2="0" stroke="currentColor" strokeWidth="1" />
            <line x1="0" y1="-35" x2="0" y2="35" stroke="currentColor" strokeWidth="1" />
            <polygon points="0,-25 4,0 0,4 -4,0" fill="currentColor" />
            <text x="10" y="-15" className="text-[10px] font-bold font-mono">N</text>
          </g>

          {/* Stylized Continent/Country Outlines for visual reference */}
          {/* India Peninsula Accent Outline */}
          <path 
            d="M 330,120 L 390,100 L 450,110 L 460,180 L 490,210 L 480,240 L 450,280 L 420,380 L 390,320 L 370,290 L 330,230 Z" 
            fill="currentColor" 
            className="text-theme-teal/5" 
          />
          {/* Arabian Peninsula Accent Outline */}
          <path 
            d="M 120,180 L 210,190 L 220,240 L 190,280 L 140,260 Z" 
            fill="currentColor" 
            className="text-theme-teal/5" 
          />
          {/* Southeast Asia Accent Outline */}
          <path 
            d="M 550,230 L 600,260 L 640,310 L 630,370 L 610,360 L 590,320 L 550,280 Z" 
            fill="currentColor" 
            className="text-theme-teal/5" 
          />

          {/* Connection Curves from Chennai (X: 420, Y: 290) to destinations */}
          {PINS.map(pin => {
            const isInt = pin.category === 'International';
            return (
              <g key={`route-${pin.id}`}>
                <path
                  d={`M 420,290 Q ${(420 + pin.x) / 2},${Math.min(290, pin.y) - 40} ${pin.x},${pin.y}`}
                  fill="none"
                  stroke={isInt ? 'var(--color-theme-accent, #ff4d4f)' : 'var(--color-theme-teal, #1d3557)'}
                  strokeWidth="1.5"
                  strokeOpacity={hoveredPin?.id === pin.id || selectedPin?.id === pin.id ? "0.8" : "0.2"}
                  strokeDasharray={hoveredPin?.id === pin.id || selectedPin?.id === pin.id ? "none" : "5, 5"}
                  className="transition-all duration-300"
                />
                {(hoveredPin?.id === pin.id || selectedPin?.id === pin.id) && (
                  <circle r="4" fill="currentColor" className={isInt ? 'text-theme-accent' : 'text-theme-teal'}>
                    <animateMotion
                      path={`M 420,290 Q ${(420 + pin.x) / 2},${Math.min(290, pin.y) - 40} ${pin.x},${pin.y}`}
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Central Hub Glow */}
          <circle cx="420" cy="290" r="30" fill="url(#hubGlow)" />
          {/* Chennai Central Hub Pin */}
          <g transform="translate(420, 290)">
            <circle r="10" fill="#d4af37" className="opacity-30 animate-ping" />
            <circle r="6" fill="#d4af37" />
            <circle r="3" fill="#1d3557" />
          </g>

          {/* Pins */}
          {PINS.map(pin => {
            const isSelected = selectedPin?.id === pin.id;
            const isHovered = hoveredPin?.id === pin.id;
            const isInt = pin.category === 'International';
            
            return (
              <g 
                key={pin.id}
                transform={`translate(${pin.x}, ${pin.y})`}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredPin(pin)}
                onMouseLeave={() => setHoveredPin(null)}
                onClick={() => setSelectedPin(pin)}
              >
                {/* Active radar pulses */}
                <circle 
                  r={isHovered || isSelected ? "14" : "8"} 
                  className={`opacity-30 transition-all duration-300 ${isInt ? 'fill-theme-accent text-theme-accent' : 'fill-theme-teal text-theme-teal'} ${isHovered || isSelected ? 'animate-pulse' : ''}`} 
                />
                <circle 
                  r={isHovered || isSelected ? "8" : "4"} 
                  className={`transition-all duration-300 ${isInt ? 'fill-theme-accent text-white' : 'fill-theme-teal text-theme-gold'}`} 
                />
                
                {/* Micro pins inside */}
                <circle r="2" fill="currentColor" className="text-white" />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPin && (
          <div 
            className="absolute bg-theme-card/95 border border-theme-border px-3 py-1.5 rounded-xl shadow-lg text-[11px] font-bold text-theme-heading backdrop-blur-md flex items-center gap-1.5"
            style={{
              left: `${(hoveredPin.x / 800) * 100}%`,
              top: `${(hoveredPin.y / 500) * 100 - 12}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <MapPin className="h-3 w-3 text-theme-gold shrink-0" />
            {hoveredPin.name}
          </div>
        )}

        {/* Map Label overlays */}
        <div className="absolute top-4 left-6 text-[10px] font-mono text-theme-muted flex flex-col gap-1">
          <span>LAT RANGE: 5° N - 35° N</span>
          <span>LNG RANGE: 40° E - 110° E</span>
        </div>
      </div>

      {/* Package Detail Modal Overlay */}
      <AnimatePresence>
        {selectedPin && activePackage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-theme-navy/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                  onClick={() => handleCopyLink(activePackage.id)}
                  className="bg-white/50 hover:bg-white/90 backdrop-blur-sm p-2 rounded-full text-theme-navy transition-colors focus:outline-none"
                  title="Copy Link"
                >
                  {copied ? <Check className="h-5 w-5 text-green-600" /> : <Share2 className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setSelectedPin(null)}
                  className="bg-white/50 hover:bg-white/90 backdrop-blur-sm p-2 rounded-full text-theme-navy transition-colors focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="h-48 sm:h-56 relative shrink-0">
                <img
                  src={activePackage.imageUrl}
                  alt={activePackage.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-theme-navy/90 to-transparent flex flex-col justify-end p-6">
                  <div className="flex items-center gap-1 text-xs uppercase tracking-widest font-bold text-theme-gold mb-2">
                    <MapPin className="h-4 w-4" />
                    {activePackage.category} Package
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white leading-tight">{activePackage.title}</h3>
                </div>
              </div>

              <div className="p-6 overflow-y-auto">
                <p className="text-sm text-theme-muted font-light leading-relaxed mb-6">
                  {activePackage.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-theme-gold" /> Duration
                    </div>
                    <div className="text-sm font-bold text-theme-heading">{activePackage.duration}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-theme-gold" /> Ideal For
                    </div>
                    <div className="text-sm font-bold text-theme-heading">{activePackage.bestFor}</div>
                  </div>
                </div>

                {activePackage.weatherInfo && (
                  <div className="bg-theme-navy/5 p-5 rounded-2xl border border-theme-border/50 mb-6">
                    <h4 className="text-sm font-bold text-theme-heading mb-4 flex items-center gap-2">
                      <CloudSun className="h-4 w-4 text-theme-teal" /> 
                      Weather Predictor & Tips
                    </h4>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <Thermometer className="h-4 w-4 text-theme-muted shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-theme-muted">Historical Weather</div>
                          <div className="text-xs font-medium text-theme-heading">{activePackage.weatherInfo.historical}</div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Calendar className="h-4 w-4 text-theme-muted shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-theme-muted">Best Months to Visit</div>
                          <div className="text-xs font-medium text-theme-heading">{activePackage.weatherInfo.bestMonths}</div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Shirt className="h-4 w-4 text-theme-muted shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-theme-muted">Clothing Suggestions</div>
                          <div className="text-xs font-medium text-theme-heading">{activePackage.weatherInfo.clothing}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-auto">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Starting Price</div>
                    <div className="text-2xl font-bold text-[#E63946]">{getPrice(activePackage.startingPrice)}</div>
                  </div>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Agriya Travels, I clicked the map pin and am interested in the ${activePackage.title} package. Please share details!`)}`}
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
    </section>
  );
}
