import React, { useState } from 'react';
import { X, Maximize2, Compass, MapPin, ZoomIn, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import PageTransition from '../components/PageTransition';
import LazyImage from '../components/LazyImage';

interface GalleryItem {
  id: string;
  src: string;
  title: string;
  region: 'India' | 'International';
  packageId: string;
  path: string;
  shortDesc: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=800',
    title: 'Taj Mahal, Agra',
    region: 'India',
    packageId: 'ind-7',
    path: '/india-tours',
    shortDesc: 'A monument of eternal love and breathtaking Mughal architecture.'
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800',
    title: 'Burj Khalifa, Dubai',
    region: 'International',
    packageId: 'int-1',
    path: '/international-tours',
    shortDesc: 'Futuristic glass skyscrapers and golden desert adventure.'
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=800',
    title: 'Munnar Hills, Kerala',
    region: 'India',
    packageId: 'ind-1',
    path: '/india-tours',
    shortDesc: 'Lush green tea gardens, mist-filled valleys, and tranquil backwaters.'
  },
  {
    id: '4',
    src: 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?auto=format&fit=crop&q=80&w=800',
    title: 'Eiffel Tower, Paris',
    region: 'International',
    packageId: 'int-4',
    path: '/international-tours',
    shortDesc: 'The global capital of romance, exquisite art, and Alpine grandeur.'
  },
  {
    id: '5',
    src: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800',
    title: 'Shore Temple, Mahabalipuram',
    region: 'India',
    packageId: 'ind-3',
    path: '/india-tours',
    shortDesc: 'Magnificent 8th-century rock-cut carvings and beach temples.'
  },
  {
    id: '6',
    src: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=800',
    title: 'Overwater Villa, Maldives',
    region: 'International',
    packageId: 'int-5',
    path: '/international-tours',
    shortDesc: 'Crystal-clear turquoise waters and intimate luxury overwater stays.'
  },
  {
    id: '7',
    src: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
    title: 'Uluwatu Cliffs, Bali',
    region: 'International',
    packageId: 'int-6',
    path: '/international-tours',
    shortDesc: 'Vibrant volcanic sunsets, spiritual sea temples, and surf beaches.'
  },
  {
    id: '8',
    src: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=800',
    title: 'Dal Lake, Kashmir',
    region: 'India',
    packageId: 'ind-2',
    path: '/india-tours',
    shortDesc: 'Snow-clad peaks, scenic Shikara rides, and warm houseboats.'
  },
  {
    id: '9',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=800',
    title: 'Matterhorn Peak, Swiss Alps',
    region: 'International',
    packageId: 'int-7',
    path: '/international-tours',
    shortDesc: 'Spectacular mountain peaks, deep glaciers, and alpine serenity.'
  },
  {
    id: '10',
    src: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80&w=800',
    title: 'Nubra Valley, Ladakh',
    region: 'India',
    packageId: 'ind-8',
    path: '/india-tours',
    shortDesc: 'High mountain desert passes, remote monasteries, and sand dunes.'
  },
  {
    id: '11',
    src: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=800',
    title: 'Railay Beach, Thailand',
    region: 'International',
    packageId: 'int-3',
    path: '/international-tours',
    shortDesc: 'Emerald waters, stunning limestone karst cliffs, and tropical bliss.'
  },
  {
    id: '12',
    src: 'https://images.unsplash.com/photo-1496566084516-c5b96fcbd5c8?auto=format&fit=crop&q=80&w=800',
    title: 'Golden Sands, Goa',
    region: 'India',
    packageId: 'ind-4',
    path: '/india-tours',
    shortDesc: 'Sun-kissed coastlines, colonial architecture, and lively nights.'
  },
  {
    id: '13',
    src: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=800',
    title: 'Pine Valleys, Shimla',
    region: 'India',
    packageId: 'ind-9',
    path: '/india-tours',
    shortDesc: 'Enchanting colonial heritage stations and snow adventure trails.'
  },
  {
    id: '14',
    src: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800',
    title: 'Shibuya Skyline, Tokyo',
    region: 'International',
    packageId: 'int-8',
    path: '/international-tours',
    shortDesc: 'Exquisite cherry blossoms, imperial shrines, and neon-lit skies.'
  },
  {
    id: '15',
    src: 'https://images.unsplash.com/photo-1722934804353-0d9f6a55ab5e?auto=format&fit=crop&q=80&w=800',
    title: 'Stone Chariot, Hampi',
    region: 'India',
    packageId: 'ind-10',
    path: '/india-tours',
    shortDesc: 'Majestic ancient ruins, boulders, and architectural grandeur.'
  }
];

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filterRegion, setFilterRegion] = useState<'all' | 'India' | 'International'>('all');
  const navigate = useNavigate();

  const getHighRes = (src: string) => src.replace('&w=800', '&w=1600');

  const filteredItems = GALLERY_ITEMS.filter(item => 
    filterRegion === 'all' ? true : item.region === filterRegion
  );

  const handleSelectPackage = (path: string, packageId: string) => {
    navigate(`${path}?package=${packageId}`);
  };

  return (
    <PageTransition>
      <SEO 
        title="Our Travel Gallery - Memories Across the World" 
        description="Take a visual journey of premium destinations across India and the globe. Handpicked memories from Agriya Travels."
        keywords="travel gallery, tour photos, Agriya Travels, vacation pictures, India tours, international tours"
      />
      <div className="bg-theme-bg min-h-screen pb-24">
        {/* Header */}
        <div className="bg-theme-navy text-white py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-theme-gold/10 to-transparent pointer-events-none" />
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-theme-teal/10 rounded-full blur-3xl pointer-events-none" />
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-theme-gold bg-white/5 py-1.5 px-3.5 rounded-full border border-white/10 inline-block mb-4">
              ✨ Captured Moments
            </span>
            <h1 className="text-3xl font-bold font-serif text-white sm:text-5xl">Our Travel Memories</h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 font-light max-w-2xl mx-auto">
              A glimpse into the extraordinary moments, majestic landscapes, and timeless heritage captured across our curated tours.
            </p>
          </div>
        </div>

        {/* Filters bar */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex justify-center">
            <div className="inline-flex bg-white p-1.5 rounded-full border border-theme-border/60 shadow-sm">
              {(['all', 'India', 'International'] as const).map(region => (
                <button
                  key={region}
                  onClick={() => setFilterRegion(region)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${
                    filterRegion === region 
                      ? 'bg-theme-navy text-white shadow-sm' 
                      : 'text-slate-500 hover:text-theme-navy'
                  }`}
                >
                  {region === 'all' ? 'All Memories' : region}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Gallery Grid */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 mt-12">
          <motion.div 
            layout 
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="relative overflow-hidden rounded-[2rem] group h-80 cursor-pointer shadow-sm hover:shadow-xl border border-theme-border/40 transition-all bg-white flex flex-col"
                >
                  {/* Image container */}
                  <div className="w-full h-full relative overflow-hidden">
                    <LazyImage
                      src={item.src} 
                      alt={item.title} 
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Dark gradient mask */}
                    <div className="absolute inset-0 bg-gradient-to-t from-theme-navy/95 via-theme-navy/40 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                    
                    {/* Floating Region Badge */}
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-theme-navy text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                      {item.region}
                    </span>

                    {/* Interactive overlay buttons */}
                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(item.src);
                        }}
                        className="p-3 bg-white hover:bg-theme-gold text-theme-navy rounded-full shadow-md hover:scale-110 transition-all"
                        title="Zoom Image"
                      >
                        <ZoomIn className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPackage(item.path, item.packageId);
                        }}
                        className="p-3 bg-white hover:bg-theme-teal text-theme-navy hover:text-white rounded-full shadow-md hover:scale-110 transition-all"
                        title="View Package Details"
                      >
                        <Compass className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Info text at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-10 text-white flex flex-col gap-1 pointer-events-none">
                      <div className="flex items-center gap-1.5 text-theme-gold text-xs font-semibold">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed font-light mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {item.shortDesc}
                      </p>
                      
                      <div className="flex items-center gap-1 text-[10px] text-theme-gold font-bold uppercase tracking-widest mt-2">
                        <span>Go to Package</span>
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>

                  {/* Accessible whole-card click trigger (triggers package detail routing) */}
                  <div 
                    className="absolute inset-0 z-[5]" 
                    onClick={() => handleSelectPackage(item.path, item.packageId)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-8 backdrop-blur-md"
              onClick={() => setSelectedImage(null)}
            >
              <button 
                className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/50 hover:text-white transition-colors p-2.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                }}
              >
                <X className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                src={getHighRes(selectedImage)}
                alt="High Resolution Travel Gallery"
                className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-white/5"
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
