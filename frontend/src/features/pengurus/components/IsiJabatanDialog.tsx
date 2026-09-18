import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PilihWarga } from '@/components/ui/PilihWarga';
import { useCariWarga } from '@/hooks/use-cari-warga';
import { useDebounce } from '@/hooks/use-debounce';
import { pesanError } from '@/lib/utils';
import type { WargaPilihan } from '@/lib/warga-api';
import { useTambahPengurus } from '../hooks/use-pengurus';
import { isiJabatanSchema, type IsiJabatanFormValues } from '../schemas';
import type { Jabatan } from '../types';

interface IsiJabatanDialogProps {
  jabatan: Jabatan | null;
  onClose: () => void;
}

export function IsiJabatanDialog({ jabatan, onClose }: IsiJabatanDialogProps) {
  const tambah = useTambahPengurus();
  const [cari, setCari] = useState('');
  const [warga, setWarga] = useState<WargaPilihan | null>(null);
  const debounced = useDebounce(cari);
  const { data: hasil, isFetching } = useCariWarga(debounced, jabatan?.kode);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IsiJabatanFormValues>({
    resolver: zodResolver(isiJabatanSchema),
    defaultValues: { username: '', password: '' },
  });

  useEffect(() => {
    if (!jabatan) return;
    setWarga(null);
    setCari('');
  }, [jabatan]);

  function tutup() {
    reset();
    tambah.reset();
    setCari('');
    setWarga(null);
    onClose();
  }

  const onSubmit = handleSubmit((values) => {
    if (!jabatan || !warga) return;
    tambah.mutate(
      {
        ...values,
        wargaId: warga.id,
        role: jabatan.role,
        rw: jabatan.rw ?? undefined,
        rt: jabatan.rt ?? undefined,
      },
      { onSuccess: tutup },
    );
  });

  return (
    <Modal
      open={Boolean(jabatan)}
      onClose={tutup}
      title={jabatan?.label ? `Buatkan Akun ${jabatan.label}` : 'Buatkan Akun'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <PilihWarga
          label="Siapa yang memegang jabatan ini"
          cari={cari}
          onCariChange={setCari}
          hasil={hasil}
          sedangMencari={isFetching}
          terpilih={warga}
          onPilih={setWarga}
        />

        <Input
          label="Username"
          placeholder="Masukkan username"
          autoComplete="off"
          error={errors.username?.message}
          {...register('username')}
        />
        <PasswordInput
          label="Password Awal"
          placeholder="Masukkan password awal"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {tambah.error && (
          <Alert tone="error">
            {pesanError(tambah.error, 'Gagal membuatkan akun.')}
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={tutup}>
            Batal
          </Button>
          <Button type="submit" disabled={!warga} isLoading={tambah.isPending}>
            Buatkan Akun
          </Button>
        </div>
      </form>
    </Modal>
  );
}
