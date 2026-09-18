export const paths = {
  landing: '/',

  profil: '/profil',

  infografis: '/infografis',

  berita: '/berita',

  beritaDetail: (slug: string) => `/berita/${slug}`,

  statistik: '/statistik',

  login: '/login',

  gantiPassword: '/ganti-password',
  admin: {
    root: '/admin',
    penduduk: '/admin/penduduk',
    infografis: '/admin/infografis',

    pengurus: '/admin/pengurus',

    berita: '/admin/berita',

    profil: '/admin/profil',

    lokasi: '/admin/lokasi',

    riwayat: '/admin/riwayat',
  },
} as const;
