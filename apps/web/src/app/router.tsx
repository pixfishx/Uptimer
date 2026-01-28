import { createBrowserRouter } from 'react-router-dom';

import { AdminDashboard } from '../pages/AdminDashboard';
import { AdminLogin } from '../pages/AdminLogin';
import { StatusPage } from '../pages/StatusPage';

export const router = createBrowserRouter([
  { path: '/', element: <StatusPage /> },
  { path: '/admin', element: <AdminDashboard /> },
  { path: '/admin/login', element: <AdminLogin /> },
]);

