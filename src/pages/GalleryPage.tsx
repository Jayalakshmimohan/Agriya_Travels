import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SEO from '../components/SEO';
import PageTransition from '../components/PageTransition';
import LazyImage from '../components/LazyImage';

const IMAGES = [
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1491557345352-5929e343eb89?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=800',
];

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getHighRes = (src: string) => src.replace('&w=800', '&w=1600');

  return (
    <PageTransition>
      <SEO 
        title="Gallery" 
        description="A glimpse into the extraordinary moments captured across our tours. Explore the beauty of our destinations."
        keywords="travel gallery, tour photos, Agriya Travels, vacation pictures"
      />
      <div className="bg-theme-bg min-h-screen pb-24">
      {/* Header */}
      <div className="bg-theme-navy text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-theme-gold/10 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl font-bold font-serif text-white sm:text-5xl">Our Memories</h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 font-light max-w-2xl mx-auto">
            A glimpse into the extraordinary moments captured across our tours.
          </p>
        </div>
      </div>
      
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
          {IMAGES.map((src, i) => (
            <div 
              key={i} 
              className="relative overflow-hidden rounded-[1.5rem] group h-72 cursor-pointer shadow-sm hover:shadow-xl transition-all"
              onClick={() => setSelectedImage(src)}
            >
              <LazyImage
                src={src} 
                alt={`Travel Gallery ${i + 1}`} 
                containerClassName="w-full h-full"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-theme-navy/0 group-hover:bg-theme-navy/20 transition-colors pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-theme-card/10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <X className="w-8 h-8 sm:w-10 sm:h-10" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
              src={getHighRes(selectedImage)}
              alt="High Resolution Travel Gallery"
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </PageTransition>
  );
}
