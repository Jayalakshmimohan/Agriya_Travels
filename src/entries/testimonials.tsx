import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from '../components/Layout';
import TestimonialsPage from '../pages/TestimonialsPage';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Layout>
      <TestimonialsPage />
    </Layout>
  </StrictMode>
);
