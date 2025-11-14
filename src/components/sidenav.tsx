import {
  DollarSign,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button.tsx';
import { logout } from '@/services/auth.ts';

function MenuItem({
  name,
  icon,
  selected,
  onClick,
}: {
  name: string;
  icon: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      className={`w-full shadow-none bg-white justify-start font-semibold flex px-3 py-2 hover:bg-primary/10 rounded-md text-primary text-sm align-center mb-1 cursor-pointer transition ${selected ? '!bg-primary !text-white' : ''}`}
      onClick={onClick}
    >
      <div className="mr-2 flex justify-center items-center">{icon}</div>
      {name}
    </Button>
  );
}

function Sidenav() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const menuItems = useMemo(
    () => [
      {
        name: t('Dashboard'),
        icon: <LayoutDashboard size={18} />,
        onClick: () => navigate('/dashboard'),
      },
      {
        name: t('Products'),
        icon: <Package size={18} />,
        onClick: () => navigate('/products'),
      },
      {
        name: t('Purchases'),
        icon: <ShoppingCart size={18} />,
        onClick: () => navigate('/purchases'),
      },
      {
        name: t('Sales'),
        icon: <DollarSign size={18} />,
        onClick: () => navigate('/sales'),
      },
      {
        name: t('Customers'),
        icon: <Users size={18} />,
        onClick: () => navigate('/customers'),
      },
      {
        name: t('Providers'),
        icon: <Truck size={18} />,
        onClick: () => navigate('/providers'),
      },
    ],
    [t, navigate],
  );

  const isItemSelected = (name: string) => {
    return window.location.pathname.includes(name.toLowerCase());
  };

  return (
    <div className="w-[250px] p-3 h-full flex flex-col justify-between">
      <div>
        <div>
          {menuItems.map((item) => (
            <MenuItem
              key={item.name}
              selected={isItemSelected(item.name)}
              {...item}
            />
          ))}
        </div>
      </div>
      <div>
        <MenuItem
          name="Settings"
          icon={<Settings size={18} />}
          selected={isItemSelected('settings')}
          onClick={() => navigate('/settings')}
        />
        <Button
          className={`w-full shadow-none bg-white justify-start font-semibold flex px-3 py-2 hover:bg-red-500/10 rounded-md text-red-700 text-sm align-center mb-1 cursor-pointer transition`}
          onClick={logout}
        >
          <div className="mr-2 flex justify-center items-center">
            <LogOut size={18} />
          </div>
          {t('Logout')}
        </Button>
      </div>
    </div>
  );
}

export default Sidenav;
