import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from '../components/Layout';
import PackagesPage from '../pages/PackagesPage';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Layout>
      <PackagesPage 
        filterCategory="Theme" 
        title="Theme-Based Tours" 
        description="Curated itineraries based on your unique travel passions—from sacred temple circuits and heritage trails to thrilling adventures." 
      />
    </Layout>
  </StrictMode>
);
