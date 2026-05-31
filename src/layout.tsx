import { Outlet } from 'react-router';
import InventorySwitcher from '@/components/inventory-switcher.tsx';
import Sidenav from '@/components/sidenav.tsx';
import { useInvalidateOnInventorySwitch } from '@/hooks/use-invalidate-on-inventory-switch.ts';

function Layout() {
  useInvalidateOnInventorySwitch();

  return (
    <div className="flex h-full w-full">
      <Sidenav />
      <div className="flex flex-col w-full overflow-hidden">
        <div className="flex items-center h-12 px-4 border-b bg-white">
          <InventorySwitcher />
        </div>
        <div className="p-5 bg-neutral-100 flex-1 w-full rounded-md overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;
