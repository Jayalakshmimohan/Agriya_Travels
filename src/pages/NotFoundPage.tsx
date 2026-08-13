import { Compass, Home, MapPin, Globe, Sparkles, Phone, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import PageTransition from '../components/PageTransition';
import { WHATSAPP_NUMBER } from '../data';

export default function NotFoundPage() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Agriya Travels, I got lost on your website looking for a package. Can you help me?')}`;

  return (
    <PageTransition>
      <SEO 
        title="404 - Page Not Found" 
        description="The travel page or destination you are looking for cannot be found. Explore our curated India and International packages."
        keywords="404, page not found, Agriya Travels"
      />
      <div className="bg-theme-bg min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full text-center">
          {/* Animated Graphic */}
          <div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-theme-gold/15 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="relative flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-theme-card border-2 border-theme-gold/40 shadow-2xl">
              <Compass className="w-14 h-14 sm:w-18 sm:h-18 text-theme-gold animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <span className="absolute -bottom-2 bg-theme-gold text-theme-heading text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
              404
            </span>
          </div>

          <span className="text-theme-gold text-xs sm:text-sm font-bold uppercase tracking-[0.25em] block mb-3">
            Off The Beaten Path
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-theme-heading mb-4 tracking-tight">
            Destination Not Found
          </h1>
          <p className="text-sm sm:text-base text-theme-muted max-w-lg mx-auto font-light leading-relaxed mb-10">
            It looks like this route is uncharted or the destination you are looking for has been relocated. Let’s get your itinerary back on track.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-theme-gold text-theme-heading font-bold px-6 py-3.5 text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:bg-[#ebd074] hover:-translate-y-0.5 transition-all duration-200"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white font-bold px-6 py-3.5 text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <Phone className="h-4 w-4" />
              Ask on WhatsApp
            </a>
          </div>

          {/* Popular Destinations Cards */}
          <div className="border-t border-theme-border pt-10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
              Popular Destinations & Services
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <a
                href="/india-tours"
                className="group p-4 rounded-2xl bg-theme-card border border-theme-border hover:border-theme-gold/40 hover:shadow-md transition-all text-left flex flex-col justify-between"
              >
                <MapPin className="h-5 w-5 text-theme-gold mb-2 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="text-xs font-bold text-theme-heading group-hover:text-theme-gold transition-colors">India Tours</h4>
                  <p className="text-[10px] text-theme-muted font-light mt-0.5">Kerala, Kashmir & more</p>
                </div>
              </a>

              <a
                href="/international-tours"
                className="group p-4 rounded-2xl bg-theme-card border border-theme-border hover:border-theme-gold/40 hover:shadow-md transition-all text-left flex flex-col justify-between"
              >
                <Globe className="h-5 w-5 text-theme-gold mb-2 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="text-xs font-bold text-theme-heading group-hover:text-theme-gold transition-colors">International</h4>
                  <p className="text-[10px] text-theme-muted font-light mt-0.5">Dubai, Europe & Bali</p>
                </div>
              </a>

              <a
                href="/ai-planner"
                className="group p-4 rounded-2xl bg-theme-card border border-theme-border hover:border-theme-gold/40 hover:shadow-md transition-all text-left flex flex-col justify-between"
              >
                <Sparkles className="h-5 w-5 text-theme-gold mb-2 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="text-xs font-bold text-theme-heading group-hover:text-theme-gold transition-colors">Trip Planner</h4>
                  <p className="text-[10px] text-theme-muted font-light mt-0.5">Custom AI Itineraries</p>
                </div>
              </a>

              <a
                href="/contact"
                className="group p-4 rounded-2xl bg-theme-card border border-theme-border hover:border-theme-gold/40 hover:shadow-md transition-all text-left flex flex-col justify-between"
              >
                <ArrowLeft className="h-5 w-5 text-theme-gold mb-2 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="text-xs font-bold text-theme-heading group-hover:text-theme-gold transition-colors">Contact Support</h4>
                  <p className="text-[10px] text-theme-muted font-light mt-0.5">Chennai HQ Team</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
