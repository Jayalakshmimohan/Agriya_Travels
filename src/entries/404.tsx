import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from '../components/Layout';
import NotFoundPage from '../pages/NotFoundPage';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Layout>
      <NotFoundPage />
    </Layout>
  </StrictMode>
);
