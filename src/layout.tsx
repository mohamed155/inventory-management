import { Outlet } from 'react-router';
import Sidenav from '@/components/sidenav.tsx';

function Layout() {
  return (
    <div className="flex h-full w-full">
      <Sidenav />
      <div className="w-full">
        <div className="p-5 bg-neutral-100 h-full w-full rounded-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;
