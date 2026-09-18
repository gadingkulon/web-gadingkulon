const MAKS_SISI = 1600;

const MAKS_FOTO_BYTE = 600_000;

const MAKS_FOTO_KB = Math.round(MAKS_FOTO_BYTE / 1000);

const MAKS_SUMBER_BYTE = 12_000_000;

export type HasilFoto = { dataUrl: string } | { galat: string };

export async function bacaFoto(berkas: File): Promise<HasilFoto> {
  if (!berkas.type.startsWith('image/')) {
    return { galat: 'Berkas itu bukan gambar. Pilih foto JPG atau PNG.' };
  }
  if (berkas.size > MAKS_SUMBER_BYTE) {
    return {
      galat: `Foto terlalu besar (maksimal ${Math.round(MAKS_SUMBER_BYTE / 1_000_000)} MB). Perkecil dulu sebelum diunggah.`,
    };
  }

  try {
    const gambar = await muatGambar(berkas);

    for (const mutu of [0.82, 0.6, 0.45]) {
      const hasil = keDataUrl(gambar, mutu);
      if (hasil.length <= MAKS_FOTO_BYTE) return { dataUrl: hasil };
    }
    return {
      galat: `Foto masih lebih dari ${MAKS_FOTO_KB} KB setelah diperkecil. Coba foto lain.`,
    };
  } catch {
    return { galat: 'Foto gagal dibaca. Coba berkas lain.' };
  }
}

function muatGambar(berkas: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const alamat = URL.createObjectURL(berkas);
    const gambar = new Image();

    gambar.onload = () => {
      URL.revokeObjectURL(alamat);
      resolve(gambar);
    };
    gambar.onerror = () => {
      URL.revokeObjectURL(alamat);
      reject(new Error('Gambar gagal dimuat.'));
    };
    gambar.src = alamat;
  });
}

function keDataUrl(gambar: HTMLImageElement, mutu: number): string {
  const skala = Math.min(1, MAKS_SISI / Math.max(gambar.width, gambar.height));
  const kanvas = document.createElement('canvas');
  kanvas.width = Math.round(gambar.width * skala);
  kanvas.height = Math.round(gambar.height * skala);

  const konteks = kanvas.getContext('2d');
  if (!konteks) throw new Error('Canvas tidak tersedia.');

  konteks.fillStyle = '#ffffff';
  konteks.fillRect(0, 0, kanvas.width, kanvas.height);
  konteks.drawImage(gambar, 0, 0, kanvas.width, kanvas.height);

  return kanvas.toDataURL('image/jpeg', mutu);
}
