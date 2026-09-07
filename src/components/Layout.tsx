import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import FloatingWhatsApp from './FloatingWhatsApp';
import FloatingAssistant from './FloatingAssistant';
import QuickQuoteModal from './QuickQuoteModal';
import BackToTopButton from './BackToTopButton';
import { CurrencyProvider } from '../context/CurrencyContext';
import { HelmetProvider } from 'react-helmet-async';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  useEffect(() => {
    // Scroll to top on initial page load
    window.scrollTo(0, 0);
  }, []);

  return (
    <CurrencyProvider>
      <HelmetProvider>
        <div className="flex min-h-screen flex-col font-sans bg-theme-bg text-theme-heading selection:bg-theme-gold selection:text-theme-heading">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <FloatingWhatsApp />
          <FloatingAssistant />
          <QuickQuoteModal />
          <BackToTopButton />
        </div>
      </HelmetProvider>
    </CurrencyProvider>
  );
}
