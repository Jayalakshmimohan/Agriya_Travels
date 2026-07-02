import React from 'react';
import { tourPackages } from '../data';
import PackageCard from '../components/PackageCard';
import SEO from '../components/SEO';
import { useCurrency } from '../context/CurrencyContext';
import PageTransition from '../components/PageTransition';

interface PackagesPageProps {
  filterCategory: string;
  title: string;
  description: string;
}

export default function PackagesPage({ filterCategory, title, description }: PackagesPageProps) {
  const packages = tourPackages.filter(p => p.category === filterCategory);
  const { currency } = useCurrency();
  const isInternational = filterCategory === 'International';

  return (
    <PageTransition>
      <SEO 
        title={title} 
        description={description}
        keywords={`${title}, ${filterCategory} tours, travel packages, holiday packages, Agriya Travels`}
      />
      <div className="bg-theme-bg min-h-screen pb-24">
      {/* Header */}
      <div className="bg-theme-navy text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-theme-gold/10 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl font-bold font-serif text-white sm:text-5xl">{title}</h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 font-light max-w-2xl mx-auto">
            {description}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        {packages.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
            {packages.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} displayCurrency={currency} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-xl font-medium text-theme-heading">More packages coming soon!</h3>
            <p className="mt-2 text-theme-muted">Contact us on WhatsApp for custom itineraries.</p>
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
