import { Link } from 'react-router-dom';
import { Plane, MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-theme-card border-t border-theme-border text-theme-muted shrink-0 mt-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-theme-gold/5 rounded-bl-full pointer-events-none" />
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8 relative z-10">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-6 xl:col-span-1">
             <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
              <div className="flex w-8 h-8 items-center justify-center rounded-lg bg-theme-navy text-theme-gold font-serif font-bold text-lg">
                A
              </div>
              <div>
                <span className="block text-lg font-bold tracking-tight text-theme-heading leading-none font-serif">
                  Agriya<span className="text-theme-gold italic">Travels</span>
                </span>
              </div>
            </Link>
            <p className="text-[11px] leading-relaxed text-theme-muted max-w-sm font-light">
              Your trusted premium travel partner in Chennai. Specializing in India tours, international holidays, pilgrimage trips, and luxury vacations.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-slate-400 hover:text-theme-gold transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="text-slate-400 hover:text-theme-gold transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="text-slate-400 hover:text-theme-gold transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-[10px] font-bold text-theme-heading uppercase tracking-widest">Quick Links</h3>
                <ul role="list" className="mt-4 space-y-3">
                  <li><Link to="/about" className="text-xs font-light text-theme-muted hover:text-theme-heading transition-colors">About Us</Link></li>
                  <li><Link to="/india-tours" className="text-xs font-light text-theme-muted hover:text-theme-heading transition-colors">India Tours</Link></li>
                  <li><Link to="/international-tours" className="text-xs font-light text-theme-muted hover:text-theme-heading transition-colors">International Packages</Link></li>
                  <li><Link to="/ai-planner" className="text-xs font-light text-theme-muted hover:text-theme-heading transition-colors">Trip Planner</Link></li>
                  <li><Link to="/gallery" className="text-xs font-light text-theme-muted hover:text-theme-heading transition-colors">Gallery</Link></li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-[10px] font-bold text-theme-heading uppercase tracking-widest">Services</h3>
                <ul role="list" className="mt-4 space-y-3">
                  <li><Link to="/theme-tours" className="text-xs font-light text-theme-muted hover:text-theme-heading transition-colors">Theme-Based Tours</Link></li>
                  <li><Link to="/rentals" className="text-xs font-light text-theme-muted hover:text-theme-heading transition-colors">Premium Transfers</Link></li>
                  <li><Link to="/corporate" className="text-xs font-light text-theme-muted hover:text-theme-heading transition-colors">Corporate Travel</Link></li>
                  <li><Link to="/contact" className="text-xs font-light text-theme-muted hover:text-theme-heading transition-colors">Contact Support</Link></li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-1 md:gap-8">
              <div>
                <h3 className="text-[10px] font-bold text-theme-heading uppercase tracking-widest">Contact Us</h3>
                <ul role="list" className="mt-4 space-y-3">
                  <li className="flex gap-2 items-start text-xs text-theme-muted font-light">
                    <MapPin className="h-3.5 w-3.5 text-theme-gold shrink-0 mt-0.5" />
                    <span>No. 2B, Navalar Street, Avadi Road,<br />Karayanchavadi, Chennai - 600056</span>
                  </li>
                  <li className="flex gap-2 items-center text-xs text-theme-muted font-light">
                    <Phone className="h-3.5 w-3.5 text-theme-gold shrink-0" />
                    <span>+91 9710405044 / +91 9941938222</span>
                  </li>
                  <li className="flex gap-2 items-center text-xs text-theme-muted font-light">
                    <Mail className="h-3.5 w-3.5 text-theme-gold shrink-0" />
                    <span>hello@agriyatravels.com</span>
                  </li>
                </ul>
                <div className="mt-5">
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 mt-2 text-xs font-bold text-white shadow hover:-translate-y-0.5 hover:shadow-lg transition-all"
                  >
                    <Phone className="h-3.5 w-3.5 fill-current" />
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-theme-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-6 uppercase tracking-[0.2em] text-[9px] font-bold text-slate-400">
             <span>24/7 Support</span>
             <span>Budget to Luxury</span>
             <span className="hidden sm:inline">Certified Travel Experts</span>
          </div>
          <p className="text-[10px] text-slate-400 font-light">
            &copy; {currentYear} Agriya Travels, Chennai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
