import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PilihWarga } from '@/components/ui/PilihWarga';
import { useCariWarga } from '@/hooks/use-cari-warga';
import { useDebounce } from '@/hooks/use-debounce';
import { pesanError } from '@/lib/utils';
import type { WargaPilihan } from '@/lib/warga-api';
import { useIsiLpm } from '../hooks/use-pengurus';

interface UbahLpmDialogProps {
  open: boolean;
  onClose: () => void;
}

export function UbahLpmDialog({ open, onClose }: UbahLpmDialogProps) {
  const [cari, setCari] = useState('');
  const [terpilih, setTerpilih] = useState<WargaPilihan | null>(null);
  const debounced = useDebounce(cari);
  const { data: hasil, isFetching } = useCariWarga(debounced, 'LPM');
  const isiLpm = useIsiLpm();

  function tutup() {
    setCari('');
    setTerpilih(null);
    isiLpm.reset();
    onClose();
  }

  function kirim() {
    if (!terpilih) return;
    isiLpm.mutate(terpilih.id, { onSuccess: tutup });
  }

  return (
    <Modal open={open} onClose={tutup} title="Pilih Ketua LPM">
      <div className="space-y-4">
        <PilihWarga
          label="Siapa yang menjadi Ketua LPM"
          cari={cari}
          onCariChange={setCari}
          hasil={hasil}
          sedangMencari={isFetching}
          terpilih={terpilih}
          onPilih={setTerpilih}
          hint="Ketua LPM boleh berasal dari RW mana saja."
        />

        {isiLpm.error && (
          <Alert tone="error">
            {pesanError(isiLpm.error, 'Gagal memilih Ketua LPM.')}
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={tutup}>
            Batal
          </Button>
          <Button
            type="button"
            disabled={!terpilih}
            isLoading={isiLpm.isPending}
            onClick={kirim}
          >
            Pilih Warga
          </Button>
        </div>
      </div>
    </Modal>
  );
}
