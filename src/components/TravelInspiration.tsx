import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, HelpCircle, Compass, RotateCw, MapPin, Users, Calendar, CloudSun, Thermometer, Shirt, Phone, CheckCircle2, Download, Check, AlertCircle, Heart } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

interface InspirationDest {
  id: string;
  name: string;
  type: 'gem' | 'trending' | 'underrated';
  desc: string;
  image: string;
  historicalWeather: string;
  bestMonths: string;
  clothing: string;
  highlights: string[];
  itineraryPattern: string[];
}

const INSPIRATION_DESTINATIONS: InspirationDest[] = [
  {
    id: 'insp-1',
    name: 'Gokarna',
    type: 'gem',
    desc: 'Unspoiled coastal beauty with pristine beaches, peaceful temple towns, and stunning cliffside sunsets.',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800',
    historicalWeather: '22°C - 33°C',
    bestMonths: 'October to March',
    clothing: 'Casual beachwear, light cotton clothing, hats, and sunglasses.',
    highlights: ['Om Beach cliff walk', 'Mahabaleshwar Temple visit', 'Beachside stargazing & bonfire'],
    itineraryPattern: ['Arrival in Gokarna, beach trekking to Half Moon Beach', 'Water sports at Om Beach & organic café hopping', 'Spiritual exploration of ancient town temples', 'Scenic travel back with beach memories']
  },
  {
    id: 'insp-2',
    name: 'Spiti Valley',
    type: 'gem',
    desc: 'A mesmerizing high-altitude cold desert with medieval monasteries, remote villages, and rugged landscapes.',
    image: 'https://images.unsplash.com/photo-1746093846930-ab89242b9fb9?auto=format&fit=crop&q=80&w=800',
    historicalWeather: '-10°C to 15°C',
    bestMonths: 'June to September',
    clothing: 'Heavy woolens, windproof jackets, thermal innerwear, and trekking shoes.',
    highlights: ['Key Monastery exploration', 'Drive through the world\'s highest post office', 'Stunning sights of Chandra Taal Lake'],
    itineraryPattern: ['Acclimatization day in Kaza, local village walks', 'Guided tour of the spectacular Key Monastery & Kibber village', 'High-altitude drive to Hikkim & Langza', 'Starry camping at the pristine Chandra Taal lake']
  },
  {
    id: 'insp-3',
    name: 'Ziro Valley',
    type: 'gem',
    desc: 'Misty hills and paddy fields of Arunachal Pradesh, rich in tribal folklore, music, and organic living.',
    image: 'https://images.unsplash.com/photo-1610147323479-a7fb11ffd5dd?auto=format&fit=crop&q=80&w=800',
    historicalWeather: '10°C - 24°C',
    bestMonths: 'September to November (or March to May)',
    clothing: 'Comfortable layers, light sweater/jacket, and sturdy walking boots.',
    highlights: ['Cultural homestays with Apatani tribe', 'Pine-clad hill trekking', 'Traditional organic farm lunch'],
    itineraryPattern: ['Arrival in Ziro, traditional welcome drink in pine cottage', 'Walk through unique Apatani tribal villages', 'Hiking up Talley Valley Wildlife Sanctuary', 'Local wine tasting & musical evening']
  },
  {
    id: 'insp-4',
    name: 'Kashmir',
    type: 'trending',
    desc: 'The timeless paradise on earth, with romantic houseboats, glowing tulip gardens, and snow-filled valleys.',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=800',
    historicalWeather: '-2°C to 22°C',
    bestMonths: 'March to August',
    clothing: 'Warm layers, gloves and thick socks in winter, light woolens for summer.',
    highlights: ['Shikara ride on pristine Dal Lake', 'Gondola ride in snow-bound Gulmarg', 'Lush saffron field tours in Pampore'],
    itineraryPattern: ['Houseboat check-in, sunset Shikara ride on Dal Lake', 'Excursion to the alpine meadows of Gulmarg', 'Srinagar local sightseeing - Mughal Gardens', 'Pahalgam scenic valley exploration']
  },
  {
    id: 'insp-5',
    name: 'Kerala Backwaters',
    type: 'trending',
    desc: 'Lush green landscapes, serene backwater channels, and luxury houseboats under coconut groves.',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=800',
    historicalWeather: '24°C - 32°C',
    bestMonths: 'September to March',
    clothing: 'Light linen/cotton clothing, sunblock, mosquito repellent.',
    highlights: ['Overnight houseboat cruise', 'Spice plantation safari', 'Traditional Kathakali performance'],
    itineraryPattern: ['Arrive in Kochi, drive to Munnar spice hills', 'Scenic tea estate tours & waterfall walks', 'Board private luxury houseboat in Kumarakom', 'Relaxing Ayurvedic massage & departures']
  },
  {
    id: 'insp-6',
    name: 'Bali, Indonesia',
    type: 'trending',
    desc: 'Tropical beaches, emerald rice terraces, and mesmerizing cliff temples on this exotic island.',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
    historicalWeather: '25°C - 31°C',
    bestMonths: 'April to October',
    clothing: 'Summer beachwear, modest clothing for temple entries (Sarong provided).',
    highlights: ['Ubud rainforest swing', 'Uluwatu sunset cliff temple', 'Snorkeling in crystal clear Nusa Penida'],
    itineraryPattern: ['Arrival in Bali, private resort transfer in Ubud', 'Ubud Art Market & sacred monkey forest sanctuary', 'Scenic tour to Tegalalang rice terrace & water temple', 'Nusa Penida island day-trip & seaside dinner']
  },
  {
    id: 'insp-7',
    name: 'Hampi',
    type: 'underrated',
    desc: 'A surreal landscape of monolithic boulders and ruins of the majestic 14th-century Vijayanagara Empire.',
    image: 'https://images.unsplash.com/photo-1722934804353-0d9f6a55ab5e?auto=format&fit=crop&q=80&w=800',
    historicalWeather: '20°C - 38°C',
    bestMonths: 'October to February',
    clothing: 'Light cotton wear, sun hats, highly comfortable walking shoes.',
    highlights: ['Virupaksha Temple sunset', 'Coracle boat ride on Tungabhadra River', 'Bouldering & cycle tours'],
    itineraryPattern: ['Check-in at heritage resort, walking tour of Hampi Bazaar', 'Cycle tour of Royal Enclosure & Lotus Mahal', 'Coracle boat crossing to Anegundi old village', 'Hampi ruins sunrise, departure via Hospet']
  },
  {
    id: 'insp-8',
    name: 'Meghalaya',
    type: 'underrated',
    desc: 'The magical abode of clouds, home to living root bridges, pristine clear rivers, and the wettest places on earth.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    historicalWeather: '12°C - 24°C',
    bestMonths: 'October to April',
    clothing: 'Waterproof jackets, umbrellas, light woolens, and trekking shoes.',
    highlights: ['Double Decker Living Root Bridge trek', 'Boating on crystal clear Umngot River', 'Spelunking in mystical limestone caves'],
    itineraryPattern: ['Arrive in Shillong, local cafes & ward lake walk', 'Drive to Cherrapunji, majestic Nohkalikai waterfalls visit', 'Trek to Double Decker Root Bridge in Nongriat', 'Boating in Dawki border river, departure']
  },
  {
    id: 'insp-9',
    name: 'Coorg',
    type: 'underrated',
    desc: 'The Scotland of India, famed for mist-covered coffee hills, gushing waterfalls, and delicious Kodava cuisine.',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800',
    historicalWeather: '15°C - 28°C',
    bestMonths: 'October to March',
    clothing: 'Comfortable light woolens for mornings, cotton wear for days.',
    highlights: ['Coffee plantation estate tour', 'Dubare Elephant Camp interaction', 'Spectacular sunset views at Raja\'s Seat'],
    itineraryPattern: ['Resort check-in, premium coffee estate walk', 'Visit Abbey Falls & Namdroling Buddhist Golden Temple', 'Elephant bathing at Dubare Camp, sunset at Raja\'s Seat', 'Spice shopping and travel back with fresh memories']
  }
];

export default function TravelInspiration() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'gem' | 'trending' | 'underrated'>('all');
  const [selectedDest, setSelectedDest] = useState<InspirationDest | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  // Form states for tailoring the package
  const [formData, setFormData] = useState({
    days: '5',
    persons: '2',
    budget: 'Moderate',
    startCity: 'Chennai',
    specialRequests: ''
  });

  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredResult, setTailoredResult] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const tailoredRef = useRef<HTMLDivElement>(null);

  // Filtered list
  const filteredDestinations = INSPIRATION_DESTINATIONS.filter(
    dest => selectedCategory === 'all' || dest.type === selectedCategory
  );

  // Handle Wheel Spin
  const spinTheWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setCelebrate(false);
    setSelectedDest(null);
    setTailoredResult(null);

    // Random spin angle between 5 and 8 full rotations + random angle
    const extraRotations = 5 + Math.floor(Math.random() * 4);
    const targetDeg = extraRotations * 360 + Math.floor(Math.random() * 360);
    const newDeg = spinDeg + targetDeg;
    setSpinDeg(newDeg);

    setTimeout(() => {
      setIsSpinning(false);
      setCelebrate(true);
      
      // Calculate which of the 9 segments the pointer landed on.
      // 360 degrees / 9 segments = 40 degrees per segment.
      // Offset by 20 to align segment centers with pointer.
      const normalizedDeg = newDeg % 360;
      const index = Math.floor(((360 - normalizedDeg) / 40) % 9);
      const landedDest = INSPIRATION_DESTINATIONS[index < 0 ? index + 9 : index];
      setSelectedDest(landedDest);
    }, 4000);
  };

  // Generate Tailored Package
  const handleGenerateTailored = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDest) return;
    setIsTailoring(true);
    setTailoredResult(null);

    setTimeout(() => {
      const days = parseInt(formData.days) || 5;
      const p = parseInt(formData.persons) || 2;
      let multiplier = 3500;
      if (formData.budget === 'Budget-Friendly') multiplier = 2200;
      if (formData.budget === 'Premium') multiplier = 6000;
      if (formData.budget === 'Luxury') multiplier = 11000;

      // Base Cost calculation
      const minCost = days * p * multiplier;
      const maxCost = Math.round(minCost * 1.25);

      // Generate custom itinerary days based on selected destination patterns
      const daysCount = Math.min(days, 7);
      const generatedItinerary = Array.from({ length: daysCount }).map((_, idx) => {
        let title = '';
        let desc = '';
        if (idx === 0) {
          title = `Arrival & Welcome to ${selectedDest.name}`;
          desc = `Private transfer from airport/station to your property. Traditional welcome drink, check-in, and briefing about your ${selectedDest.name} experience.`;
        } else if (idx === daysCount - 1) {
          title = `Cherished Departures`;
          desc = `Morning at leisure. Buy local spices, souvenirs or handicrafts, followed by a private transfer back for your onward journey to ${formData.startCity}.`;
        } else {
          const sampleIndex = (idx - 1) % selectedDest.itineraryPattern.length;
          title = selectedDest.itineraryPattern[sampleIndex] || 'Local Explorer & Scenic Views';
          desc = `Guided exploration of scenic spots. Enjoy authentic lunch, walk around scenic view points, and unwind in comfortable handpicked stays.`;
        }
        return { day: idx + 1, title, desc };
      });

      setTailoredResult({
        destination: selectedDest.name,
        title: `${formData.days}-Day Customized ${formData.budget} Tour to ${selectedDest.name}`,
        costEstimate: `₹${minCost.toLocaleString('en-IN')} - ₹${maxCost.toLocaleString('en-IN')}`,
        duration: `${formData.days} Days / ${Math.max(1, days - 1)} Nights`,
        itinerary: generatedItinerary,
        highlights: selectedDest.highlights,
        weather: selectedDest.historicalWeather,
        bestMonths: selectedDest.bestMonths,
        clothing: selectedDest.clothing
      });

      setIsTailoring(false);
    }, 2000);
  };

  const handleDownloadPDF = async () => {
    if (!tailoredRef.current || !tailoredResult) return;
    setIsDownloading(true);
    try {
      const element = tailoredRef.current;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [width, height]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save(`AgriyaTravels_Custom_${tailoredResult.destination}_Itinerary.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleWhatsAppInquiry = () => {
    if (!tailoredResult) return;
    const message = `Hi Agriya Travels, I used your Travel Inspiration Wheel and got suggested a ${formData.days}-Day customized tour to ${tailoredResult.destination} for ${formData.persons} persons, with a ${formData.budget} budget. Please help me confirm and book.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Header Info */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-[10px] uppercase font-bold tracking-widest text-theme-gold bg-theme-navy/5 px-3 py-1.5 rounded-full border border-theme-border inline-flex items-center gap-1.5 mb-3">
          <HelpCircle className="h-3.5 w-3.5" /> Can't decide where to go?
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-theme-heading">
          Travel Inspiration Hub
        </h2>
        <p className="text-xs sm:text-sm text-theme-muted font-light mt-2 leading-relaxed">
          Spin our magical wheel to discover high-contrast destinations or select from handpicked Hidden Gems, Trending Places, and Underrated Destinations!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Spin Wheel */}
        <div className="lg:col-span-5 flex flex-col items-center gap-6 bg-theme-navy text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-theme-teal">
          <div className="absolute top-0 left-0 w-32 h-32 bg-theme-gold/10 rounded-full blur-2xl pointer-events-none" />
          
          <h3 className="text-sm font-bold font-serif uppercase tracking-widest text-theme-gold flex items-center gap-1.5">
            <RotateCw className="h-4 w-4 animate-spin-slow" /> Decision Wheel
          </h3>

          {/* Interactive Wheel Container */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-4">
            {/* Wheel Pointer/Marker */}
            <div className="absolute -top-1 z-30 flex flex-col items-center">
              <div className="w-5 h-6 bg-theme-gold rounded-full flex items-center justify-center shadow-lg border border-theme-navy">
                <span className="w-2 h-2 rounded-full bg-theme-navy" />
              </div>
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-theme-gold -mt-1" />
            </div>

            {/* SVG Wheel Graphics */}
            <div 
              className="w-full h-full rounded-full overflow-hidden border-4 border-theme-gold shadow-[0_0_30px_rgba(212,175,55,0.25)] flex items-center justify-center"
              style={{
                transform: `rotate(${spinDeg}deg)`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
              }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {INSPIRATION_DESTINATIONS.map((dest, i) => {
                  const angle = 40; // 360 / 9
                  const startAngle = i * angle;
                  const endAngle = (i + 1) * angle;
                  
                  // Convert polar coordinates to Cartesian
                  const radStart = (startAngle - 90) * Math.PI / 180;
                  const radEnd = (endAngle - 90) * Math.PI / 180;
                  const x1 = 100 + 100 * Math.cos(radStart);
                  const y1 = 100 + 100 * Math.sin(radStart);
                  const x2 = 100 + 100 * Math.cos(radEnd);
                  const y2 = 100 + 100 * Math.sin(radEnd);
                  
                  // Color segment pattern
                  let color = '#1a3040'; // hidden gems
                  if (dest.type === 'trending') color = '#2c475e';
                  if (dest.type === 'underrated') color = '#102230';

                  // Center of the segment for text path
                  const midRad = ((startAngle + endAngle) / 2 - 90) * Math.PI / 180;
                  const tx = 100 + 60 * Math.cos(midRad);
                  const ty = 100 + 60 * Math.sin(midRad);
                  const textRotation = (startAngle + endAngle) / 2;

                  return (
                    <g key={dest.id}>
                      <path 
                        d={`M 100,100 L ${x1},${y1} A 100,100 0 0,1 ${x2},${y2} Z`} 
                        fill={color} 
                        stroke="#1d3557" 
                        strokeWidth="1.5"
                      />
                      <g transform={`translate(${tx}, ${ty}) rotate(${textRotation + (textRotation > 90 && textRotation < 270 ? 180 : 0)})`}>
                        <text 
                          textAnchor="middle" 
                          fill="#ffffff" 
                          fontSize="7.5" 
                          fontWeight="bold" 
                          className="select-none tracking-wide"
                        >
                          {dest.name}
                        </text>
                      </g>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="16" fill="#d4af37" stroke="#ffffff" strokeWidth="2" />
                <circle cx="100" cy="100" r="8" fill="#1d3557" />
              </svg>
            </div>
          </div>

          <button
            onClick={spinTheWheel}
            disabled={isSpinning}
            className="w-full flex items-center justify-center gap-2 bg-theme-gold text-theme-heading py-4 px-6 rounded-xl text-xs font-bold hover:bg-[#ebd074] hover:-translate-y-0.5 shadow-lg transition-all disabled:opacity-75"
          >
            <Compass className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} />
            {isSpinning ? 'SPINNING THE WHEEL...' : 'SPIN FOR INSPIRATION'}
          </button>
          
          <p className="text-[10px] text-slate-300 font-light text-center italic">
            * Tap spin and let destiny choose your next breathtaking memory.
          </p>
        </div>

        {/* Right Side: Tabbed Navigation & Detailed Forms */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {!selectedDest && !tailoredResult ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Category Toggles */}
                <div className="flex flex-wrap gap-2 border-b border-theme-border pb-4">
                  {(['all', 'gem', 'trending', 'underrated'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all uppercase tracking-wider ${selectedCategory === cat ? 'bg-theme-navy text-white border-theme-navy shadow-sm' : 'bg-theme-card text-theme-muted border-theme-border hover:border-theme-navy/30'}`}
                    >
                      {cat === 'all' ? 'All Places' : cat === 'gem' ? '💎 Hidden Gems' : cat === 'trending' ? '🔥 Trending' : '✨ Underrated'}
                    </button>
                  ))}
                </div>

                {/* Inspiration Destinations Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDestinations.map(dest => (
                    <div
                      key={dest.id}
                      onClick={() => setSelectedDest(dest)}
                      className="group flex flex-col bg-theme-card border border-theme-border rounded-2xl overflow-hidden hover:shadow-md hover:border-theme-gold/40 cursor-pointer transition-all"
                    >
                      <div className="h-32 bg-slate-200 relative overflow-hidden">
                        <img 
                          src={dest.image} 
                          alt={dest.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2.5 right-2.5 bg-theme-navy/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-theme-gold uppercase tracking-widest border border-theme-gold/30">
                          {dest.type === 'gem' ? 'Gem' : dest.type === 'trending' ? 'Trending' : 'Underrated'}
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h4 className="font-bold text-theme-heading text-sm mb-1">{dest.name}</h4>
                        <p className="text-xs text-theme-muted font-light line-clamp-2 leading-relaxed">{dest.desc}</p>
                        
                        <span className="text-[10px] font-bold text-theme-gold uppercase tracking-wider mt-3 inline-flex items-center gap-1 group-hover:text-theme-teal transition-colors">
                          Plan this trip &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : selectedDest && !tailoredResult ? (
              <motion.div
                key="customize-inspiration"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-theme-card border border-theme-border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6"
              >
                {/* Back Link */}
                <button 
                  onClick={() => setSelectedDest(null)} 
                  className="text-xs font-bold text-theme-gold hover:underline flex items-center gap-1 self-start"
                >
                  &larr; Back to Inspiration List
                </button>

                <div className="flex gap-4 items-center border-b border-theme-border pb-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-theme-border">
                    <img src={selectedDest.image} alt={selectedDest.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-theme-heading text-lg sm:text-xl">
                      Tailor Your Journey to {selectedDest.name}
                    </h3>
                    <p className="text-xs text-theme-muted font-light mt-0.5">
                      Configure your group, timeline, and budget preferences.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleGenerateTailored} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-theme-gold" /> Number of Days
                      </label>
                      <input 
                        type="number" 
                        min="1" 
                        required 
                        value={formData.days}
                        onChange={(e) => setFormData({...formData, days: e.target.value})}
                        className="w-full bg-theme-navy/5 border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-heading outline-none focus:border-theme-gold focus:ring-1 focus:ring-theme-gold transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-theme-gold" /> Travellers
                      </label>
                      <input 
                        type="number" 
                        min="1" 
                        required 
                        value={formData.persons}
                        onChange={(e) => setFormData({...formData, persons: e.target.value})}
                        className="w-full bg-theme-navy/5 border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-heading outline-none focus:border-theme-gold focus:ring-1 focus:ring-theme-gold transition-all" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Total Budget</label>
                      <select 
                        value={formData.budget}
                        onChange={(e) => setFormData({...formData, budget: e.target.value})}
                        className="w-full bg-theme-navy/5 border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-heading outline-none focus:border-theme-gold transition-all"
                      >
                        <option>Budget-Friendly</option>
                        <option>Moderate</option>
                        <option>Premium</option>
                        <option>Luxury</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-theme-gold" /> Start City
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={formData.startCity}
                        onChange={(e) => setFormData({...formData, startCity: e.target.value})}
                        className="w-full bg-theme-navy/5 border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-heading outline-none focus:border-theme-gold transition-all" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-theme-gold" /> Special Interests / Requests
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Honeymoon couple, adventure treks, purely vegetarian dining..."
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                      className="w-full bg-theme-navy/5 border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-heading outline-none focus:border-theme-gold transition-all" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isTailoring}
                    className="w-full bg-theme-navy hover:bg-theme-teal text-white py-4 px-6 rounded-xl text-xs font-bold transition-all shadow-md mt-6 flex justify-center items-center gap-2"
                  >
                    {isTailoring ? (
                      <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-theme-gold animate-pulse" />
                        GENERATE TAILOR-MADE PACKAGE
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="tailored-itinerary"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-5"
              >
                {/* Result Section (Downloadable Card) */}
                <div 
                  ref={tailoredRef} 
                  className="bg-white border border-theme-border rounded-[2rem] p-6 sm:p-8 shadow-md flex flex-col gap-6 text-theme-heading"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="inline-block bg-theme-gold/15 text-theme-heading border border-theme-gold/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                        Tailor-Made Suggestion
                      </span>
                      <h3 className="text-xl font-bold font-serif leading-tight">{tailoredResult.title}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-y border-theme-border py-4 my-2">
                    <div>
                      <p className="text-[10px] text-theme-muted uppercase tracking-wider font-bold mb-0.5">Estimated Cost</p>
                      <p className="text-[#E63946] font-bold text-base leading-none">{tailoredResult.costEstimate}</p>
                      <p className="text-[9px] text-theme-muted mt-1 leading-tight">* Includes stays & private transfers</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-theme-muted uppercase tracking-wider font-bold mb-0.5">Duration</p>
                      <p className="text-slate-800 font-bold text-sm">{tailoredResult.duration}</p>
                    </div>
                  </div>

                  {/* Weather Predictor / Clothing Suggestions */}
                  <div className="bg-theme-navy/5 p-4 rounded-xl border border-theme-border/50">
                    <h4 className="text-xs font-bold text-theme-heading mb-3 flex items-center gap-1.5 border-b border-theme-border/50 pb-2">
                      <CloudSun className="h-3.5 w-3.5 text-theme-teal" /> 
                      Destination Weather & Clothing Advisor
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <div className="text-[9px] uppercase font-bold text-theme-muted">Historical</div>
                        <div className="text-xs font-bold text-theme-heading mt-0.5">{tailoredResult.weather}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-theme-muted">Best Months</div>
                        <div className="text-xs font-bold text-theme-heading mt-0.5">{tailoredResult.bestMonths}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-theme-muted">Clothing Tip</div>
                        <div className="text-[10px] font-medium text-theme-heading mt-0.5 leading-snug line-clamp-2" title={tailoredResult.clothing}>
                          {tailoredResult.clothing}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tour Highlights */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-theme-muted uppercase tracking-wider font-bold border-b border-theme-border pb-1.5">What makes it special</p>
                    <ul className="space-y-1.5">
                      {tailoredResult.highlights.map((h: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-theme-muted font-light leading-snug">
                          <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" /> {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Custom Brief Itinerary */}
                  <div className="space-y-4">
                    <p className="text-[10px] text-theme-muted uppercase tracking-wider font-bold border-b border-theme-border pb-1.5">Day-by-Day Outline</p>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[9px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
                      {tailoredResult.itinerary.map((it: any, idx: number) => (
                        <div key={idx} className="relative flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-theme-teal text-theme-gold flex items-center justify-center text-[10px] font-bold shrink-0 relative z-10 ring-4 ring-white">
                            {it.day}
                          </div>
                          <div className="pt-0.5">
                            <h5 className="text-xs font-bold text-slate-800 leading-tight">{it.title}</h5>
                            <p className="text-[10px] text-theme-muted mt-1 font-light leading-relaxed">{it.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleDownloadPDF} 
                    disabled={isDownloading}
                    className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-theme-heading bg-theme-card hover:bg-slate-100 py-3.5 rounded-xl border border-theme-border transition-all shadow-sm"
                  >
                    {isDownloading ? <span className="h-4 w-4 border-2 border-theme-heading/30 border-t-theme-heading rounded-full animate-spin" /> : <Download className="h-4 w-4" />}
                    {isDownloading ? 'Generating...' : 'Download PDF'}
                  </button>
                  <button 
                    onClick={handleWhatsAppInquiry} 
                    className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] py-3.5 rounded-xl transition-all shadow-md hover:-translate-y-0.5"
                  >
                    <Phone className="h-4 w-4 fill-white text-white" /> Book via WhatsApp
                  </button>
                  <button 
                    onClick={() => {
                      setTailoredResult(null);
                      setSelectedDest(null);
                    }} 
                    className="flex-1 py-3.5 rounded-xl border border-theme-navy/20 text-xs font-bold text-theme-navy hover:bg-theme-navy/5 transition-colors uppercase tracking-wider"
                  >
                    Redesign Trip
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
