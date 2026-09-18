import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/use-auth';
import { dariTanggalLahirIso, keTanggalLahirIso } from '@/lib/tanggal';
import { pesanError } from '@/lib/utils';
import { useTambahPenduduk, useUbahPenduduk } from '../hooks/use-penduduk';
import { wargaSchema, type WargaFormValues } from '../schemas';
import type { Penduduk } from '../types';
import { WargaFormFields } from './WargaFormFields';

interface WargaFormDialogProps {
  target: Penduduk | 'baru' | null;
  onClose: () => void;
}

const KOSONG: WargaFormValues = {
  nama: '',
  jenisKelamin: 'LAKI_LAKI',
  tempatLahir: '',
  tanggal: '',
  bulan: '',
  tahun: '',
  agama: 'ISLAM',
  statusPerkawinan: 'BELUM_KAWIN',
  pendidikan: 'SMA',
  pekerjaan: '',
  golonganDarah: 'TIDAK_TAHU',
  statusHubunganKeluarga: 'ANAK',
  statusKependudukan: 'AKTIF',
  statusDomisili: 'TETAP',
  bansosBpnt: false,
  bansosPkh: false,
  kodeKeluarga: '',
  alamatAsal: '',
  catatanPerkawinan: '',
  catatanKematian: '',
  jalan: '',
  rt: '',
  rw: '',
};

function normalisasiWilayah(v?: string | null): string {
  if (!v) return '';
  const s = v.trim();
  return /^\d+$/.test(s) ? s.replace(/^0+/, '') || '0' : s;
}

export function WargaFormDialog({ target, onClose }: WargaFormDialogProps) {
  const { user } = useAuth();
  const tambah = useTambahPenduduk();
  const ubah = useUbahPenduduk();
  const menambah = target === 'baru';
  const warga = target === 'baru' || target === null ? null : target;

  const bolehPindahWilayah = user?.role === 'DUKUH';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<WargaFormValues>({ resolver: zodResolver(wargaSchema) });

  useEffect(() => {
    if (!target) return;
    if (warga) {
      const { tanggal, bulan, tahun } = dariTanggalLahirIso(warga.tanggalLahir);
      reset({
        ...warga,
        tanggal,
        bulan,
        tahun,
        statusDomisili: warga.statusDomisili ?? 'TETAP',
        bansosBpnt: warga.bansos?.includes('BPNT') ?? false,
        bansosPkh: warga.bansos?.includes('PKH') ?? false,
        kodeKeluarga: warga.kodeKeluarga ?? '',
        alamatAsal: warga.alamatAsal ?? '',
        catatanPerkawinan: warga.catatanPerkawinan ?? '',
        catatanKematian: warga.catatanKematian ?? '',
        jalan: warga.alamat.jalan,
        rt: normalisasiWilayah(warga.alamat.rt),
        rw: normalisasiWilayah(warga.alamat.rw),
      });
    } else {
      reset({
        ...KOSONG,
        rt: normalisasiWilayah(user?.rt),
        rw: normalisasiWilayah(user?.rw),
      });
    }
  }, [target, warga, reset, user]);

  const onSubmit = handleSubmit((v) => {
    const tanggalLahir = keTanggalLahirIso(v);
    if (!tanggalLahir) return;
    const bansos: string[] = [];
    if (v.bansosBpnt) bansos.push('BPNT');
    if (v.bansosPkh) bansos.push('PKH');

    const catatanKematian =
      v.statusKependudukan === 'MENINGGAL'
        ? v.catatanKematian?.trim() || null
        : null;

    const inti = {
      nama: v.nama,
      jenisKelamin: v.jenisKelamin,
      tempatLahir: v.tempatLahir,
      tanggalLahir,
      agama: v.agama,
      statusPerkawinan: v.statusPerkawinan,
      pendidikan: v.pendidikan,
      pekerjaan: v.pekerjaan,
      golonganDarah: v.golonganDarah,
      statusHubunganKeluarga: v.statusHubunganKeluarga,
      statusDomisili: v.statusDomisili,
      bansos,
      alamatAsal: v.alamatAsal?.trim() || null,
      catatanPerkawinan: v.catatanPerkawinan?.trim() || null,
      catatanKematian,
    };
    const rtRaw = user?.role === 'RT' ? (user.rt ?? v.rt) : v.rt;
    const rwRaw =
      user?.role === 'RW' || user?.role === 'RT' ? (user.rw ?? v.rw) : v.rw;
    const alamat = {
      jalan: v.jalan,
      rt: normalisasiWilayah(rtRaw),
      rw: normalisasiWilayah(rwRaw),
    };

    if (menambah) {
      tambah.mutate(
        {
          ...inti,
          alamatAsal: v.alamatAsal?.trim() || undefined,
          catatanPerkawinan: v.catatanPerkawinan?.trim() || undefined,
          catatanKematian: undefined,
          kewarganegaraan: 'WNI',
          alamat: {
            ...alamat,
            desa: '',
            kecamatan: '',
            kabupaten: '',
            provinsi: '',
            kodePos: '',
          },
        },
        { onSuccess: onClose },
      );
      return;
    }
    if (!warga) return;
    ubah.mutate(
      {
        id: warga.id,
        payload: {
          ...inti,
          kodeKeluarga: v.kodeKeluarga?.trim() || null,
          statusKependudukan: v.statusKependudukan,
          alamat: bolehPindahWilayah ? alamat : { jalan: v.jalan },
        },
      },
      { onSuccess: onClose },
    );
  });

  const galat = pesanError(
    tambah.error ?? ubah.error,
    'Gagal menyimpan data warga.',
  );

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      title={menambah ? 'Tambah Warga' : `Ubah Data ${warga?.nama ?? ''}`}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <WargaFormFields
          register={register}
          watch={watch}
          errors={errors}
          menambah={menambah}
          bolehPindahWilayah={bolehPindahWilayah}
          userRole={user?.role}
        />

        {galat && <Alert tone="error">{galat}</Alert>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={tambah.isPending || ubah.isPending}>
            {menambah ? 'Tambah Warga' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
