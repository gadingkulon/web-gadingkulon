import type {
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { NAMA_BULAN } from '@/lib/tanggal';
import {
  agamaLabel,
  golonganDarahLabel,
  jenisKelaminLabel,
  pendidikanLabel,
  statusHubunganLabel,
  statusKependudukanLabel,
  statusPerkawinanLabel,
  statusDomisiliLabel,
} from '../labels';
import type { Role } from '@/types/auth';
import type { WargaFormValues } from '../schemas';

interface WargaFormFieldsProps {
  register: UseFormRegister<WargaFormValues>;
  watch?: UseFormWatch<WargaFormValues>;
  errors: FieldErrors<WargaFormValues>;
  menambah: boolean;
  bolehPindahWilayah: boolean;
  userRole?: Role;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-slate-200 pb-1.5 pt-2 sm:col-span-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
    </div>
  );
}

function TanggalLahir({
  register,
  errors,
}: Pick<WargaFormFieldsProps, 'register' | 'errors'>) {
  const galat =
    errors.tanggal?.message ?? errors.bulan?.message ?? errors.tahun?.message;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Tanggal Lahir
      </label>
      <div className="grid grid-cols-[3.5rem_1fr_4.5rem] items-center gap-2">
        <input
          type="text"
          placeholder="Tgl"
          maxLength={2}
          className={cn(
            'h-10 w-full rounded-lg border-1 border-black bg-surface px-2 text-center text-slate-900 transition-all hover:border-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm',
            errors.tanggal && 'border-red-500',
          )}
          {...register('tanggal')}
        />
        <select
          className={cn(
            'h-10 w-full rounded-lg border-1 border-black bg-surface px-2.5 text-slate-900 transition-all hover:border-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm',
            errors.bulan && 'border-red-500',
          )}
          {...register('bulan')}
        >
          <option value="">Bulan</option>
          {NAMA_BULAN.map((nama, i) => (
            <option key={nama} value={String(i + 1).padStart(2, '0')}>
              {nama}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Tahun"
          maxLength={4}
          className={cn(
            'h-10 w-full rounded-lg border-1 border-black bg-surface px-2 text-center text-slate-900 transition-all hover:border-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm',
            errors.tahun && 'border-red-500',
          )}
          {...register('tahun')}
        />
      </div>
      {galat && <p className="mt-1 text-xs text-red-600">{galat}</p>}
    </div>
  );
}

export function WargaFormFields({
  register,
  watch,
  errors,
  menambah,
  bolehPindahWilayah,
  userRole,
}: WargaFormFieldsProps) {
  const statusKependudukan = watch ? watch('statusKependudukan') : 'AKTIF';

  return (
    <div className="grid gap-3.5 sm:grid-cols-2">
      {/* 1. IDENTITAS WARGA */}
      <SectionHeader title="Identitas Warga" />

      <div className="sm:col-span-2">
        <Input
          label="Nama Lengkap"
          placeholder="Masukkan nama lengkap sesuai identitas"
          error={errors.nama?.message}
          {...register('nama')}
        />
      </div>

      <Select
        label="Jenis Kelamin"
        pilihan={jenisKelaminLabel}
        error={errors.jenisKelamin?.message}
        {...register('jenisKelamin')}
      />

      <Select
        label="Golongan Darah"
        pilihan={golonganDarahLabel}
        error={errors.golonganDarah?.message}
        {...register('golonganDarah')}
      />

      <Input
        label="Tempat Lahir"
        placeholder="Kota / kabupaten lahir"
        error={errors.tempatLahir?.message}
        {...register('tempatLahir')}
      />

      <TanggalLahir register={register} errors={errors} />

      <Select
        label="Agama"
        pilihan={agamaLabel}
        error={errors.agama?.message}
        {...register('agama')}
      />

      <Select
        label="Pendidikan Terakhir"
        pilihan={pendidikanLabel}
        error={errors.pendidikan?.message}
        {...register('pendidikan')}
      />

      <Input
        label="Pekerjaan"
        placeholder="Misal: Wiraswasta, Petani, Karyawan Swasta"
        error={errors.pekerjaan?.message}
        {...register('pekerjaan')}
      />

      <Select
        label="Status Domisili"
        pilihan={statusDomisiliLabel}
        error={errors.statusDomisili?.message}
        {...register('statusDomisili')}
      />

      {/* 2. KELUARGA & PERKAWINAN */}
      <SectionHeader title="Keluarga & Pernikahan" />

      <Select
        label="Status dalam Keluarga"
        pilihan={statusHubunganLabel}
        error={errors.statusHubunganKeluarga?.message}
        {...register('statusHubunganKeluarga')}
      />

      <Input
        label="Kode Keluarga (KK)"
        placeholder="Misal: K0001 (opsional)"
        error={errors.kodeKeluarga?.message}
        {...register('kodeKeluarga')}
      />

      <Select
        label="Status Perkawinan"
        pilihan={statusPerkawinanLabel}
        error={errors.statusPerkawinan?.message}
        {...register('statusPerkawinan')}
      />

      <Input
        label="Catatan Perkawinan (Opsional)"
        placeholder="Misal: Belum update KK / nikah siri"
        error={errors.catatanPerkawinan?.message}
        {...register('catatanPerkawinan')}
      />

      {/* 3. STATUS KEBERADAAN WARGA (Hanya saat Ubah) */}
      {!menambah && (
        <>
          <SectionHeader title="Status Keberadaan Warga" />
          <Select
            label="Status Kependudukan"
            pilihan={statusKependudukanLabel}
            error={errors.statusKependudukan?.message}
            {...register('statusKependudukan')}
          />
          {statusKependudukan === 'MENINGGAL' ? (
            <Input
              label="Penyebab / Keterangan Meninggal"
              placeholder="Misal: Sakit, usia lanjut, dll."
              error={errors.catatanKematian?.message}
              {...register('catatanKematian')}
            />
          ) : (
            <div className="hidden sm:block" />
          )}
        </>
      )}

      {/* 4. ALAMAT & WILAYAH */}
      <SectionHeader title="Alamat & Wilayah" />

      <div className="sm:col-span-2">
        <Input
          label="Alamat Jalan / Dusun"
          placeholder="Nama jalan, nomor rumah, atau nama gang"
          error={errors.jalan?.message}
          {...register('jalan')}
        />
      </div>

      <Input
        label="RT"
        disabled={menambah ? userRole === 'RT' : !bolehPindahWilayah}
        placeholder="Nomor RT (misal 1)"
        title={
          !bolehPindahWilayah && !menambah
            ? 'Hanya Pak Dukuh yang berwenang mengubah RT/RW'
            : undefined
        }
        error={errors.rt?.message}
        {...register('rt')}
      />

      <Input
        label="RW"
        disabled={
          menambah
            ? userRole === 'RW' || userRole === 'RT'
            : !bolehPindahWilayah
        }
        placeholder="Nomor RW (misal 19)"
        title={
          !bolehPindahWilayah && !menambah
            ? 'Hanya Pak Dukuh yang berwenang mengubah RT/RW'
            : undefined
        }
        error={errors.rw?.message}
        {...register('rw')}
      />

      <Select
        label="Status Domisili"
        pilihan={statusDomisiliLabel}
        error={errors.statusDomisili?.message}
        {...register('statusDomisili')}
      />

      <Input
        label="Alamat Asal (Opsional)"
        placeholder="Hanya diisi jika domisili sementara / pendatang (alamat KTP asal)"
        error={errors.alamatAsal?.message}
        {...register('alamatAsal')}
      />

      {/* 5. BANTUAN SOSIAL */}
      <SectionHeader title="Program Bantuan Sosial" />

      <div className="flex flex-wrap items-center gap-6 pt-1 sm:col-span-2">
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            {...register('bansosBpnt')}
          />
          <span>Bantuan Pangan Non-Tunai (BPNT)</span>
        </label>
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            {...register('bansosPkh')}
          />
          <span>Program Keluarga Harapan (PKH)</span>
        </label>
      </div>
    </div>
  );
}
