import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { pesanError } from '@/lib/utils';
import { useSimpanBerita } from '../hooks/use-berita';
import { beritaSchema, type BeritaFormValues } from '../schemas';
import type { Berita } from '../types';
import { EditorIsiBerita } from './EditorIsiBerita';
import { FotoBeritaField } from './FotoBeritaField';

interface BeritaFormDialogProps {
  target: Berita | 'baru' | null;
  onClose: () => void;
}

const KOSONG: BeritaFormValues = {
  judul: '',
  penulis: '',
  tanggalTerbit: new Date().toISOString().slice(0, 10),
  isi: '',
  foto: '',
};

export function BeritaFormDialog({ target, onClose }: BeritaFormDialogProps) {
  const simpan = useSimpanBerita();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BeritaFormValues>({
    resolver: zodResolver(beritaSchema),
    defaultValues: KOSONG,
  });

  const foto = watch('foto');
  const isi = watch('isi');

  useEffect(() => {
    if (target === null) return;
    simpan.reset();
    reset(
      target === 'baru'
        ? KOSONG
        : {
            judul: target.judul,
            penulis: target.penulis,
            tanggalTerbit: target.tanggalTerbit,
            isi: target.isi,
            foto: target.foto,
          },
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reset]);

  const onSubmit = handleSubmit(async (nilai) => {
    await simpan.mutateAsync({
      input: nilai,
      id: target === 'baru' || target === null ? undefined : target.id,
    });
    onClose();
  });

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title={target === 'baru' ? 'Tulis Berita' : 'Sunting Berita'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {simpan.isError && (
          <Alert tone="error">
            {pesanError(simpan.error, 'Berita gagal disimpan.')}
          </Alert>
        )}

        <Input
          label="Judul"
          error={errors.judul?.message}
          {...register('judul')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nama Penulis"
            error={errors.penulis?.message}
            {...register('penulis')}
          />
          <Input
            label="Tanggal Kejadian / Berita"
            type="date"
            error={errors.tanggalTerbit?.message}
            {...register('tanggalTerbit')}
          />
        </div>

        <FotoBeritaField
          key={target === 'baru' || target === null ? 'baru' : target.id}
          value={foto}
          onChange={(dataUrl) =>
            setValue('foto', dataUrl, { shouldDirty: true })
          }
        />

        <EditorIsiBerita
          value={isi}
          onChange={(html) =>
            setValue('isi', html, { shouldDirty: true, shouldValidate: true })
          }
          error={errors.isi?.message}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={simpan.isPending}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
