import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { usePadukuhanQuery, useUbahPadukuhan } from '@/hooks/use-padukuhan';
import { PADUKUHAN_BAWAAN, type Padukuhan } from '@/lib/padukuhan';
import { pesanError } from '@/lib/utils';

const wajib = (maks: number) =>
  z.string().trim().min(1, 'Wajib diisi').max(maks, `Maksimal ${maks} huruf`);

const skema = z.object({
  nama: wajib(100),
  namaLengkap: wajib(150),
  desa: wajib(100),
  kapanewon: wajib(100),
  kabupaten: wajib(100),
  provinsi: wajib(100),
  luasWilayah: wajib(50),
  telepon: wajib(30),
  email: wajib(150).refine(
    (v) => v.split('@').length === 2 && !v.startsWith('@') && !v.endsWith('@'),
    'Belum berbentuk alamat surel',
  ),
  sejarah: z
    .string()
    .trim()
    .min(20, 'Gambaran umum minimal 20 huruf')
    .max(8000),
  batasUtara: wajib(150),
  batasTimur: wajib(150),
  batasSelatan: wajib(150),
  batasBarat: wajib(150),
});

export default function ProfilPadukuhanPage() {
  const { data, isPending, isError } = usePadukuhanQuery();
  const padukuhan = data ?? PADUKUHAN_BAWAAN;
  const simpan = useUbahPadukuhan();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Padukuhan>({
    resolver: zodResolver(skema),
    defaultValues: padukuhan,
  });

  useEffect(() => {
    if (data !== undefined && !isDirty) reset(data ?? PADUKUHAN_BAWAAN);
  }, [data, isDirty, reset]);

  if (isPending || isError) {
    return (
      <div className="space-y-6">
        {isError ? (
          <Alert tone="error">
            Keterangan padukuhan belum bisa dimuat, jadi formulirnya ditahan:
            menyimpan sekarang akan menimpa keterangan yang tersimpan dengan
            nilai bawaan. Muat ulang halaman setelah sambungan pulih.
          </Alert>
        ) : (
          <p className="text-sm text-slate-500">Memuat keterangan padukuhan…</p>
        )}
      </div>
    );
  }

  const onSubmit = handleSubmit(async (nilai) => {
    reset(await simpan.mutateAsync(nilai));
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex justify-end">
        <Button type="submit" isLoading={simpan.isPending} disabled={!isDirty}>
          Simpan Perubahan
        </Button>
      </div>

      {simpan.isError && (
        <Alert tone="error">
          {pesanError(simpan.error, 'Perubahan gagal disimpan.')}
        </Alert>
      )}
      {simpan.isSuccess && !isDirty && (
        <Alert tone="success">
          Tersimpan. Halaman publik langsung memakai keterangan yang baru.
        </Alert>
      )}

      <input type="hidden" {...register('luasWilayah')} />

      <Card>
        <CardHeader title="Identitas Wilayah" />
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nama Padukuhan"
            hint="Tanpa kata “Padukuhan”, mis. Gading Kulon"
            error={errors.nama?.message}
            {...register('nama')}
          />
          <Input
            label="Nama Lengkap"
            hint="Yang tampil sebagai judul, mis. Padukuhan Gading Kulon"
            error={errors.namaLengkap?.message}
            {...register('namaLengkap')}
          />
          <Input
            label="Kalurahan"
            error={errors.desa?.message}
            {...register('desa')}
          />
          <Input
            label="Kapanewon"
            error={errors.kapanewon?.message}
            {...register('kapanewon')}
          />
          <Input
            label="Kabupaten"
            error={errors.kabupaten?.message}
            {...register('kabupaten')}
          />
          <Input
            label="Provinsi"
            error={errors.provinsi?.message}
            {...register('provinsi')}
          />
          <Input
            label="Telepon"
            type="tel"
            error={errors.telepon?.message}
            {...register('telepon')}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Gambaran Umum" />
        <CardContent>
          <Textarea
            aria-label="Gambaran Umum"
            rows={9}
            error={errors.sejarah?.message}
            {...register('sejarah')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Batas Wilayah" />
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Sebelah Utara"
            error={errors.batasUtara?.message}
            {...register('batasUtara')}
          />
          <Input
            label="Sebelah Timur"
            error={errors.batasTimur?.message}
            {...register('batasTimur')}
          />
          <Input
            label="Sebelah Selatan"
            error={errors.batasSelatan?.message}
            {...register('batasSelatan')}
          />
          <Input
            label="Sebelah Barat"
            error={errors.batasBarat?.message}
            {...register('batasBarat')}
          />
        </CardContent>
      </Card>
    </form>
  );
}
