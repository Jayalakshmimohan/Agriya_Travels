import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AdminDashboard from '../pages/AdminDashboard';
import '../index.css';

// Deliberately not wrapped in Layout: the admin view has no public header,
// footer, WhatsApp button or quote modal.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminDashboard />
  </StrictMode>
);
