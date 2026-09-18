import { Card, CardHeader } from '@/components/ui/Card';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Table, Td, Th } from '@/components/ui/Table';
import ikonKeyRound from '@/assets/icons/nav/key-round.svg';
import type { Jabatan } from '../types';

interface DaftarJabatanViewProps {
  isLoading: boolean;
  isError: boolean;
  jabatan: Jabatan[] | undefined;
  sedangMengubah: boolean;
  onIsiJabatan: (jabatan: Jabatan) => void;
  onResetPassword: (jabatan: Jabatan) => void;
  onAjukanPergantian: (jabatan: Jabatan) => void;

  lpmNama: string | null | undefined;
  onUbahLpm: () => void;
}

const tombolAksiClass =
  'focus-ring inline-flex items-center justify-center shrink-0 rounded-lg border-1 border-black bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 shadow-2xs transition-all hover:bg-slate-100 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer';

const tombolResetClass =
  'focus-ring inline-flex items-center justify-center shrink-0 gap-1 rounded-lg border-1 border-black bg-white px-2 py-1.5 text-xs font-bold text-slate-900 shadow-2xs transition-all hover:bg-slate-100 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer';

export function DaftarJabatanView({
  isLoading,
  isError,
  jabatan,
  sedangMengubah,
  onIsiJabatan,
  onResetPassword,
  onAjukanPergantian,
  lpmNama,
  onUbahLpm,
}: DaftarJabatanViewProps) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader title="Daftar Akun" />
      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        data={jabatan}
        errorMessage="Gagal memuat daftar akun pengurus."
      >
        {(daftar) => (
          <Table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <Th className="w-[20%] min-w-[120px]">Jabatan</Th>
                <Th className="w-[25%] min-w-[150px]">Nama</Th>
                <Th className="w-[20%] min-w-[130px]">Username</Th>
                <Th className="w-[18%] min-w-[130px]">Status</Th>
                <Th className="w-[17%] min-w-[170px] text-center">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((j) => (
                <tr
                  key={j.kode}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <Td className="font-semibold text-slate-900">{j.label}</Td>
                  <Td className="font-medium text-slate-800">
                    {j.pemegang ? (
                      <span className="truncate" title={j.pemegang.nama}>
                        {j.pemegang.nama}
                      </span>
                    ) : (
                      <span className="font-normal text-slate-400">—</span>
                    )}
                  </Td>
                  <Td className="font-mono text-xs text-slate-600">
                    {j.pemegang?.username ? (
                      <span className="truncate" title={j.pemegang.username}>
                        {j.pemegang.username}
                      </span>
                    ) : (
                      <span className="font-sans text-sm text-slate-400">
                        —
                      </span>
                    )}
                  </Td>
                  <Td>
                    {j.pemegang ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${j.pemegang.harusGantiPassword ? 'bg-amber-500' : 'bg-emerald-600'}`}
                        />
                        <span className="text-xs font-bold text-slate-800 sm:text-sm">
                          {j.pemegang.harusGantiPassword
                            ? 'Belum ganti password'
                            : 'Aktif'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-500" />
                        <span className="text-xs font-bold text-slate-800 sm:text-sm">
                          Kosong
                        </span>
                      </div>
                    )}
                  </Td>
                  <Td className="text-right">
                    {j.pemegang ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          className={tombolAksiClass}
                          disabled={sedangMengubah}
                          onClick={() => onAjukanPergantian(j)}
                        >
                          Ajukan Pergantian
                        </button>
                        <button
                          type="button"
                          className={tombolResetClass}
                          title="Reset Password"
                          onClick={() => onResetPassword(j)}
                        >
                          <span
                            aria-hidden
                            className="block h-3.5 w-3.5 bg-current"
                            style={{
                              mask: `url("${ikonKeyRound}") center / contain no-repeat`,
                              WebkitMask: `url("${ikonKeyRound}") center / contain no-repeat`,
                            }}
                          />
                          Reset
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className={tombolAksiClass}
                          onClick={() => onIsiJabatan(j)}
                        >
                          + Buat Akun
                        </button>
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
              {/* Bukan bagian dari `daftar.map`: LPM tidak punya baris di
                  tabel `pengurus`, jadi bukan `Jabatan` — datanya lewat
                  prop terpisah (`lpmNama`/`onUbahLpm`), bukan array ini. */}
              <tr className="transition-colors hover:bg-slate-50/80">
                <Td className="border-b-0 font-semibold text-slate-900">
                  Ketua LPM
                </Td>
                <Td className="border-b-0 font-medium text-slate-800">
                  {lpmNama ? (
                    <span className="truncate" title={lpmNama}>
                      {lpmNama}
                    </span>
                  ) : (
                    <span className="font-normal text-slate-400">—</span>
                  )}
                </Td>
                <Td className="border-b-0 text-sm text-slate-400">—</Td>
                <Td className="border-b-0">
                  {lpmNama ? (
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" />
                      <span className="text-xs font-bold text-slate-800 sm:text-sm">
                        Terisi
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-500" />
                      <span className="text-xs font-bold text-slate-800 sm:text-sm">
                        Kosong
                      </span>
                    </div>
                  )}
                </Td>
                <Td className="border-b-0 text-right">
                  {lpmNama ? (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className={tombolAksiClass}
                        disabled={sedangMengubah}
                        onClick={() =>
                          onAjukanPergantian({
                            kode: 'LPM',
                            role: 'LPM' as unknown as Jabatan['role'],
                            label: 'Ketua LPM',
                            pemegang: {
                              nama: lpmNama,
                            } as unknown as Jabatan['pemegang'],
                            calon: null,
                          })
                        }
                      >
                        Ajukan Pergantian
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className={tombolAksiClass}
                        onClick={onUbahLpm}
                      >
                        + Pilih Warga
                      </button>
                    </div>
                  )}
                </Td>
              </tr>
            </tbody>
          </Table>
        )}
      </QueryBoundary>
    </Card>
  );
}
