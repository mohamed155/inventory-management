import { createHashRouter, RouterProvider, redirect } from 'react-router';
import Layout from '@/layout.tsx';
import Customers from '@/pages/customers.tsx';
import Dashboard from '@/pages/dashboard.tsx';
import Inventory from '@/pages/inventory.tsx';
import Login from '@/pages/login.tsx';
import Providers from '@/pages/providers.tsx';
import Reports from '@/pages/reports.tsx';
import Purchases from '@/pages/purchases.tsx';
import Sales from '@/pages/sales.tsx';
import Settings from '@/pages/settings.tsx';
import Signup from '@/pages/signup.tsx';
import { getUsersCount } from '@/services/auth.ts';
import { createInventory, getAllInventories } from '@/services/inventory.ts';
import { useInventoryStore } from '@/store/inventory.store.ts';
import { useCurrentUserStore } from '@/store/user.store.ts';

const router = createHashRouter([
  {
    path: 'signup',
    element: <Signup />,
    loader: async () => {
      const currentUser = useCurrentUserStore.getState().currentUser;
      if (currentUser) {
        return redirect('/dashboard');
      }
      const usersCount = await getUsersCount();
      if (usersCount > 0) {
        return redirect('/login');
      }
      return null;
    },
  },
  {
    path: 'login',
    element: <Login />,
    loader: async () => {
      const currentUser = useCurrentUserStore.getState().currentUser;
      if (currentUser) {
        return redirect('/dashboard');
      }
      const usersCount = await getUsersCount();
      if (usersCount === 0) {
        return redirect('/signup');
      }
      return null;
    },
  },
  {
    path: '/',
    element: <Layout />,
    loader: async () => {
      const currentUser = useCurrentUserStore.getState().currentUser;
      if (!currentUser) {
        return redirect('/login');
      }

      const inventories = await getAllInventories();
      const { activeInventoryId, setActiveInventoryId } = useInventoryStore.getState();

      if (inventories.length === 0) {
        const created = await createInventory('المخزن الرئيسي');
        setActiveInventoryId(created.id);
      } else if (!activeInventoryId || !inventories.some((inv) => inv.id === activeInventoryId)) {
        setActiveInventoryId(inventories[0].id);
      }

      return null;
    },
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
        path: 'reports',
        element: <Reports />,
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
