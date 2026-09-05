import React, { useState, useEffect } from 'react';
import AITripPlanner from '../components/AITripPlanner';
import TravelInspiration from '../components/TravelInspiration';
import TravelAssistantChat from '../components/TravelAssistantChat';
import SEO from '../components/SEO';
import PageTransition from '../components/PageTransition';
import { Sparkles, Compass, MessagesSquare } from 'lucide-react';

type TabKey = 'assistant' | 'planner' | 'inspiration';

export default function AiTripPlannerPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('assistant');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'inspiration' || tabParam === 'planner' || tabParam === 'assistant') {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <PageTransition>
      <SEO 
        title="Trip Planner" 
        description="Plan your next holiday instantly with Agriya Travels' AI-Powered Trip Planner. Get a day-by-day customized itinerary based on your preferences."
        keywords="AI trip planner, custom itinerary, holiday planning, smart travel assistant"
      />
      <div className="bg-theme-card min-h-screen pb-20">
        <div className="bg-theme-navy text-white py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-theme-gold/10 to-transparent pointer-events-none" />
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-3xl font-bold font-serif text-white sm:text-5xl mb-4">
              AI-Powered Trip Planning
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 font-light max-w-2xl mx-auto">
              Tell us about your trip in your own words and we'll price real options for you — or design a day-by-day itinerary, or browse the Inspiration Hub for ideas.
            </p>

            {/* Premium Tab Toggle */}
            <div className="flex justify-center mt-10">
              <div className="inline-flex bg-white/5 p-1.5 rounded-full border border-white/15 backdrop-blur-md">
                <button
                  onClick={() => handleTabChange('assistant')}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer ${activeTab === 'assistant' ? 'bg-theme-gold text-theme-heading shadow-md' : 'text-slate-300 hover:text-white'}`}
                >
                  <MessagesSquare className="h-4 w-4" />
                  Travel Assistant
                </button>
                <button
                  onClick={() => handleTabChange('planner')}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer ${activeTab === 'planner' ? 'bg-theme-gold text-theme-heading shadow-md' : 'text-slate-300 hover:text-white'}`}
                >
                  <Sparkles className="h-4 w-4" />
                  Custom AI Planner
                </button>
                <button
                  onClick={() => handleTabChange('inspiration')}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer ${activeTab === 'inspiration' ? 'bg-theme-gold text-theme-heading shadow-md' : 'text-slate-300 hover:text-white'}`}
                >
                  <Compass className="h-4 w-4" />
                  Travel Inspiration
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 -mt-20 relative z-20">
          {activeTab === 'assistant' ? (
            <div className="max-w-3xl mx-auto bg-theme-bg border border-theme-border rounded-[2.5rem] p-5 sm:p-8 shadow-sm">
              <TravelAssistantChat />
            </div>
          ) : activeTab === 'planner' ? (
            <div className="max-w-4xl mx-auto">
              <AITripPlanner />
            </div>
          ) : (
            <div className="bg-white border border-theme-border rounded-[2.5rem] p-6 sm:p-10 shadow-sm">
              <TravelInspiration />
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
