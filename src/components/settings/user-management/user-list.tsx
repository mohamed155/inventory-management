import { useQuery } from '@tanstack/react-query';
import { Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import { useConfirm } from '@/context/confirm-context.tsx';
import { deleteUser, getUsers } from '@/services/auth.ts';
import { useCurrentUserStore } from '@/store/user.store.ts';
import UserFormDialog from './user-form-dialog.tsx';
import type { User } from '../../../../generated/prisma/browser.ts';

function UserList() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const currentUser = useCurrentUserStore((s) => s.currentUser);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: users, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    refetchOnWindowFocus: false,
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = async (user: User) => {
    const confirmed = await confirm({
      message: t('Are you sure to delete this record?'),
      variant: 'destructive',
    });
    if (confirmed) {
      try {
        await deleteUser(user.id);
        toast(t('User deleted successfully'));
        refetch();
      } catch (error) {
        if (error instanceof Error) {
          toast(error.message);
        }
      }
    }
  };

  const getRoleLabel = (role: string) =>
    role === 'admin' ? t('Admin') : t('Assistant');

  return (
    <>
      <Table className="rounded-md overflow-hidden">
        <TableHeader>
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="text-white h-[30px]">{t('First name')}</TableHead>
            <TableHead className="text-white h-[30px]">{t('Last name')}</TableHead>
            <TableHead className="text-white h-[30px]">{t('Username')}</TableHead>
            <TableHead className="text-white h-[30px]">{t('Role')}</TableHead>
            <TableHead className="text-white h-[30px]">{t('Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.firstname}</TableCell>
              <TableCell>{user.lastname}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{getRoleLabel(user.role)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(user)}
                  >
                    <Edit className="text-primary" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={user.id === currentUser?.id}
                    onClick={() => handleDelete(user)}
                  >
                    <Trash2 className="text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UserFormDialog
        open={editDialogOpen}
        user={editingUser}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingUser(undefined);
        }}
        onSuccess={() => refetch()}
      />
    </>
  );
}

export default UserList;
