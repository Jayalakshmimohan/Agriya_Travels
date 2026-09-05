import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, MessageSquare, Compass, Phone, Calendar, MapPin, Users, Hotel, Car, Heart, CheckCircle2, Download, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AITripRequest } from '../types';
import { WHATSAPP_NUMBER } from '../data';
import { postLead } from '../lib/leads';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export default function AITripPlanner() {
  const [formData, setFormData] = useState<AITripRequest>({
    destination: '',
    startingCity: 'Chennai',
    travelDate: '',
    days: '5',
    travellers: '2',
    travelType: 'Family',
    budget: 'Moderate',
    hotelPreference: '4-Star',
    vehicleRequirement: 'SUV',
    specialNeeds: ''
  });

  const [errors, setErrors] = useState({
    destination: '',
    startingCity: '',
    days: '',
    travellers: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'destination') {
      const trimmed = value.trim();
      if (!trimmed) {
        error = 'Destination is required';
      } else if (trimmed.length > 100) {
        error = 'Max 100 characters';
      } else if (!/^[a-zA-Z0-9\s,.'()-]+$/.test(trimmed)) {
        error = 'Invalid characters';
      }
    }
    if (name === 'startingCity') {
      const trimmed = value.trim();
      if (!trimmed) {
        error = 'Start city is required';
      } else if (trimmed.length > 100) {
        error = 'Max 100 characters';
      } else if (!/^[a-zA-Z0-9\s,.'()-]+$/.test(trimmed)) {
        error = 'Invalid characters';
      }
    }
    if (name === 'days') {
      const num = parseInt(value, 10);
      if (!value) {
        error = 'Required';
      } else if (isNaN(num) || num < 1 || num > 30) {
        error = 'Must be 1 to 30 days';
      }
    }
    if (name === 'travellers') {
      const num = parseInt(value, 10);
      if (!value) {
        error = 'Required';
      } else if (isNaN(num) || num < 1 || num > 500) {
        error = 'Must be 1 to 500';
      }
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };
  const [result, setResult] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  // Set when the AI planner was unreachable and we served the local template.
  // Showing a generic outline as though it were AI-generated is the same kind
  // of silent failure that hid the bad model id for months.
  const [usedFallback, setUsedFallback] = useState(false);
  const itineraryRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!itineraryRef.current || !result) return;
    
    setIsDownloading(true);
    try {
      const element = itineraryRef.current;
      
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
      pdf.save(`AgriyaTravels_${formData.destination.replace(/[^a-zA-Z0-9]/g, '_')}_Itinerary.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * The original template generator, kept as a fallback so an API outage or a
   * missing key degrades the feature instead of breaking it — the same
   * defensive pattern TravelTipsTrends uses for /api/travel-news.
   */
  const buildTemplatePlan = () => {
    const days = parseInt(formData.days) || 5;
    const t = parseInt(formData.travellers) || 2;
    let costPerDay = 4500;
    if (formData.budget === 'Premium') costPerDay = 7500;
    if (formData.budget === 'Luxury') costPerDay = 12000;
    if (formData.budget === 'Budget-Friendly') costPerDay = 2500;

    const minCost = days * costPerDay * t;
    const maxCost = minCost * 1.3;

    return {
      title: `${formData.days}-Day ${formData.travelType} Escape to ${formData.destination}`,
      highlights: [
        'Handpicked local experiences',
        `${formData.hotelPreference} Accommodations`,
        `Private ${formData.vehicleRequirement} transfers`,
        '24/7 dedicated travel concierge'
      ],
      itinerary: Array.from({ length: Math.min(days, 7) }).map((_, i) => ({
        day: i + 1,
        title: i === 0 ? `Arrival & Welcome to ${formData.destination}` : i === days - 1 ? 'Departure with Memories' : `Immersive Sightseeing & Leisure`,
        desc: i === 0 ? `Private pick-up from the airport/station. Check-in and relax at your ${formData.hotelPreference.toLowerCase()} property.` : i === days - 1 ? `Morning at leisure. Check-out and private transfer to the airport.` : `Guided tour of the most iconic spots. Evening free to explore local markets and cuisine.`
      })),
      cost: `₹${minCost.toLocaleString('en-IN')} - ₹${maxCost.toLocaleString('en-IN')}`,
      note: `Best time to visit ${formData.destination} is usually between Oct-March. Rates vary by exact season.`
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const destErr = validateField('destination', formData.destination);
    const startErr = validateField('startingCity', formData.startingCity);
    const daysErr = validateField('days', formData.days);
    const travellersErr = validateField('travellers', formData.travellers);

    if (destErr || startErr || daysErr || travellersErr) {
      return;
    }

    setIsGenerating(true);
    setResult(null);

    // Awaited here (unlike the other forms) because this one doesn't navigate
    // away — so the itinerary can be linked back to the enquiry that produced it.
    const leadId = await postLead({
      source: 'trip_planner',
      destination: formData.destination,
      startingCity: formData.startingCity,
      travelDate: formData.travelDate,
      durationDays: formData.days,
      travellers: formData.travellers,
      budget: formData.budget,
      travelType: formData.travelType,
      hotelPreference: formData.hotelPreference,
      vehicleType: formData.vehicleRequirement,
      message: formData.specialNeeds,
    });

    try {
      const response = await fetch('/api/ai/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: formData.destination,
          startingCity: formData.startingCity,
          travelDate: formData.travelDate,
          days: formData.days,
          travellers: formData.travellers,
          travelType: formData.travelType,
          budget: formData.budget,
          hotelPreference: formData.hotelPreference,
          vehicleRequirement: formData.vehicleRequirement,
          specialNeeds: formData.specialNeeds,
          leadId: leadId ?? undefined,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json?.success && json.data) {
          setUsedFallback(false);
          setResult(json.data);
          return;
        }
      }
      throw new Error('Planner API unavailable');
    } catch {
      setUsedFallback(true);
      setResult(buildTemplatePlan());
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsApp = () => {
    if (!result) return;
    const message = `Hi Agriya Travels, I planned a trip to ${formData.destination || 'a destination'} for ${formData.travellers || '2'} people, ${formData.days || '5'} days, budget ${result.cost}. Please help me customize and book.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-theme-navy rounded-[2rem] p-6 sm:p-8 shadow-2xl flex flex-col gap-6 w-full h-full relative overflow-hidden text-white border border-theme-teal">
      {/* Decorative background circle */}
      <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-theme-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-theme-teal/40 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-theme-gold/10 flex items-center justify-center text-theme-gold backdrop-blur-md ring-1 ring-theme-gold/30">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-white font-serif text-xl sm:text-2xl leading-tight">Trip Planner</h3>
          <p className="text-theme-gold text-[10px] tracking-widest uppercase font-bold mt-1">Design your perfection</p>
        </div>
      </div>

      <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar pr-2 -mr-2">
        <AnimatePresence mode="wait">
          {!result && !isGenerating ? (
            <motion.form 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onSubmit={handleSubmit} 
              className="space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase flex items-center gap-1.5"><MapPin className="w-3 h-3 text-theme-gold" /> Destination</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kerala, Dubai"
                    className={`w-full bg-theme-teal/40 border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-theme-gold transition-all ${
                      errors.destination ? 'border-red-500' : 'border-theme-teal'
                    }`}
                    value={formData.destination}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, destination: val });
                      validateField('destination', val);
                    }}
                  />
                  {errors.destination && (
                    <p className="text-[10px] text-red-300 font-medium">⚠️ {errors.destination}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase flex items-center gap-1.5"><MapPin className="w-3 h-3 text-theme-gold" /> Start City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai"
                    className={`w-full bg-theme-teal/40 border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-theme-gold transition-all ${
                      errors.startingCity ? 'border-red-500' : 'border-theme-teal'
                    }`}
                    value={formData.startingCity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, startingCity: val });
                      validateField('startingCity', val);
                    }}
                  />
                  {errors.startingCity && (
                    <p className="text-[10px] text-red-300 font-medium">⚠️ {errors.startingCity}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-3 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase flex items-center gap-1.5"><Calendar className="w-3 h-3 text-theme-gold" /> Month/Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Nov 2024"
                    className="w-full bg-theme-teal/40 border border-theme-teal rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-theme-gold transition-all"
                    value={formData.travelDate}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[<>]/g, '');
                      setFormData({ ...formData, travelDate: val });
                    }}
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">Days</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className={`w-full bg-theme-teal/40 border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-theme-gold transition-all text-center ${
                      errors.days ? 'border-red-500' : 'border-theme-teal'
                    }`}
                    value={formData.days}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, days: val });
                      validateField('days', val);
                    }}
                  />
                  {errors.days && (
                    <p className="text-[10px] text-red-300 font-medium">⚠️ {errors.days}</p>
                  )}
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase flex items-center gap-1.5"><Users className="w-3 h-3 text-theme-gold" /> Travellers</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className={`w-full bg-theme-teal/40 border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-theme-gold transition-all text-center ${
                      errors.travellers ? 'border-red-500' : 'border-theme-teal'
                    }`}
                    value={formData.travellers}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, travellers: val });
                      validateField('travellers', val);
                    }}
                  />
                  {errors.travellers && (
                    <p className="text-[10px] text-red-300 font-medium">⚠️ {errors.travellers}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">Travel Type</label>
                  <select className="w-full bg-theme-teal/40 border border-theme-teal rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-theme-gold transition-all" value={formData.travelType} onChange={(e) => setFormData({ ...formData, travelType: e.target.value })}>
                    <option className="bg-[#0B192C] text-white">Family</option>
                    <option className="bg-[#0B192C] text-white">Honeymoon</option>
                    <option className="bg-[#0B192C] text-white">Pilgrimage</option>
                    <option className="bg-[#0B192C] text-white">Adventure</option>
                    <option className="bg-[#0B192C] text-white">Corporate</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">Budget</label>
                  <select className="w-full bg-theme-teal/40 border border-theme-teal rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-theme-gold transition-all" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })}>
                    <option className="bg-[#0B192C] text-white">Budget-Friendly</option>
                    <option className="bg-[#0B192C] text-white">Moderate</option>
                    <option className="bg-[#0B192C] text-white">Premium</option>
                    <option className="bg-[#0B192C] text-white">Luxury</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase flex items-center gap-1.5"><Hotel className="w-3 h-3 text-theme-gold" /> Hotel</label>
                  <select className="w-full bg-theme-teal/40 border border-theme-teal rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-theme-gold transition-all" value={formData.hotelPreference} onChange={(e) => setFormData({ ...formData, hotelPreference: e.target.value })}>
                    <option className="bg-[#0B192C] text-white">3-Star</option>
                    <option className="bg-[#0B192C] text-white">4-Star</option>
                    <option className="bg-[#0B192C] text-white">5-Star</option>
                    <option className="bg-[#0B192C] text-white">Resort</option>
                    <option className="bg-[#0B192C] text-white">Homestay</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase flex items-center gap-1.5"><Car className="w-3 h-3 text-theme-gold" /> Vehicle</label>
                  <select className="w-full bg-theme-teal/40 border border-theme-teal rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-theme-gold transition-all" value={formData.vehicleRequirement} onChange={(e) => setFormData({ ...formData, vehicleRequirement: e.target.value })}>
                    <option className="bg-[#0B192C] text-white">Sedan</option>
                    <option className="bg-[#0B192C] text-white">SUV</option>
                    <option className="bg-[#0B192C] text-white">Tempo Traveller</option>
                    <option className="bg-[#0B192C] text-white">Not Required</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase flex items-center gap-1.5"><Heart className="w-3 h-3 text-theme-gold" /> Special Needs (Optional)</label>
                <input type="text" placeholder="Wheelchair access, pure veg food, etc." className="w-full bg-theme-teal/40 border border-theme-teal rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-theme-gold transition-all" value={formData.specialNeeds} onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })} />
              </div>

              <button type="submit" className="w-full mt-4 flex items-center justify-center gap-2 bg-theme-gold text-theme-heading py-4 rounded-xl text-xs font-bold hover:bg-[#ebd074] hover:-translate-y-0.5 shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all">
                <Compass className="h-4 w-4" /> GENERATE ITINERARY
              </button>
            </motion.form>
          ) : isGenerating ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 py-2">
              <div className="bg-theme-card rounded-2xl p-6 relative overflow-hidden shadow-2xl h-[420px] flex flex-col gap-6">
                 {/* Skeleton resembling the itinerary result */}
                 <div className="animate-pulse flex flex-col gap-6 w-full opacity-60">
                    <div className="h-8 bg-slate-200 rounded-lg w-3/4"></div>
                    <div className="h-6 bg-slate-100 rounded p-2 text-transparent w-1/3">Recommended Plan</div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                         <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                       </div>
                       <div>
                         <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                         <div className="h-5 bg-slate-200 rounded w-full"></div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                       <div className="space-y-3">
                          <div className="flex gap-2 items-center"><div className="w-4 h-4 rounded-full bg-slate-200"></div><div className="h-3 bg-slate-100 rounded w-5/6"></div></div>
                          <div className="flex gap-2 items-center"><div className="w-4 h-4 rounded-full bg-slate-200"></div><div className="h-3 bg-slate-100 rounded w-4/6"></div></div>
                          <div className="flex gap-2 items-center"><div className="w-4 h-4 rounded-full bg-slate-200"></div><div className="h-3 bg-slate-100 rounded w-3/4"></div></div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-theme-card/60 backdrop-blur-[2px] z-10">
                    <h4 className="text-sm font-serif font-bold text-theme-heading mb-2 px-6 text-center">Curating Perfection...</h4>
                    <p className="text-[10px] text-theme-muted font-light max-w-[200px] text-center">Selecting the finest experiences for your journey to {formData.destination}.</p>
                 </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 py-2">
              {usedFallback && (
                <div className="flex items-start gap-2.5 bg-amber-400/15 border border-amber-400/30 rounded-xl p-3.5">
                  <Info className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-100 leading-relaxed">
                    Our AI planner is busy right now, so this is a standard outline rather than a
                    tailored plan. Message us on WhatsApp and we'll build you a proper one.
                  </p>
                </div>
              )}
              <div ref={itineraryRef} className="bg-theme-card rounded-2xl p-6 text-theme-heading relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Compass className="h-32 w-32" />
                </div>

                <div className="flex items-center justify-between border-b border-theme-border/60 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo.png"
                      alt="Agriya Travels"
                      className="h-10 w-10 object-contain rounded-xl bg-white p-1 shadow-xs border border-theme-border/40 shrink-0"
                    />
                    <div>
                      <h5 className="font-serif font-bold text-sm text-theme-heading leading-none">Agriya Travels</h5>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mt-1">Journeys • Memories • Trust</p>
                    </div>
                  </div>
                  <div className="bg-[#F1FAEE] text-theme-teal px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Official Plan
                  </div>
                </div>
                
                <h4 className="text-xl font-bold font-serif leading-tight mb-2 pr-8">{result?.title}</h4>
                <div className="inline-block bg-[#F1FAEE] text-theme-teal px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-6">
                  Recommended Plan
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div>
                     <p className="text-[9px] text-theme-muted uppercase tracking-widest font-bold mb-1">Estimated Cost</p>
                     <p className="text-[#E63946] font-bold text-sm">{result?.cost}</p>
                   </div>
                   <div>
                     <p className="text-[9px] text-theme-muted uppercase tracking-widest font-bold mb-1">Duration</p>
                     <p className="text-theme-heading font-bold text-sm block">{formData.days} Days / {Math.max(1, parseInt(formData.days)-1)} Nights</p>
                   </div>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-[9px] text-theme-muted uppercase tracking-widest font-bold border-b border-theme-border pb-2">Tour Highlights</p>
                  <ul className="space-y-2">
                    {result?.highlights.map((h: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-theme-muted font-light">
                        <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" /> {h}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-[9px] text-theme-muted uppercase tracking-widest font-bold border-b border-theme-border pb-2">Brief Itinerary</p>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[9px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-100">
                    {result?.itinerary.map((it: any, i: number) => (
                      <div key={i} className="relative flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full bg-theme-teal text-theme-gold flex items-center justify-center text-[9px] font-bold shrink-0 relative z-10 ring-4 ring-white">
                          {it.day}
                        </div>
                        <div className="pt-0.5">
                          <h5 className="text-xs font-bold text-theme-heading">{it.title}</h5>
                          <p className="text-[10px] text-theme-muted mt-1 font-light leading-relaxed">{it.desc}</p>
                        </div>
                      </div>
                    ))}
                    {parseInt(formData.days) > 7 && (
                      <p className="text-[10px] text-slate-400 italic pl-9">...and more days customized to your preference.</p>
                    )}
                  </div>
                </div>

                <div className="bg-theme-navy/5 rounded-xl p-3">
                  <p className="text-[10px] text-theme-muted italic font-light text-center">{result?.note}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDownloadPDF} 
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-theme-heading bg-theme-card hover:bg-slate-100 py-4 rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {isDownloading ? 'Generating PDF...' : 'Download Itinerary as PDF'}
                </button>
                <button onClick={handleWhatsApp} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  <Phone className="h-4 w-4" /> Book This Journey via WhatsApp
                </button>
                <button onClick={() => setResult(null)} className="w-full py-4 rounded-xl border border-white/20 text-xs font-bold text-white transition hover:bg-theme-card/10 uppercase tracking-wide">
                  Redesign Trip
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
