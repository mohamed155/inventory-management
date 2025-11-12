import { createBrowserRouter, RouterProvider } from 'react-router';
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
      path: '/',
      loader: () => !!currentUser,
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
