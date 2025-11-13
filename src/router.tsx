import { createBrowserRouter, RouterProvider } from 'react-router';
import Layout from '@/layout.tsx';
import Dashboard from '@/pages/dashboard.tsx';
import Signup from '@/pages/signup.tsx';
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
    },
    {
      path: '/',
      loader: () => {
        if (currentUser) {
          if (window.location.pathname === '/') {
            window.location.href = '/dashboard';
          }
        } else {
          window.location.href = '/signup';
        }
      },
      element: <Layout />,
      children: [
        {
          path: 'dashboard',
          element: <Dashboard />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default Router;
