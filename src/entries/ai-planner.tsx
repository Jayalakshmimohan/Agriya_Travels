import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from '../components/Layout';
import AiTripPlannerPage from '../pages/AiTripPlannerPage';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Layout>
      <AiTripPlannerPage />
    </Layout>
  </StrictMode>
);
