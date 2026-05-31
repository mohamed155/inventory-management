import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.tsx';
import UserFormDialog from './user-form-dialog.tsx';
import UserList from './user-list.tsx';

function UserManagement() {
  const { t } = useTranslation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: ['users'] });

  return (
    <div className="flex flex-col gap-4 bg-white rounded-lg p-4 border border-solid">
      <div className="flex justify-between items-center">
        <h5>{t('User Management')}</h5>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          {t('Add User')}
        </Button>
      </div>
      <UserList />
      <UserFormDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={invalidateUsers}
      />
    </div>
  );
}

export default UserManagement;
