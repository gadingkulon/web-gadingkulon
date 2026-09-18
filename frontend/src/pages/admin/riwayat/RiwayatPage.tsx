import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { RiwayatView } from '@/features/audit/components/RiwayatView';
import { useRiwayat } from '@/features/audit/hooks/use-audit';
import { toBarisRiwayat } from '@/features/audit/view-model';

export default function RiwayatPage() {
  const { isAdmin } = useAuth();
  const { data, isLoading, isError } = useRiwayat();

  const baris = useMemo(() => data?.map(toBarisRiwayat), [data]);

  return (
    <div className="space-y-6">
      <RiwayatView
        isLoading={isLoading}
        isError={isError}
        baris={baris}
        kosongJudul="Belum ada perubahan tercatat"
        kosongKeterangan={
          isAdmin
            ? 'Pembuatan akun, reset password, dan perubahan isi portal akan muncul di sini.'
            : 'Setiap perubahan data warga dan setiap tindakan Admin akan muncul di sini, lengkap dengan siapa yang melakukannya.'
        }
      />
    </div>
  );
}
