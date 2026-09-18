import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { pesanError } from '@/lib/utils';
import { homePathForRole } from '@/routes/role-utils';
import { useAuth, useLogout } from '@/hooks/use-auth';
import { useGantiPassword } from '../hooks/use-auth';
import { gantiPasswordSchema, type GantiPasswordFormValues } from '../schemas';
import { AuthLayout } from './AuthLayout';

export function GantiPasswordForm() {
  const { user, harusGantiPassword } = useAuth();
  const ganti = useGantiPassword();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();

  const handleKembali = () => {
    // Selagi password awal belum diganti, tidak ada halaman yang bisa dituju:
    // `RequireGantiPassword` menjaga semuanya, jadi "kembali" ke mana pun akan
    // memantul balik ke sini. Jalan keluarnya mengakhiri sesi — password lama
    // masih berlaku, jadi orangnya bisa masuk lagi kapan saja.
    if (harusGantiPassword) {
      logout();
      return;
    }

    const asal = (
      location.state as {
        from?: string | { pathname?: string; search?: string; hash?: string };
      } | null
    )?.from;

    if (typeof asal === 'string' && asal) {
      navigate(asal, { replace: true });
    } else if (asal && typeof asal === 'object' && asal.pathname) {
      navigate(`${asal.pathname}${asal.search ?? ''}${asal.hash ?? ''}`, {
        replace: true,
      });
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(homePathForRole(user?.role), { replace: true });
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GantiPasswordFormValues>({
    resolver: zodResolver(gantiPasswordSchema),
    defaultValues: { passwordLama: '', passwordBaru: '', ulangi: '' },
  });

  const onSubmit = handleSubmit((values) => {
    ganti.mutate(
      {
        passwordLama: values.passwordLama,
        passwordBaru: values.passwordBaru,
      },
      {
        onSuccess: (baru) =>
          navigate(homePathForRole(baru.role), { replace: true }),
      },
    );
  });

  return (
    <AuthLayout
      title="Ganti Password"
      description={
        harusGantiPassword
          ? 'Password Anda masih password awal dari Admin, dan harus diganti sebelum data warga bisa dibuka. Belum sempat sekarang? Keluar saja — password awal tadi masih bisa dipakai masuk lagi.'
          : `Masuk sebagai ${user?.nama ?? ''}. Password lama tidak akan berlaku lagi.`
      }
      onBack={handleKembali}
      backLabel={harusGantiPassword ? 'Keluar' : 'Kembali'}
    >
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <PasswordInput
          label="Password Sekarang"
          autoComplete="current-password"
          error={errors.passwordLama?.message}
          {...register('passwordLama')}
        />
        <PasswordInput
          label="Password Baru"
          autoComplete="new-password"
          hint="Minimal 8 karakter."
          error={errors.passwordBaru?.message}
          {...register('passwordBaru')}
        />
        <PasswordInput
          label="Ulangi Password Baru"
          autoComplete="new-password"
          error={errors.ulangi?.message}
          {...register('ulangi')}
        />
        {ganti.error && (
          <Alert tone="error">
            {pesanError(ganti.error, 'Gagal mengganti password.')}
          </Alert>
        )}
        <Button type="submit" className="w-full" isLoading={ganti.isPending}>
          Simpan Password Baru
        </Button>
      </form>
    </AuthLayout>
  );
}
