import ContactForm from '../components/ContactForm';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import SEO from '../components/SEO';

interface ContactPageProps {
  title?: string;
  focus?: 'general' | 'rentals' | 'corporate';
}

export default function ContactPage({ title = "Contact Us", focus = 'general' }: ContactPageProps) {
  let description = "Ready to start planning your next journey? Fill out the form below or reach out to us directly.";
  
  if (focus === 'rentals') {
    description = "Enquire about our sedan, SUV, tempo traveller, or van rentals. Perfect for airport drops, outstation trips, and pilgrimage tours.";
  } else if (focus === 'corporate') {
    description = "Streamline your business travel with Agriya Travels. Contact our corporate desk for specialized routing and B2B pricing.";
  }

  return (
    <>
      <SEO 
        title={title} 
        description={description}
        keywords="contact Agriya Travels, customer support, travel booking, car rentals Chennai, corporate travel"
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
            <div>
              <h3 className="text-xl font-bold font-serif text-theme-heading mb-6">Get in Touch</h3>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-theme-navy/5 text-theme-gold">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="pt-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-theme-heading">Head Office</h4>
                    <p className="mt-1 text-sm text-theme-muted font-light">No. 2B, Navalar Street, Avadi Road,<br/>Karayanchavadi, Chennai - 600056</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-theme-navy/5 text-theme-gold">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="pt-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-theme-heading">Phone & WhatsApp</h4>
                    <p className="mt-1 text-sm text-theme-muted font-light">+91 9710405044 / +91 9941938222 (WA)</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-theme-navy/5 text-theme-gold">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="pt-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-theme-heading">Email Us</h4>
                    <p className="mt-1 text-sm text-theme-muted font-light">hello@agriyatravels.com</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-theme-navy/5 text-theme-gold">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="pt-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-theme-heading">Business Hours</h4>
                    <p className="mt-1 text-sm text-theme-muted font-light">Mon - Sat: 9:00 AM - 8:00 PM<br/>24/7 Support for Active Travelers</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="lg:col-span-2 relative">
             {focus === 'rentals' && (
                <div className="mb-8 rounded-2xl bg-theme-card border border-theme-border shadow-sm p-6">
                   <h4 className="font-bold font-serif text-theme-heading mb-2">Available Fleet</h4>
                   <p className="text-sm text-theme-muted font-light">Sedans (Dezire, Etios), SUVs (Innova, Crysta), Tempo Travellers (12-26 seaters), and Luxury Vans. Let us know your requirement in the message box below.</p>
                </div>
             )}
            <ContactForm focus={focus} />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
