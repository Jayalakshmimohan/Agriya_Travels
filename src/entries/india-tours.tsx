import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from '../components/Layout';
import PackagesPage from '../pages/PackagesPage';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Layout>
      <PackagesPage 
        filterCategory="India" 
        title="India Tour Packages" 
        description="Explore the beauty, heritage, and spiritual majesty of India with our meticulously crafted tour packages." 
      />
    </Layout>
  </StrictMode>
);
