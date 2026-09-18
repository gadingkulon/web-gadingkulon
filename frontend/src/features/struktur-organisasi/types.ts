export interface JabatanWilayahPublik {
  nomor: string;
  nama: string | null;
}

export interface RwPublik extends JabatanWilayahPublik {
  rt: JabatanWilayahPublik[];
}

export interface StrukturOrganisasiPublik {
  dukuh: string | null;
  rw: RwPublik[];
  lpm: string | null;
}
