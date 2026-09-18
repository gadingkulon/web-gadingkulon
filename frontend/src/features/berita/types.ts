export interface Berita {
  id: string;

  slug: string;
  judul: string;

  foto: string;

  tanggalTerbit: string;
  penulis: string;

  isi: string;
}

export type BeritaBaru = Omit<Berita, 'id' | 'slug'>;
