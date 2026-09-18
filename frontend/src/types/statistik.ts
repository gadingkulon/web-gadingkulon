export interface Distribusi {
  label: string;
  value: number;
}

export interface PanelDistribusi {
  id: string;
  judul: string;
  jenis: 'pie' | 'bar' | 'bar-vertical';
  data: Distribusi[];

  deskripsi?: string;

  lebarPenuh?: boolean;
}
