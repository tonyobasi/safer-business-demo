import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { createBrowserRouter, Link, Navigate, RouterProvider, useLocation } from 'react-router-dom';
import { WorkspaceShell } from '../components/WorkspaceShell';
import { Button, ErrorState, Loading, ToastProvider } from '../components/ui';
import {
  BusinessSetup,
  Login,
  Password,
  ResetPassword,
  Signup,
  Verify,
} from '../features/auth/Auth';
import { RequireSession, SessionProvider, useSession } from './session';
import { isDemo } from '../lib/api';
const LinkDetails = lazy(() => import('../features/payments/LinkDetails'));
const PaymentDetails = lazy(() => import('../features/payments/PaymentDetails'));
const TrackDelivery = lazy(() => import('../features/deliveries/TrackDelivery'));
const Agent = lazy(() => import('../features/agent/Agent'));
const Catalogue = lazy(() => import('../features/catalogue/ProductManager'));
const Payments = lazy(() => import('../features/payments/Payments'));
const Links = lazy(() => import('../features/payments/PaymentLinks'));
const Deliveries = lazy(() => import('../features/deliveries/Deliveries'));
const Payroll = lazy(() => import('../features/payroll/Payroll'));
const Profile = lazy(() => import('../features/profile/Profile'));
const Settings = lazy(() => import('../features/settings/Settings'));
const Checkout = lazy(() => import('../features/payments/Checkout'));
function DemoEntry() {
  const { session, login } = useSession();
  useEffect(() => {
    if (isDemo && !session) login('demo@safer.example');
  }, [session, login]);
  if (!isDemo) return <Navigate to="/login" replace />;
  return session ? <Navigate to="/app" replace /> : <Loading />;
}
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15000, retry: 1, refetchOnWindowFocus: true } },
});
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.querySelector('.app-main')?.scrollTo(0, 0);
    window.scrollTo(0, 0);
    document.title = `${pathname === '/app' ? 'Workspace' : pathname === '/' ? 'Your business, moving forward' : pathname.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ') || 'Home'} · Safer Business`;
  }, [pathname]);
  return null;
}
function Offline() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(!navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', on);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', on);
    };
  }, []);
  return offline ? (
    <div className="offline-banner" role="status">
      You’re offline. Demo data is available locally; live updates will resume when connected.
    </div>
  ) : null;
}
function Root({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollToTop />
      <Offline />
      {children}
    </>
  );
}
function NotFound() {
  return (
    <div className="not-found">
      <h1>Let’s get you back on track.</h1>
      <p>This page could not be found.</p>
      <Link className="pill-button" to="/">
        Back to Safer Business
      </Link>
    </div>
  );
}
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Root>
        <DemoEntry />
      </Root>
    ),
  },
  {
    path: '/signup',
    element: (
      <Root>
        <Signup />
      </Root>
    ),
  },
  {
    path: '/signup/verify',
    element: (
      <Root>
        <Verify />
      </Root>
    ),
  },
  {
    path: '/signup/password',
    element: (
      <Root>
        <Password />
      </Root>
    ),
  },
  {
    path: '/signup/business',
    element: (
      <Root>
        <BusinessSetup />
      </Root>
    ),
  },
  {
    path: '/login',
    element: (
      <Root>
        <Login />
      </Root>
    ),
  },
  {
    path: '/password/reset',
    element: (
      <Root>
        <ResetPassword />
      </Root>
    ),
  },
  {
    path: '/app',
    element: (
      <Root>
        <RequireSession>
          <WorkspaceShell />
        </RequireSession>
      </Root>
    ),
    children: [
      { index: true, element: <Agent /> },
      { path: 'catalogue', element: <Catalogue /> },
      { path: 'payments', element: <Payments /> },
      { path: 'payments/:id', element: <PaymentDetails /> },
      { path: 'payment-links', element: <Links /> },
      { path: 'payment-links/:id', element: <LinkDetails /> },
      { path: 'deliveries', element: <Deliveries /> },
      { path: 'deliveries/:id', element: <TrackDelivery /> },
      { path: 'payroll', element: <Payroll /> },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  {
    path: '/pay/:token',
    element: (
      <Root>
        <Checkout />
      </Root>
    ),
  },
  { path: '*', element: <NotFound /> },
]);
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="not-found">
        <ErrorState message="Something unexpected happened. Reload to recover your saved demo workspace." />
        <Button onClick={() => location.reload()}>Reload workspace</Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <Boundary>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ToastProvider>
            <Suspense fallback={<Loading />}>
              <RouterProvider router={router} />
            </Suspense>
          </ToastProvider>
        </SessionProvider>
      </QueryClientProvider>
    </Boundary>
  );
}
