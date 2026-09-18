import { filterLabel, toFilterChips } from './labels.ts';

function benar(syarat: boolean, pesan: string) {
  if (!syarat) throw new Error(`GAGAL: ${pesan}`);
}

const campur = toFilterChips({
  agama: 'ISLAM',
  rt: '004',
  pekerjaan: 'Petani',
});
benar(campur.length === 3, 'tiga filter jadi tiga chip');
benar(
  campur.find((c) => c.field === 'agama')?.nilai === 'Islam',
  'enum agama dipakai labelnya, bukan ISLAM',
);
benar(
  campur.find((c) => c.field === 'rt')?.nilai === '004',
  'nomor RT dicetak apa adanya',
);
benar(
  campur.find((c) => c.field === 'pekerjaan')?.nilai === 'Petani',
  'pekerjaan teks bebas dicetak apa adanya',
);

benar(
  toFilterChips({ kelompokUmur: '26-40' })[0].nilai === '26-40 th',
  'kelompok umur diberi satuan tahun',
);

const urutanKlik = toFilterChips({
  pekerjaan: 'Petani',
  rw: '019',
  agama: 'HINDU',
});
benar(
  urutanKlik.map((c) => c.field).join(',') === 'rw,agama,pekerjaan',
  `chip mengikuti urutan filterLabel (dapat: ${urutanKlik.map((c) => c.field).join(',')})`,
);

benar(toFilterChips({}).length === 0, 'tanpa filter, tanpa chip');
benar(toFilterChips({ rt: '' }).length === 0, 'nilai kosong tidak jadi chip');

benar(
  Object.values(filterLabel).every(
    (t) => typeof t === 'string' && t.length > 0,
  ),
  'semua field filter punya label',
);

console.log('OK — toFilterChips');
