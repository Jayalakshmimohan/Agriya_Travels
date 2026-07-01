import { CheckCircle, Award, HeartHandshake, Map, ShieldCheck } from 'lucide-react';
import SEO from '../components/SEO';

export default function About() {
  return (
    <>
      <SEO 
        title="About Us" 
        description="Learn about Agriya Travels, our story, core values, and commitment to providing unparalleled travel experiences."
        keywords="about Agriya Travels, travel agency Chennai, our story, best tour operators"
      />
      <div className="bg-theme-card">
      {/* Hero Section */}
      <div className="relative bg-theme-navy py-32 sm:py-40">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1536489885071-87983c3e288c?auto=format&fit=crop&q=80&w=2000"
            alt="About Agriya Travels"
            className="h-full w-full object-cover opacity-30 mix-blend-overlay"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center z-10">
          <h1 className="text-4xl font-serif font-bold tracking-tight text-white sm:text-5xl">About Agriya Travels</h1>
          <p className="mt-6 text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Your bridge to the world's most beautiful destinations, right from the heart of Chennai.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-serif font-bold tracking-tight text-theme-heading mb-6">Our Story</h2>
            <div className="space-y-6 text-base sm:text-lg text-theme-muted font-light leading-relaxed">
              <p>
                Founded in Chennai, Agriya Travels was born out of a profound passion for exploration. We understand that travel is not just about visiting places—it's about the memories you create, the cultures you embrace, and the stories you bring back home.
              </p>
              <p>
                Over the years, we have grown into a premier comprehensive tour operator. Our specialties span highly customized domestic tours across India, immersive outbound international holidays, soul-stirring pilgrimage trips, and incredibly seamless corporate travel management.
              </p>
              <p>
                Our philosophy is simple yet unwavering: Transparent pricing, flawless end-to-end execution, and truly relentless 24/7 support. We shoulder the complexities of visa processing, transport logistics, and itinerary optimization so that you can focus purely on the joy of the journey.
              </p>
            </div>

            <div className="mt-12 bg-theme-card p-6 sm:p-8 rounded-3xl border border-theme-border">
              <h3 className="text-xl font-bold font-serif text-theme-heading mb-6 flex items-center gap-3">
                <Award className="h-6 w-6 text-theme-gold" /> Our Core Values
              </h3>
              <ul className="grid sm:grid-cols-2 gap-4">
                {[
                  { text: 'Uncompromising Quality', icon: ShieldCheck },
                  { text: 'Transparent Pricing', icon: CheckCircle },
                  { text: 'Local & Global Expertise', icon: Map },
                  { text: 'Dedicated Support', icon: HeartHandshake }
                ].map((val, i) => {
                  const Icon = val.icon;
                  return (
                    <li key={i} className="flex items-center gap-3 text-theme-heading bg-theme-card p-4 rounded-xl shadow-sm border border-theme-border">
                      <Icon className="h-5 w-5 text-theme-gold flex-shrink-0" />
                      <span className="text-sm font-bold tracking-wide">{val.text}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 sm:gap-6 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-theme-gold rounded-full blur-3xl opacity-20 pointer-events-none" />
             <div className="space-y-4 sm:space-y-6 mt-12 sm:mt-24">
               <img
                src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800"
                alt="India Travel"
                className="rounded-[2rem] shadow-xl h-64 sm:h-80 w-full object-cover"
                referrerPolicy="no-referrer"
               />
             </div>
             <div className="space-y-4 sm:space-y-6">
               <img
                src="https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&q=80&w=800"
                alt="Planning"
                className="rounded-[2rem] shadow-xl h-64 sm:h-80 w-full object-cover"
                referrerPolicy="no-referrer"
               />
             </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
