import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { pesanError } from '@/lib/utils';
import { useResetPassword } from '../hooks/use-pengurus';
import { passwordBaruSchema, type PasswordBaruFormValues } from '../schemas';
import type { Jabatan } from '../types';

interface ResetPasswordDialogProps {
  jabatan: Jabatan | null;
  onClose: () => void;
}

export function ResetPasswordDialog({
  jabatan,
  onClose,
}: ResetPasswordDialogProps) {
  const akun = jabatan?.pemegang ?? null;
  const reset = useResetPassword();

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<PasswordBaruFormValues>({
    resolver: zodResolver(passwordBaruSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    if (!akun) return;
    reset.mutate(
      { id: akun.id, password: values.password },
      {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      },
    );
  });

  return (
    <Modal
      open={Boolean(akun)}
      onClose={onClose}
      title={akun?.nama ? `Reset Password ${akun.nama}` : 'Reset Password'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Username: <strong>{akun?.username}</strong>
        </p>
        <PasswordInput
          label="Password Baru"
          placeholder="Masukkan password baru"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {reset.error && (
          <Alert tone="error">
            {pesanError(reset.error, 'Gagal mengganti password.')}
          </Alert>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={reset.isPending}>
            Simpan Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
