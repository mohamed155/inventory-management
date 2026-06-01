import { createHashRouter, RouterProvider, redirect } from 'react-router';
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

const router = createHashRouter([
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
    element: <Layout />,
    children: [
      {
        index: true,
        loader: async () => {
          const currentUser = useCurrentUserStore.getState().currentUser;
          if (currentUser) {
            return redirect('/dashboard');
          }
          const usersCount = await getUsersCount();
          return redirect(usersCount ? '/login' : '/signup');
        },
        element: null,
      },
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

function Router() {
  return <RouterProvider router={router} />;
}

export default Router;
