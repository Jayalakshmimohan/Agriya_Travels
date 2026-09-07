import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Hero from '../components/Hero';
import PackageCard from '../components/PackageCard';
import TestimonialCard from '../components/TestimonialCard';
import FAQSection from '../components/FAQSection';
import SEO from '../components/SEO';
import { tourPackages, testimonials, WHATSAPP_NUMBER } from '../data';
import { ShieldCheck, MapPin, HeartHandshake, Car, MessageCircle, Compass } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import PageTransition from '../components/PageTransition';
import InteractiveTravelMap from '../components/InteractiveTravelMap';
import WeatherWidget from '../components/WeatherWidget';
import TravelTipsTrends from '../components/TravelTipsTrends';

const FEATURES = [
  { icon: ShieldCheck, title: 'Trusted Experts', desc: 'Over a decade of experience planning flawless trips from Chennai.' },
  { icon: MapPin, title: 'Custom Itineraries', desc: 'Tailor-made plans matching your unique budget and preferences.' },
  { icon: HeartHandshake, title: '24/7 Support', desc: 'Dedicated WhatsApp and call support throughout your journey.' },
  { icon: Car, title: 'Reliable Transfers', desc: 'Premium fleet of cars and tempo travellers for all size groups.' },
];

export default function Home() {
  const featuredPackages = tourPackages.slice(0, 6);
  const { currency } = useCurrency();
  const [emblaRef] = useEmblaCarousel({ align: 'start', loop: true });
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Agriya Travels, I am looking to plan a trip.')}`;

  return (
    <PageTransition>
      <SEO 
        title="Home" 
        description="Agriya Travels - Chennai's premium travel partner offering custom India tours, international holidays, and corporate travel services." 
        keywords="Chennai travel agency, tour packages from Chennai, international holidays, custom itineraries"
      />
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">
        
        <div className="lg:col-span-8 flex flex-col gap-10">
          <Hero />
          
          {/* Featured Packages */}
          <section className="flex flex-col gap-5">
            <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif text-theme-heading leading-tight">Popular from Chennai</h3>
                  <p className="text-xs text-theme-muted font-light mt-1">Handpicked premium itineraries</p>
                </div>
                <a href="/india-tours" className="text-[10px] sm:text-xs font-bold text-theme-gold hover:text-[#c4a12f] uppercase tracking-wider transition-colors hidden sm:block">View All Packages &rarr;</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredPackages.map(pkg => (
                  <PackageCard key={pkg.id} pkg={pkg} displayCurrency={currency} />
              ))}
            </div>
             <a href="/india-tours" className="text-[10px] text-center font-bold text-theme-gold uppercase tracking-wider block sm:hidden mt-2">View All Packages &rarr;</a>
          </section>

          {/* Interactive Travel Map */}
          <InteractiveTravelMap />

          {/* Travel Tips & Trends */}
          <TravelTipsTrends />

          {/* Real-time Weather Planning Widget */}
          <WeatherWidget />

          {/* Why Choose Us */}
          <section className="bg-theme-navy text-white rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-theme-gold/10 rounded-bl-full pointer-events-none transition-transform duration-700 group-hover:scale-110" />
             <div className="grid md:grid-cols-2 gap-10 items-center relative z-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white mb-4 leading-tight">Why Choose Agriya?</h2>
                  <p className="text-xs sm:text-sm text-slate-300 mb-8 leading-relaxed font-light">
                     As Chennai's premium travel partner, we believe that every journey should be as unique as the traveler. Whether you are seeking a budget-friendly escape, a luxurious overseas holiday, or a deeply spiritual pilgrimage, our local expertise ensures an unforgettable experience.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {FEATURES.map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <div key={idx} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-gold/20 text-theme-gold">
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs mb-1">{feature.title}</h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-light">{feature.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=800"
                    alt="Happy travelers"
                    className="rounded-[1.5rem] shadow-xl w-full h-64 object-cover border-4 border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-6 -left-6 rounded-2xl bg-theme-gold p-5 shadow-xl ring-1 ring-black/5 hidden sm:block">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-theme-heading">10+</div>
                      <div className="text-[10px] font-bold text-theme-heading uppercase tracking-widest leading-tight">Years of<br/>Excellence</div>
                    </div>
                  </div>
                </div>
             </div>
          </section>

          {/* FAQ Section */}
          <FAQSection />

          {/* Testimonials */}
          <section className="flex flex-col gap-6 w-full overflow-hidden">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-theme-heading text-center sm:text-left">Tales of Journey</h3>
              <p className="text-xs text-theme-muted font-light mt-1 text-center sm:text-left">What our travelers say</p>
            </div>
            <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
              <div className="flex gap-5 -ml-4 pl-4">
                  {testimonials.map(t => (
                    <div key={t.id} className="min-w-0 shrink-0 grow-0 basis-[90%] sm:basis-[45%] xl:basis-[30%]">
                      <TestimonialCard t={t} />
                    </div>
                  ))}
              </div>
            </div>
          </section>

        </div>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="lg:sticky lg:top-24 flex flex-col gap-6 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto custom-scrollbar pr-1 pb-32">
            {/* Travel Inspiration Feature Card */}
            <div className="bg-gradient-to-br from-theme-navy to-[#1a3040] text-white rounded-3xl p-6 shadow-xl border border-theme-teal/30 relative overflow-hidden group shrink-0">
              <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-theme-gold/15 rounded-full blur-xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-theme-gold flex items-center gap-1.5 bg-white/5 py-1 px-2.5 rounded-full border border-white/10 self-start">
                  <Compass className="h-3 w-3 animate-spin" style={{ animationDuration: '6s' }} /> Not sure where to start?
                </span>
                <div>
                  <h4 className="font-serif font-bold text-lg leading-snug">Plan Your Trip with AI</h4>
                  <p className="text-[11px] text-slate-300 font-light leading-relaxed mt-1">
                    Describe the trip you have in mind and we'll suggest destinations, build a day-by-day itinerary, and work out the cost.
                  </p>
                </div>
                <a
                  href="/ai-planner"
                  className="bg-theme-gold hover:bg-[#ebd074] text-theme-heading text-xs font-bold py-3 px-5 rounded-xl transition-all hover:-translate-y-0.5 text-center shadow-lg shadow-theme-gold/10"
                >
                  Open the Trip Planner &rarr;
                </a>
              </div>
            </div>

            <div className="bg-theme-card rounded-3xl p-6 shadow-sm border border-theme-border flex flex-col shrink-0">
               <h3 className="text-sm font-bold flex items-center gap-2 text-theme-heading mb-4 uppercase tracking-widest">
                  <Car className="h-4 w-4 text-theme-gold" /> Premium Transfers
               </h3>
               <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-theme-navy/5 p-4 flex flex-col items-center justify-center rounded-2xl border border-transparent hover:border-theme-gold/30 transition-colors cursor-pointer text-center">
                     <p className="text-[11px] font-bold text-theme-heading">SEDAN / SUV</p>
                     <p className="text-[9px] text-theme-muted font-light">Intercity Trips</p>
                  </div>
                  <div className="bg-theme-navy/5 p-4 flex flex-col items-center justify-center rounded-2xl border border-transparent hover:border-theme-gold/30 transition-colors cursor-pointer text-center">
                     <p className="text-[11px] font-bold text-theme-heading">TEMPO TRAVEL</p>
                     <p className="text-[9px] text-theme-muted font-light">12-24 Seater</p>
                  </div>
               </div>
               <div className="bg-theme-navy text-white p-5 rounded-2xl flex items-center justify-between">
                   <div className="text-left">
                       <p className="text-xs font-bold font-serif">Airport Drops</p>
                       <p className="text-[10px] text-slate-400 font-light">Chennai International</p>
                   </div>
                   <a href="/rentals" className="text-[10px] font-bold text-theme-heading bg-theme-gold px-3 py-1.5 rounded-full hover:bg-theme-card transition-colors">Book</a>
               </div>
            </div>
          </div>
        </aside>

      </div>
      
      {/* Sticky Mobile Enquiry Bar */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-[#25D366] text-white p-4 rounded-2xl shadow-2xl font-bold text-sm tracking-wide"
        >
          <MessageCircle className="h-5 w-5 fill-current" />
          Plan Your Trip via WhatsApp
        </a>
      </div>
    </div>
    </PageTransition>
  );
}
