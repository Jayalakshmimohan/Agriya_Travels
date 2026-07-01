import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';

import QuickQuoteModal from './components/QuickQuoteModal';
import BackToTopButton from './components/BackToTopButton';

import { HelmetProvider } from 'react-helmet-async';
import { CurrencyProvider } from './context/CurrencyContext';
import { Loader2 } from 'lucide-react';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const PackagesPage = lazy(() => import('./pages/PackagesPage'));
const AiTripPlannerPage = lazy(() => import('./pages/AiTripPlannerPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const TestimonialsPage = lazy(() => import('./pages/TestimonialsPage'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-theme-gold" />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <div key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/india-tours" element={<PackagesPage filterCategory="India" title="India Tour Packages" description="Explore the beauty of India with our meticulously crafted tour packages." />} />
          <Route path="/international-tours" element={<PackagesPage filterCategory="International" title="International Holidays" description="Discover the world with our premium international holiday packages." />} />
          <Route path="/theme-tours" element={<PackagesPage filterCategory="Theme" title="Theme-Based Tours" description="Curated itineraries based on your unique travel preferences." />} />
        
        {/* The rest could reuse a generic Content page or Contact for now */}
        <Route path="/rentals" element={<ContactPage focus="rentals" title="Car & Vehicle Rentals" />} />
        <Route path="/corporate" element={<ContactPage focus="corporate" title="Corporate Travel Support" />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
        
        <Route path="/ai-planner" element={<AiTripPlannerPage />} />
        <Route path="/contact" element={<ContactPage title="Contact Us" />} />
        
        <Route path="*" element={<Home />} />
      </Routes>
      </div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <CurrencyProvider>
      <HelmetProvider>
        <Router>
          <ScrollToTop />
          <div className="flex min-h-screen flex-col font-sans bg-theme-bg">
            <Header />
            <main className="flex-1">
              <Suspense fallback={<LoadingFallback />}>
                <AnimatedRoutes />
              </Suspense>
            </main>
            <Footer />
            <FloatingWhatsApp />
            <QuickQuoteModal />
            <BackToTopButton />
          </div>
        </Router>
      </HelmetProvider>
    </CurrencyProvider>
  );
}
