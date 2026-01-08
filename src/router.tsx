import { createBrowserRouter, RouterProvider } from 'react-router';
import Layout from '@/layout.tsx';
import Customers from '@/pages/customers.tsx';
import Dashboard from '@/pages/dashboard.tsx';
import Inventory from '@/pages/inventory.tsx';
import Login from '@/pages/login.tsx';
import Providers from '@/pages/providers.tsx';
import Purchases from '@/pages/purchases.tsx';
import Sales from '@/pages/sales.tsx';
import Settings from '@/pages/settings.tsx';
import Signup from '@/pages/signup.tsx';
import { getUsersCount } from '@/services/auth.ts';
import { useCurrentUserStore } from '@/store/user.store.ts';

function Router() {
  const currentUser = useCurrentUserStore((state: any) => state.currentUser);

  const router = createBrowserRouter([
    {
      path: 'signup',
      element: <Signup />,
    },
    {
      path: 'login',
      element: <Login />,
    },
    {
      path: '/',
      loader: async () => {
        if (currentUser) {
          if (window.location.pathname === '/') {
            window.location.href = '/dashboard';
          }
        } else {
          const usersCount = await getUsersCount();
          if (usersCount) {
            window.location.href = '/login';
          } else {
            window.location.href = '/signup';
          }
        }
      },
      element: <Layout />,
      children: [
        {
          path: 'dashboard',
          element: <Dashboard />,
        },
        {
          path: 'inventory',
          element: <Inventory />,
        },
        {
          path: 'purchases',
          element: <Purchases />,
        },
        {
          path: 'sales',
          element: <Sales />,
        },
        {
          path: 'customers',
          element: <Customers />,
        },
        {
          path: 'providers',
          element: <Providers />,
        },
        {
          path: 'settings',
          element: <Settings />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default Router;
