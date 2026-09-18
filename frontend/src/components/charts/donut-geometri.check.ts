import { irisanDonut, jalurIrisan, titik } from './donut-geometri.ts';

function benar(syarat: boolean, pesan: string) {
  if (!syarat) throw new Error(`GAGAL: ${pesan}`);
}

function dekat(a: number, b: number, pesan: string) {
  benar(Math.abs(a - b) < 0.001, `${pesan} (${a} vs ${b})`);
}

const tiga = irisanDonut([127, 125, 133]);
benar(tiga.length === 3, 'tiga nilai jadi tiga irisan');
dekat(tiga[0].mulai, 0, 'irisan pertama mulai dari jam 3');
dekat(tiga[2].akhir, 360, 'irisan terakhir menutup lingkaran');
dekat(tiga[0].akhir, (127 / 385) * 360, 'lebar irisan sebanding nilainya');
dekat(tiga[1].mulai, tiga[0].akhir, 'irisan menyambung tanpa celah');
dekat(tiga[0].tengah, tiga[0].akhir / 2, 'titik tengah di tengah irisan');

const nol = irisanDonut([5, 0, 5]);
benar(nol.length === 2, 'nilai nol tidak jadi irisan');
benar(
  nol.map((s) => s.index).join(',') === '0,2',
  'indeks asal ikut terbawa setelah ada yang dilewati',
);

benar(
  irisanDonut([0, 0]).length === 0,
  'total nol mengembalikan daftar kosong',
);
benar(irisanDonut([]).length === 0, 'daftar kosong tetap kosong');

const [x90, y90] = titik(100, 100, 50, 90);
dekat(x90, 100, '90° tepat di atas pusat');
dekat(y90, 50, '90° menghasilkan y lebih kecil (ke atas)');
const [x0] = titik(100, 100, 50, 0);
dekat(x0, 150, '0° di jam 3');

benar(
  jalurIrisan(100, 100, 50, 88, 0, 200).includes('A88 88 0 1 0'),
  'irisan lebih dari setengah lingkaran memakai large-arc-flag 1',
);
benar(
  jalurIrisan(100, 100, 50, 88, 0, 90).includes('A88 88 0 0 0'),
  'irisan kurang dari setengah lingkaran memakai large-arc-flag 0',
);
benar(
  jalurIrisan(100, 100, 50, 88, 0, 90).endsWith('Z'),
  'jalur irisan selalu tertutup',
);

console.log('donut-geometri: semua periksa lolos');
