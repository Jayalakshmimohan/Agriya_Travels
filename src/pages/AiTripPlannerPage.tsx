import AITripPlanner from '../components/AITripPlanner';
import SEO from '../components/SEO';

export default function AiTripPlannerPage() {
  return (
    <>
      <SEO 
        title="Trip Planner" 
        description="Plan your next holiday instantly with Agriya Travels' AI-Powered Trip Planner. Get a day-by-day customized itinerary based on your preferences."
        keywords="AI trip planner, custom itinerary, holiday planning, smart travel assistant"
      />
      <div className="bg-theme-card min-h-screen">
      <div className="bg-theme-navy text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-theme-gold/10 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl font-bold font-serif text-white sm:text-5xl mb-4">
            AI-Powered Trip Planning
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 font-light max-w-2xl mx-auto">
            Let our smart assistant generate a custom day-by-day outline based on your exact budget, schedule, and preferences. Design your perfect escape seamlessly.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <AITripPlanner />
      </div>
    </div>
    </>
  );
}
