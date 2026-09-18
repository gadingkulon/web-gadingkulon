export interface Padukuhan {
  nama: string;
  namaLengkap: string;
  desa: string;
  kapanewon: string;
  kabupaten: string;
  provinsi: string;
  luasWilayah: string;

  telepon: string;
  email: string;

  sejarah: string;
  batasUtara: string;
  batasTimur: string;
  batasSelatan: string;
  batasBarat: string;
}

export const PADUKUHAN_BAWAAN: Padukuhan = {
  nama: 'Gading Kulon',
  namaLengkap: 'Padukuhan Gading Kulon',
  desa: 'Donokerto',
  kapanewon: 'Kapanewon Turi',
  kabupaten: 'Sleman',
  provinsi: 'Daerah Istimewa Yogyakarta',
  luasWilayah: '162,4 ha',
  telepon: '+62 812-2761-391',
  email: 'gadingkulon@gmail.com',
  sejarah: [
    'Gading Kulon merupakan salah satu padukuhan yang berada di Kalurahan Donokerto, Kapanewon Turi, Kabupaten Sleman, Daerah Istimewa Yogyakarta. Dalam penyelenggaraan kehidupan masyarakat, Padukuhan Gading Kulon terbagi menjadi 3 Rukun Warga (RW) dan 6 Rukun Tetangga (RT) yang menjadi bagian dari struktur kemasyarakatan di tingkat wilayah.',
    'Sebagai bagian dari kawasan Kapanewon Turi, kehidupan masyarakat Gading Kulon berkembang dengan didukung oleh potensi lingkungan, kegiatan sosial, serta kebersamaan antarwarga. Interaksi masyarakat tercermin dalam berbagai kegiatan seperti kerja bakti, ronda malam, kegiatan kemasyarakatan, dan aktivitas Karang Taruna yang melibatkan warga dari berbagai kelompok usia.',
  ].join('\n\n'),
  batasUtara: 'Gunung Anyar',
  batasTimur: 'Gading Wetan',
  batasSelatan: 'Kenaruhan',
  batasBarat: 'Dusun Tepan, Bangunkerto',
};

const PETA = {
  koordinat: { lat: -7.656826, lon: 110.363111 },

  radiusPeta: 0.012,
} as const;

export const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${PETA.koordinat.lat},${PETA.koordinat.lon}`;

export function paragrafSejarah(sejarah: string): string[] {
  return sejarah
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export interface BatasWilayah {
  arah: 'Utara' | 'Timur' | 'Selatan' | 'Barat';
  wilayah: string;
}

export function batasWilayah(p: Padukuhan): BatasWilayah[] {
  return [
    { arah: 'Utara', wilayah: p.batasUtara },
    { arah: 'Timur', wilayah: p.batasTimur },
    { arah: 'Selatan', wilayah: p.batasSelatan },
    { arah: 'Barat', wilayah: p.batasBarat },
  ];
}
