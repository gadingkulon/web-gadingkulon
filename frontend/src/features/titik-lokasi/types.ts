export type KategoriTitik = 'perangkat' | 'fasilitas';

export type IkonTitik =
  'balai' | 'ibadah' | 'poskamling' | 'posyandu' | 'perangkat' | string;

export interface TitikLokasi {
  id: string;
  nama: string;
  kategori: KategoriTitik;
  peran?: string | null;
  kategoriLabel: string;
  deskripsi: string;
  x: number; // Persentase posisi horizontal (0 - 100)
  y: number; // Persentase posisi vertikal (0 - 100)
  lat?: number | null;
  lon?: number | null;
  googleMapsUrl?: string | null;
  ikon: IkonTitik;
  urutan: number;
}

export type TitikLokasiUbah = Partial<Omit<TitikLokasi, 'id'>>;

export type TitikLokasiBaru = Omit<TitikLokasi, 'id'> & {
  id?: string;
};
