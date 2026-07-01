import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Map } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data';
import { motion, AnimatePresence } from 'motion/react';

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80", // India / Taj Mahal
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80", // Dubai
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80", // Kerala Backwaters
  "https://images.unsplash.com/photo-1588713028392-16ee912e52fa?auto=format&fit=crop&q=80", // Europe / Swiss
];

export default function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Agriya Travels, I am looking to plan a trip.')}`;

  return (
    <div className="relative rounded-[2rem] bg-theme-navy h-[400px] sm:h-[500px] overflow-hidden shadow-2xl flex items-center p-8 sm:p-16 w-full group">
      {/* Background Image Carousel */}
      <AnimatePresence mode="popLayout">
        <motion.img
          key={currentImageIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.6, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          src={HERO_IMAGES[currentImageIndex]}
          alt="Premium travel destination"
          className="absolute inset-0 h-full w-full object-cover mix-blend-overlay"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-agriya-navy via-agriya-navy/80 to-transparent z-0" />

      <div className="relative z-10 max-w-2xl text-left">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-theme-gold text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-4 block"
        >
          Chennai's Premium Travel Agency
        </motion.span>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white font-serif mb-6 leading-tight"
        >
          Curating Your <br/>
          <span className="text-theme-gold italic font-light">Perfect Journey</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-slate-200 text-xs sm:text-sm lg:text-base mb-8 sm:mb-10 max-w-md leading-relaxed font-light"
        >
          From spiritual pilgrimages to luxury international escapes. Experience seamless travel planning crafted with care and expertise.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap gap-4"
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-theme-gold text-theme-heading px-6 sm:px-8 py-3 sm:py-4 rounded-full text-xs font-bold shadow-xl hover:shadow-2xl hover:bg-[#ebd074] hover:-translate-y-0.5 transition-all duration-300"
          >
            <Phone className="h-4 w-4" />
            PLAN ON WHATSAPP
          </a>
          <Link
            to="/india-tours"
            className="flex items-center gap-2 border border-theme-gold/30 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-xs font-bold backdrop-blur-md hover:bg-theme-card/10 transition-all duration-300"
          >
            <Map className="h-4 w-4" />
            Explore Destinations
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
