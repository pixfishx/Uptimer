import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { StatusPage } from '../pages/StatusPage';
import { ProtectedRoute } from './ProtectedRoute';

const AdminDashboard = lazy(async () => {
  const mod = await import('../pages/AdminDashboard');
  return { default: mod.AdminDashboard };
});

const AdminAnalytics = lazy(async () => {
  const mod = await import('../pages/AdminAnalytics');
  return { default: mod.AdminAnalytics };
});

const AdminLogin = lazy(async () => {
  const mod = await import('../pages/AdminLogin');
  return { default: mod.AdminLogin };
});

function PageFallback() {
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-900" />;
}

export const router = createBrowserRouter([
  { path: '/', element: <StatusPage /> },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageFallback />}>
          <AdminDashboard />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/analytics',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageFallback />}>
          <AdminAnalytics />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/login',
    element: (
      <Suspense fallback={<PageFallback />}>
        <AdminLogin />
      </Suspense>
    ),
  },
]);
