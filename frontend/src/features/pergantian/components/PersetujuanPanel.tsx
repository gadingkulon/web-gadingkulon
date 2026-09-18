import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { pesanError } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useJawabPengajuan, useMenungguJawaban } from '../hooks/use-pergantian';

function normalisasi(v?: string | null): string {
  if (!v) return '';
  const s = v.trim();
  return /^\d+$/.test(s) ? s.replace(/^0+/, '') || '0' : s;
}

export function PersetujuanPanel() {
  const { isPengurus } = useAuth();
  const { data } = useMenungguJawaban(isPengurus);
  const jawab = useJawabPengajuan();

  if (!isPengurus || !data || data.length === 0) return null;

  return (
    <Card className="mb-6 border-amber-300">
      <CardHeader
        title="Menunggu persetujuan Anda"
        description="Jawaban tidak bisa diubah setelah dikirim."
      />
      <CardContent className="space-y-4">
        {data.map((p) => (
          <div
            key={p.id}
            className="flex flex-col justify-between gap-3 rounded-lg bg-amber-500/[9%] px-4 py-3 sm:flex-row sm:items-center"
          >
            <div className="text-sm">
              <p className="font-medium text-slate-900">
                Pergantian {p.jabatan}
              </p>
              <p className="text-slate-600">
                Diusulkan: {p.kandidatNama} · RT {normalisasi(p.kandidatRt)}/RW{' '}
                {normalisasi(p.kandidatRw)}
              </p>
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <Button
                size="sm"
                variant="outline"
                disabled={jawab.isPending}
                onClick={() => {
                  if (!window.confirm(`Tolak pergantian ${p.jabatan}?`)) return;
                  jawab.mutate({ id: p.id, setuju: false });
                }}
              >
                Tolak
              </Button>
              <Button
                size="sm"
                disabled={jawab.isPending}
                onClick={() => {
                  if (
                    !window.confirm(
                      `Setujui ${p.kandidatNama} sebagai ${p.jabatan}?`,
                    )
                  )
                    return;
                  jawab.mutate({ id: p.id, setuju: true });
                }}
              >
                Setujui
              </Button>
            </div>
          </div>
        ))}
        {jawab.error && (
          <Alert tone="error">
            {pesanError(jawab.error, 'Gagal mengirim jawaban.')}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
