export interface TemaTitik {
  bgIkon: string;
  bgBadge: string;
  bgHex: string;
  textIkon: string;
  ringHotspot: string;
  ringHex: string;
  simbol: string;
  labelSingkat: string;
}

/**
 * Menghasilkan skema warna solid & tegas yang bervariasi secara profesional
 * berdasarkan jenis fasilitas maupun hierarki peran perangkat desa.
 */
export function dapatkanTemaTitik(item: {
  kategori?: string;
  ikon?: string;
  nama?: string;
  peran?: string | null;
  kategoriLabel?: string;
}): TemaTitik {
  const kategori = item.kategori ?? '';
  const ikon = item.ikon ?? '';
  const teks =
    `${item.peran ?? ''} ${item.nama ?? ''} ${item.kategoriLabel ?? ''}`.toLowerCase();

  // 1. Kategori Perangkat Desa: selaras dengan tab filter Perangkat Desa (warna biru tegas)
  if (kategori === 'perangkat' || ikon === 'perangkat') {
    // Kepala Dukuh / Kadus -> Biru
    if (
      teks.includes('dukuh') ||
      teks.includes('kadus') ||
      teks.includes('kepala dusun')
    ) {
      return {
        bgIkon: 'bg-blue-700',
        bgBadge: 'bg-blue-700',
        bgHex: '#1d4ed8',
        textIkon: 'text-blue-700',
        ringHotspot: 'bg-blue-400',
        ringHex: '#60a5fa',
        simbol: '👑',
        labelSingkat: 'Dukuh',
      };
    }
    // RW (Rukun Warga) -> Biru
    if (teks.includes('rw') || teks.includes('rukun warga')) {
      return {
        bgIkon: 'bg-blue-700',
        bgBadge: 'bg-blue-700',
        bgHex: '#1d4ed8',
        textIkon: 'text-blue-700',
        ringHotspot: 'bg-blue-400',
        ringHex: '#60a5fa',
        simbol: '🏢',
        labelSingkat: 'Ketua RW',
      };
    }
    // RT (Rukun Tetangga) -> Biru
    if (teks.includes('rt') || teks.includes('rukun tetangga')) {
      return {
        bgIkon: 'bg-blue-700',
        bgBadge: 'bg-blue-700',
        bgHex: '#1d4ed8',
        textIkon: 'text-blue-700',
        ringHotspot: 'bg-blue-400',
        ringHex: '#60a5fa',
        simbol: '🏡',
        labelSingkat: 'Ketua RT',
      };
    }
    // Perangkat Desa Umum / Pamong -> Biru
    return {
      bgIkon: 'bg-blue-700',
      bgBadge: 'bg-blue-700',
      bgHex: '#1d4ed8',
      textIkon: 'text-blue-700',
      ringHotspot: 'bg-blue-400',
      ringHex: '#60a5fa',
      simbol: '👤',
      labelSingkat: 'Perangkat Desa',
    };
  }

  // 2. Kategori Fasilitas Umum: variasikan warna berdasarkan jenis fasilitas
  switch (ikon) {
    case 'ibadah':
      return {
        bgIkon: 'bg-emerald-600',
        bgBadge: 'bg-emerald-700',
        bgHex: '#047857',
        textIkon: 'text-emerald-600',
        ringHotspot: 'bg-emerald-400',
        ringHex: '#34d399',
        simbol: '🕌',
        labelSingkat: 'Tempat Ibadah',
      };
    case 'poskamling':
      return {
        bgIkon: 'bg-blue-600',
        bgBadge: 'bg-blue-700',
        bgHex: '#1d4ed8',
        textIkon: 'text-blue-600',
        ringHotspot: 'bg-blue-400',
        ringHex: '#60a5fa',
        simbol: '🛡️',
        labelSingkat: 'Keamanan',
      };
    case 'posyandu':
      return {
        bgIkon: 'bg-rose-600',
        bgBadge: 'bg-rose-700',
        bgHex: '#be123c',
        textIkon: 'text-rose-600',
        ringHotspot: 'bg-rose-400',
        ringHex: '#fb7185',
        simbol: '🏥',
        labelSingkat: 'Kesehatan & Sosial',
      };
    case 'balai':
      return {
        bgIkon: 'bg-amber-600',
        bgBadge: 'bg-amber-600',
        bgHex: '#d97706',
        textIkon: 'text-amber-600',
        ringHotspot: 'bg-amber-400',
        ringHex: '#fbbf24',
        simbol: '🏛️',
        labelSingkat: 'Pusat Pemerintahan',
      };
    default: {
      if (
        teks.includes('masjid') ||
        teks.includes('mushola') ||
        teks.includes('ibadah')
      ) {
        return {
          bgIkon: 'bg-emerald-600',
          bgBadge: 'bg-emerald-700',
          bgHex: '#047857',
          textIkon: 'text-emerald-600',
          ringHotspot: 'bg-emerald-400',
          ringHex: '#34d399',
          simbol: '🕌',
          labelSingkat: 'Tempat Ibadah',
        };
      }
      if (
        teks.includes('ronda') ||
        teks.includes('kamling') ||
        teks.includes('jaga') ||
        teks.includes('keamanan')
      ) {
        return {
          bgIkon: 'bg-blue-600',
          bgBadge: 'bg-blue-700',
          bgHex: '#1d4ed8',
          textIkon: 'text-blue-600',
          ringHotspot: 'bg-blue-400',
          ringHex: '#60a5fa',
          simbol: '🛡️',
          labelSingkat: 'Keamanan',
        };
      }
      if (
        teks.includes('kesehatan') ||
        teks.includes('posyandu') ||
        teks.includes('sosial')
      ) {
        return {
          bgIkon: 'bg-rose-600',
          bgBadge: 'bg-rose-700',
          bgHex: '#be123c',
          textIkon: 'text-rose-600',
          ringHotspot: 'bg-rose-400',
          ringHex: '#fb7185',
          simbol: '🏥',
          labelSingkat: 'Kesehatan & Sosial',
        };
      }
      if (
        teks.includes('lapangan') ||
        teks.includes('taman') ||
        teks.includes('olahraga')
      ) {
        return {
          bgIkon: 'bg-lime-700',
          bgBadge: 'bg-lime-700',
          bgHex: '#4d7c0f',
          textIkon: 'text-lime-700',
          ringHotspot: 'bg-lime-400',
          ringHex: '#a3e635',
          simbol: '⚽',
          labelSingkat: 'Area Publik',
        };
      }
      return {
        bgIkon: 'bg-slate-700',
        bgBadge: 'bg-slate-700',
        bgHex: '#334155',
        textIkon: 'text-slate-700',
        ringHotspot: 'bg-slate-400',
        ringHex: '#94a3b8',
        simbol: '📍',
        labelSingkat: 'Fasilitas Umum',
      };
    }
  }
}
