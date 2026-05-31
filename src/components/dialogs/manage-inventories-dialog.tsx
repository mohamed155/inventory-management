import { useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useConfirm } from '@/context/confirm-context.tsx';
import {
  createInventory,
  deleteInventory,
  updateInventory,
  inventoryKeys,
} from '@/services/inventory.ts';
import { useInventoryStore } from '@/store/inventory.store.ts';
import type { Inventory } from '@/models/inventory.ts';

function ManageInventoriesDialog({
  open,
  onClose,
  inventories,
}: {
  open: boolean;
  onClose: () => void;
  inventories: Inventory[];
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const { activeInventoryId, setActiveInventoryId } = useInventoryStore();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [renaming, setRenaming] = useState(false);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      await createInventory(trimmed);
      setNewName('');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to add inventory'));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (inventory: Inventory) => {
    const ok = await confirm({
      title: t('Delete Inventory'),
      message: t('Are you sure you want to delete this inventory and all its data?'),
      variant: 'destructive',
    });
    if (!ok) return;
    setDeleting(inventory.id);
    try {
      await deleteInventory(inventory.id);
      if (activeInventoryId === inventory.id) {
        const remaining = inventories.filter((inv) => inv.id !== inventory.id);
        if (remaining.length > 0) setActiveInventoryId(remaining[0].id);
      }
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to delete inventory'));
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (inventory: Inventory) => {
    setEditingId(inventory.id);
    setEditingName(inventory.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleRename = async (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    setRenaming(true);
    try {
      await updateInventory(id, trimmed);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to rename inventory'));
    } finally {
      setRenaming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Manage Inventories')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {inventories.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between gap-2">
              {editingId === inv.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(inv.id);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    disabled={renaming}
                    className="h-7 text-sm"
                    autoFocus
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={renaming || !editingName.trim()}
                      onClick={() => handleRename(inv.id)}
                      title={t('Save')}
                    >
                      <Check size={14} className="text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={cancelEdit}
                      title={t('Cancel')}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium truncate">{inv.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEdit(inv)}
                      title={t('Edit Inventory Name')}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={inventories.length <= 1 || deleting === inv.id}
                      onClick={() => handleDelete(inv)}
                      title={t('Delete Inventory')}
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Input
            placeholder={t('New Inventory Name')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            disabled={adding}
          />
          <Button onClick={handleAdd} disabled={adding || !newName.trim()}>
            {t('Add Inventory')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ManageInventoriesDialog;
