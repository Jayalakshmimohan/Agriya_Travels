import { useState } from 'react';
import ContactForm from '../components/ContactForm';
import FleetCard, { FleetOption } from '../components/FleetCard';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import SEO from '../components/SEO';
import PageTransition from '../components/PageTransition';
import { CAB_BOOKING_EMAIL, TOUR_ENQUIRY_EMAIL } from '../data';

interface ContactPageProps {
  title?: string;
  focus?: 'general' | 'rentals' | 'corporate';
}

export default function ContactPage({ title = "Contact Us", focus = 'general' }: ContactPageProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');

  let description = "Ready to start planning your next journey? Fill out the form below or reach out to us directly.";

  if (focus === 'rentals') {
    description = "Enquire about our sedan, SUV, tempo traveller, or van rentals. Perfect for airport drops, outstation trips, and pilgrimage tours.";
  } else if (focus === 'corporate') {
    description = "Streamline your business travel with Agriya Travels. Contact our corporate desk for specialized routing and B2B pricing.";
  }

  const primaryEmail = focus === 'rentals' ? CAB_BOOKING_EMAIL : TOUR_ENQUIRY_EMAIL;

  const fleetOptions: FleetOption[] = [
    {
      id: 'sedan',
      title: 'Sedans',
      subtitle: '(Dezire, Etios)',
      value: 'Sedan (Dzire / Etios - 4 Seater)',
      images: [
        '/Sedan/Car-1.jpeg',
        '/Sedan/Car-2.jpeg',
        '/Sedan/Car-4.jpeg',
        '/Sedan/Car-6.jpeg',
        '/Sedan/Car-7.jpeg',
        '/Sedan/Car-9.jpeg'
      ]
    },
    {
      id: 'suv',
      title: 'SUVs',
      subtitle: '(Innova, Crysta)',
      value: 'SUV (Innova / Crysta - 6-7 Seater)',
      images: [
        '/SUV/Car-2.jpeg',
        '/SUV/Car-4.jpeg',
        '/SUV/Car-5.jpeg',
        '/SUV/Car-6.jpeg'
      ]
    },
    {
      id: 'tempo',
      title: 'Tempo Travellers',
      subtitle: '(12-26 seaters)',
      value: 'Tempo Traveller (12-26 Seater)',
      images: [
        '/Tempo/Tempo-1.jpeg',
        '/Tempo/Maxi-Cab-1.jpeg',
        '/Tempo/Maxi-Cab.jpeg',
        '/Tempo/Incredible India-1.jpeg',
        '/Tempo/Incredible India-2.jpeg'
      ]
    },
    {
      id: 'luxury',
      title: 'Luxury Vans',
      subtitle: 'Premium',
      value: 'Luxury Van (Urbania / Commuter)',
      images: [
        '/Luxury/Tour Van.jpeg',
        '/Luxury/Tour Van-2.jpeg',
        '/Luxury/Tour Van-4.jpeg',
        '/Luxury/Tour Van-5.jpeg',
        '/Luxury/Tour Van-6.jpeg'
      ]
    }
  ];

  return (
    <PageTransition>
      <SEO
        title={title}
        description={description}
        keywords="contact Agriya Travels, customer support, travel booking, car rentals Chennai, corporate travel, cab booking"
      />
      <div className="bg-theme-card min-h-screen">
        <div className="bg-theme-navy text-white py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-theme-gold/10 to-transparent pointer-events-none" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-3xl font-bold font-serif text-white sm:text-5xl">{title}</h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 font-light max-w-2xl mx-auto">
              {description}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-theme-card p-6 sm:p-7 rounded-3xl border border-theme-border shadow-sm">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-theme-border">
                  <img
                    src="/logo.png"
                    alt="Agriya Travels"
                    className="h-14 w-14 object-contain rounded-2xl bg-white p-1 shadow-sm border border-theme-border/40 shrink-0"
                  />
                  <div>
                    <h3 className="text-xl font-bold font-serif text-theme-heading leading-tight">Agriya Travels</h3>
                    <p className="text-[11px] text-theme-muted font-light mt-0.5">Journeys • Memories • Trust</p>
                    <p className="text-[10px] text-theme-gold font-bold uppercase tracking-wider mt-1">Chennai, Tamil Nadu</p>
                  </div>
                </div>
                <h4 className="text-xs font-bold font-serif uppercase tracking-widest text-slate-400 mb-6">Headquarters & Support</h4>
                <ul className="space-y-6">
                  <li className="flex gap-4 items-start">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-theme-navy/5 text-theme-gold">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-theme-heading">Head Office</h4>
                      <p className="mt-1 text-sm text-theme-muted font-light">No. 2B, Navalar Street, Avadi Road,<br />Karayanchavadi, Chennai - 600056</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-theme-navy/5 text-theme-gold">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-theme-heading">Phone & WhatsApp</h4>
                      <p className="mt-1 text-sm text-theme-muted font-light">+91 9941938222 / +91 9380054540 (WA)</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-theme-navy/5 text-theme-gold">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-theme-heading">
                        {focus === 'rentals' ? 'Cab Booking Email' : 'Tour Enquiry Email'}
                      </h4>
                      <a 
                        href={`mailto:${primaryEmail}${focus !== 'rentals' ? '?cc=saravana@agriyatravels.com' : ''}`} 
                        className="mt-1 text-sm text-theme-gold font-medium hover:underline block break-all"
                      >
                        {primaryEmail}
                      </a>
                      {focus !== 'rentals' && (
                        <p className="text-[11px] text-theme-muted font-light mt-0.5">
                          CC: <span className="text-slate-400">saravana@agriyatravels.com</span>
                        </p>
                      )}
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-theme-navy/5 text-theme-gold">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-theme-heading">Business Hours</h4>
                      <p className="mt-1 text-sm text-theme-muted font-light">Mon - Sat: 9:00 AM - 8:00 PM<br />24/7 Support for Active Travelers</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-2 relative">
              {focus === 'rentals' && (
                <div className="mb-8 rounded-2xl bg-theme-card border border-theme-border shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
                    <div>
                      <h4 className="font-bold font-serif text-theme-heading">Available Fleet</h4>
                      <p className="text-[11px] text-theme-muted font-light mt-0.5">Hover over vehicles to preview car photos • Click to select for booking</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {fleetOptions.map((fleet) => (
                      <FleetCard
                        key={fleet.id}
                        fleet={fleet}
                        isSelected={selectedVehicle === fleet.value}
                        onSelect={() => setSelectedVehicle(selectedVehicle === fleet.value ? '' : fleet.value)}
                      />
                    ))}
                  </div>

                  <div className="bg-theme-navy/5 p-3 rounded-xl border border-theme-border/50">
                    <p className="text-xs text-theme-muted font-light italic">
                      * Disclaimer: The vehicle images shown above are for visual representation and planning purposes only. The actual vehicle model, color, and condition may vary based on availability. Let us know your requirement in the message box below.
                    </p>
                  </div>
                </div>
              )}
              <ContactForm 
                focus={focus} 
                selectedVehicle={selectedVehicle}
                onSelectVehicle={setSelectedVehicle}
              />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

