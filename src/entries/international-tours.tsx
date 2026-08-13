import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from '../components/Layout';
import PackagesPage from '../pages/PackagesPage';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Layout>
      <PackagesPage 
        filterCategory="International" 
        title="International Holidays" 
        description="Discover the world with our premium international holiday packages, curated luxury escapes, and seamless visa assistance." 
      />
    </Layout>
  </StrictMode>
);
