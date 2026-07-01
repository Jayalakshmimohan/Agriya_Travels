import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Plane, Phone, ChevronDown, Moon, Sun, Search, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { WHATSAPP_NUMBER, tourPackages } from '../data';
import { useCurrency } from '../context/CurrencyContext';
import { motion, AnimatePresence } from 'motion/react';

const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'About Us', path: '/about' },
  { name: 'India Tours', path: '/india-tours' },
  { name: 'International', path: '/international-tours' },
  { name: 'More', path: '#', hasDropdown: true },
  { name: 'Trip Planner', path: '/ai-planner' },
];

const DROPDOWN_LINKS = [
  { name: 'Theme-Based Tours', path: '/theme-tours' },
  { name: 'Car & Rentals', path: '/rentals' },
  { name: 'Corporate Travel', path: '/corporate' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'Testimonials', path: '/testimonials' },
  { name: 'Contact Us', path: '/contact' },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const { currency, setCurrency } = useCurrency();

  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  const searchResults = searchQuery.trim() === '' ? [] : tourPackages.filter(pkg => 
    pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    pkg.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Agriya Travels, I want to plan a trip.')}`;

  return (
    <header className="sticky top-0 z-40 w-full bg-theme-card border-b border-theme-border shrink-0 transition-all">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
          <div className="flex w-8 h-8 sm:w-10 sm:h-10 items-center justify-center rounded-lg bg-theme-navy text-theme-gold font-serif font-bold text-lg sm:text-xl">
            A
          </div>
          <div>
            <span className="block text-lg sm:text-xl font-bold tracking-tight text-theme-heading leading-none font-serif">
              Agriya<span className="text-theme-gold italic">Travels</span>
            </span>
            <p className="text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-0.5 hidden sm:block">Excellence in Journeys</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 lg:flex text-[13px]">
          {NAV_LINKS.map((link) => (
            <div key={link.name} className="relative group">
              {link.hasDropdown ? (
                <button
                  className="flex items-center gap-1 font-bold text-theme-muted transition-colors hover:text-theme-heading focus:outline-none"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  {link.name}
                  <ChevronDown className="h-4 w-4" />
                  
                  {isDropdownOpen && (
                    <div className="absolute left-0 top-full pt-4 w-56 z-50">
                      <div className="rounded-2xl border border-theme-border bg-theme-card p-2 shadow-xl">
                        {DROPDOWN_LINKS.map((dropLink) => (
                          <Link
                            key={dropLink.name}
                            to={dropLink.path}
                            className="block rounded-xl px-4 py-3 text-xs font-bold text-theme-muted hover:bg-theme-navy/5 hover:text-theme-heading"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            {dropLink.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              ) : (
                <Link
                  to={link.path}
                  className={cn(
                    "font-bold transition-colors hover:text-theme-heading",
                    location.pathname === link.path ? "text-theme-heading" : "text-theme-muted"
                  )}
                >
                  {link.name}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => setIsSearchOpen(true)} 
            className="p-2 text-theme-muted hover:text-theme-heading rounded-full hover:bg-theme-border transition-colors"
            aria-label="Search Packages"
          >
            <Search className="h-5 w-5" />
          </button>
          
          <div className="relative group">
            <button className="flex items-center gap-1 text-xs font-bold text-theme-muted hover:text-theme-heading transition-colors">
              {currency} <ChevronDown className="h-3 w-3" />
            </button>
            <div className="absolute top-full left-0 pt-2 hidden group-hover:block z-50">
              <div className="rounded-xl border border-theme-border bg-theme-card p-1 shadow-lg flex flex-col w-20">
                {(['INR', 'USD', 'EUR'] as const).map(cur => (
                  <button
                    key={cur}
                    onClick={() => setCurrency(cur)}
                    className={cn("px-3 py-1.5 text-left text-xs font-bold rounded-lg transition-colors", currency === cur ? "bg-theme-navy/5 text-theme-heading" : "text-theme-muted hover:bg-theme-navy/5 hover:text-theme-heading")}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={toggleTheme} 
            className="p-2 text-theme-muted hover:text-theme-heading rounded-full hover:bg-theme-border transition-colors"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-white shadow hover:shadow-md transition"
          >
            <Phone className="h-4 w-4" />
            PLAN ON WHATSAPP
          </a>
        </div>

        {/* Mobile menu button & Theme toggle */}
        <div className="flex items-center gap-1 sm:gap-2 lg:hidden">
          <button 
            onClick={() => setIsSearchOpen(true)} 
            className="p-2 text-theme-muted hover:text-theme-heading rounded-full hover:bg-theme-border transition-colors"
            aria-label="Search Packages"
          >
            <Search className="h-5 w-5" />
          </button>

          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value as any)}
            className="bg-transparent text-xs font-bold text-theme-muted border-none outline-none focus:ring-0 mr-1 hidden sm:block"
          >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
          
          <button 
            onClick={toggleTheme} 
            className="p-2 text-theme-muted hover:text-theme-heading rounded-full hover:bg-theme-border transition-colors"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button
            className="flex items-center justify-center rounded-md p-2 text-theme-muted hover:bg-theme-border focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="border-b border-theme-border bg-theme-card lg:hidden">
          <nav className="flex flex-col space-y-2 px-4 pb-6 pt-4">
            {NAV_LINKS.filter(l => !l.hasDropdown).map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "block rounded-xl px-4 py-3 text-sm font-bold",
                  location.pathname === link.path ? "bg-theme-navy/5 text-theme-heading" : "text-theme-muted hover:bg-theme-card"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-2 pb-1 pl-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              More
            </div>
            {DROPDOWN_LINKS.map((link) => (
               <Link
               key={link.name}
               to={link.path}
               className={cn(
                 "block rounded-xl px-4 py-3 text-sm font-bold text-theme-muted hover:bg-theme-card"
               )}
               onClick={() => setIsMobileMenuOpen(false)}
             >
               {link.name}
             </Link>
            ))}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-4 text-center text-xs font-bold text-white shadow-sm hover:shadow-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Phone className="h-4 w-4" />
              Book on WhatsApp
            </a>
          </nav>
        </div>
      )}

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-theme-card/95 backdrop-blur-md flex flex-col"
          >
            <div className="flex items-center px-4 sm:px-8 h-20 border-b border-theme-border shrink-0 max-w-[1400px] w-full mx-auto">
              <Search className="h-6 w-6 text-theme-muted" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search destinations, packages, or themes..."
                className="flex-1 bg-transparent border-none outline-none px-4 text-lg font-medium text-theme-heading placeholder:text-slate-400 focus:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 text-theme-muted hover:text-theme-heading rounded-full hover:bg-theme-border transition-colors ml-4"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-[1400px] w-full mx-auto">
              {searchQuery.trim() === '' ? (
                <div className="text-center text-theme-muted mt-12 flex flex-col items-center">
                  <Search className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-lg">Type to start searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {searchResults.map((pkg) => (
                    <Link
                      key={pkg.id}
                      to={`/${pkg.category === 'India' ? 'india-tours' : pkg.category === 'International' ? 'international-tours' : 'theme-tours'}?package=${pkg.id}`}
                      className="group flex flex-col bg-theme-navy/5 rounded-2xl overflow-hidden hover:shadow-md transition-all border border-theme-border/50"
                      onClick={() => setIsSearchOpen(false)}
                    >
                      <div className="h-32 bg-slate-200 relative overflow-hidden">
                        <img 
                          src={pkg.imageUrl} 
                          alt={pkg.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-theme-gold mb-1">
                          <MapPin className="h-3 w-3" /> {pkg.category}
                        </div>
                        <h4 className="font-bold text-theme-heading text-sm mb-2 line-clamp-1">{pkg.title}</h4>
                        <p className="text-xs text-theme-muted line-clamp-2 mt-auto">{pkg.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center text-theme-muted mt-12 flex flex-col items-center">
                  <Plane className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-lg">No packages found for "{searchQuery}"</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-theme-gold font-bold hover:underline"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
