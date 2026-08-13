import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from '../components/Layout';
import ContactPage from '../pages/ContactPage';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Layout>
      <ContactPage 
        focus="rentals" 
        title="Car & Vehicle Rentals" 
      />
    </Layout>
  </StrictMode>
);
