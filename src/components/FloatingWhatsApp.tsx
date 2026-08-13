import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Mail, X, Bell, BellOff } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data';
import { motion, AnimatePresence } from 'motion/react';

export default function FloatingWhatsApp() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const savedMutedState = localStorage.getItem('whatsappMuted');
      if (savedMutedState) {
        setIsMuted(savedMutedState === 'true');
      }
    }
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('whatsappMuted', String(newMutedState));
    }
  };
  
  useEffect(() => {
    if (hasInteracted) return;

    const timer = setTimeout(() => {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 600);
    }, 30000);

    return () => clearTimeout(timer);
  }, [hasInteracted]);

  // Auto-close after 10 seconds of no interaction
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isOpen && !isHovered) {
      timeoutId = setTimeout(() => {
        setIsOpen(false);
      }, 10000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOpen, isHovered]);

  const toggleOpen = () => {
    setHasInteracted(true);
    setIsOpen(!isOpen);
  };

  const currentHour = new Date().getHours();
  const isBusinessHours = currentHour >= 9 && currentHour < 18;
  
  const message = isBusinessHours 
    ? `Hi Agriya Travels, I am interested in your travel packages.` 
    : `Hello Agriya Travels, I have a travel inquiry.`;
  
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      className="fixed bottom-[120px] lg:bottom-6 right-4 lg:right-8 z-[60]" 
      ref={menuRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className="absolute bottom-20 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
          >
            <div className="bg-theme-navy text-white p-4 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm">Need Help?</h4>
                <div className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-[10px] text-white">
                  {isBusinessHours ? 'Typically replies within 30 minutes' : 'Back online at 9 AM'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleMute} 
                  className="text-white hover:text-gray-300 focus:outline-none p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  title={isMuted ? "Unmute notifications" : "Mute notifications"}
                >
                  {isMuted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-white hover:text-gray-300 focus:outline-none p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="p-2 flex flex-col gap-1">
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group"
              >
                <div className="bg-[#25D366]/10 p-2 rounded-full text-[#25D366]">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-theme-heading group-hover:text-[#25D366] transition-colors">WhatsApp</div>
                  <div className="text-xs text-theme-muted">Usually replies instantly</div>
                </div>
              </a>

              <a 
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group"
              >
                <div className="bg-theme-gold/10 p-2 rounded-full text-theme-gold">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-theme-heading group-hover:text-theme-gold transition-colors">Contact Form</div>
                  <div className="text-xs text-theme-muted">Send us an email inquiry</div>
                </div>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="group flex items-center relative">
        <div className="absolute right-full mr-4 px-3 py-1.5 bg-theme-navy text-white text-xs font-bold rounded-lg shadow-lg opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap pointer-events-none before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:left-full before:border-4 before:border-transparent before:border-l-theme-navy">
          Need help?
        </div>
        <motion.button
          initial={{ scale: 0 }}
          animate={shouldShake ? "shake" : "visible"}
          variants={{
            visible: { scale: 1, rotate: 0, transition: { type: "spring", bounce: 0.5, delay: 1 } },
            shake: { scale: 1, rotate: [0, -10, 10, -10, 10, 0], transition: { duration: 0.5 } }
          }}
          onClick={toggleOpen}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_30px_rgb(37,211,102,0.4)] transition-all hover:scale-110 hover:shadow-[0_8px_30px_rgb(37,211,102,0.6)] focus:outline-none before:absolute before:inset-0 before:-z-10 before:rounded-full before:animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] ${isOpen ? 'bg-theme-navy before:bg-theme-navy' : 'bg-[#25D366] before:bg-[#25D366]'}`}
          aria-label="Need help options"
        >
          {isOpen ? (
            <X className="h-7 w-7 relative z-10 transition-transform rotate-90" />
          ) : (
            <>
              <MessageCircle className="h-7 w-7 relative z-10" />
              <span 
                className={`absolute top-0 right-0 z-20 h-4 w-4 rounded-full border-2 border-white ${isBusinessHours ? 'bg-green-500' : 'bg-amber-500'}`} 
                title={isBusinessHours ? 'Online (Replies instantly)' : 'Away (Replies in a few hours)'}
              />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
