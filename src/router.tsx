import { createRouter, createRootRoute, createRoute, Outlet, redirect } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';

// Lazy load pages
const StandaloneSetupPage = lazy(() => import('@/pages/standalone/setup'));
const StandaloneFnbPosPage = lazy(() => import('@/pages/standalone/fnb/pos'));
const StandaloneRtlPosPage = lazy(() => import('@/pages/standalone/rtl/pos'));
const StandaloneProductsPage = lazy(() => import('@/pages/standalone/products'));
const StandaloneCategoriesPage = lazy(() => import('@/pages/standalone/categories'));
const StandaloneHistoryPage = lazy(() => import('@/pages/standalone/history'));
const StandalonePrinterPage = lazy(() => import('@/pages/standalone/printer'));

// Root route
const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { toasts, remove } = useToast();
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading...</div>}>
      <Outlet />
      <ToastContainer toasts={toasts} onRemove={remove} />
    </Suspense>
  );
}

// Index route - redirect based on config state
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const { setupCompletedAt, mode } = useStandaloneConfigStore.getState();
    if (setupCompletedAt) {
      const path = mode === 'fnb' ? '/fnb/pos' : '/rtl/pos';
      throw redirect({ to: path });
    }
    throw redirect({ to: '/setup' });
  },
  component: () => null,
});

// Setup route
const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/setup',
  component: StandaloneSetupPage,
});

// FnB layout
const fnbLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/fnb',
  beforeLoad: () => {
    const { mode, setupCompletedAt } = useStandaloneConfigStore.getState();
    if (!setupCompletedAt) {
      throw redirect({ to: '/setup' });
    }
    if (mode !== 'fnb') {
      throw redirect({ to: '/rtl/pos' });
    }
  },
  component: () => <Outlet />,
});

const fnbPosRoute = createRoute({
  getParentRoute: () => fnbLayoutRoute,
  path: '/pos',
  component: StandaloneFnbPosPage,
});

const fnbProductsRoute = createRoute({
  getParentRoute: () => fnbLayoutRoute,
  path: '/products',
  component: StandaloneProductsPage,
});

const fnbCategoriesRoute = createRoute({
  getParentRoute: () => fnbLayoutRoute,
  path: '/categories',
  component: StandaloneCategoriesPage,
});

const fnbHistoryRoute = createRoute({
  getParentRoute: () => fnbLayoutRoute,
  path: '/history',
  component: StandaloneHistoryPage,
});

const fnbPrinterRoute = createRoute({
  getParentRoute: () => fnbLayoutRoute,
  path: '/printer',
  component: StandalonePrinterPage,
});

// Retail layout
const rtlLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rtl',
  beforeLoad: () => {
    const { mode, setupCompletedAt } = useStandaloneConfigStore.getState();
    if (!setupCompletedAt) {
      throw redirect({ to: '/setup' });
    }
    if (mode !== 'retail') {
      throw redirect({ to: '/fnb/pos' });
    }
  },
  component: () => <Outlet />,
});

const rtlPosRoute = createRoute({
  getParentRoute: () => rtlLayoutRoute,
  path: '/pos',
  component: StandaloneRtlPosPage,
});

const rtlProductsRoute = createRoute({
  getParentRoute: () => rtlLayoutRoute,
  path: '/products',
  component: StandaloneProductsPage,
});

const rtlCategoriesRoute = createRoute({
  getParentRoute: () => rtlLayoutRoute,
  path: '/categories',
  component: StandaloneCategoriesPage,
});

const rtlHistoryRoute = createRoute({
  getParentRoute: () => rtlLayoutRoute,
  path: '/history',
  component: StandaloneHistoryPage,
});

const rtlPrinterRoute = createRoute({
  getParentRoute: () => rtlLayoutRoute,
  path: '/printer',
  component: StandalonePrinterPage,
});

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  setupRoute,
  fnbLayoutRoute.addChildren([
    fnbPosRoute,
    fnbProductsRoute,
    fnbCategoriesRoute,
    fnbHistoryRoute,
    fnbPrinterRoute,
  ]),
  rtlLayoutRoute.addChildren([
    rtlPosRoute,
    rtlProductsRoute,
    rtlCategoriesRoute,
    rtlHistoryRoute,
    rtlPrinterRoute,
  ]),
]);

// Create and export router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Type registration
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
