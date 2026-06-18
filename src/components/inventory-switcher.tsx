import { useQuery } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ManageInventoriesDialog from '@/components/dialogs/manage-inventories-dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { getAllInventories, inventoryKeys } from '@/services/inventory.ts';
import { useInventoryStore } from '@/store/inventory.store.ts';

function InventorySwitcher() {
  const { t } = useTranslation();
  const { activeInventoryId, setActiveInventoryId } = useInventoryStore();
  const [manageOpen, setManageOpen] = useState(false);

  const { data: inventories = [] } = useQuery({
    queryKey: inventoryKeys.all,
    queryFn: getAllInventories,
  });

  return (
    <div className="flex items-center gap-1">
      <Select
        value={activeInventoryId ?? ''}
        onValueChange={setActiveInventoryId}
      >
        <SelectTrigger className="w-[180px] h-8 text-sm">
          <SelectValue placeholder={t('Select Inventory')} />
        </SelectTrigger>
        <SelectContent position="popper" side="bottom" sideOffset={4}>
          {inventories.map((inv) => (
            <SelectItem key={inv.id} value={inv.id}>
              {inv.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setManageOpen(true)}
        title={t('Manage Inventories')}
      >
        <Settings2 size={16} />
      </Button>
      <ManageInventoriesDialog
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        inventories={inventories}
      />
    </div>
  );
}

export default InventorySwitcher;
