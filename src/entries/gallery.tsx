import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from '../components/Layout';
import GalleryPage from '../pages/GalleryPage';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Layout>
      <GalleryPage />
    </Layout>
  </StrictMode>
);
