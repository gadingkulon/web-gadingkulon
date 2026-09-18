import assert from 'node:assert/strict';
import { keRingkasan } from './utils.ts';
// `formatTanggal` pindah ke `lib/tanggal.ts` sesudah berkas ini dibuat —
// tiga salinannya disatukan di sana. Uji perilakunya ikut pindah, bukan dibuang.
import { formatTanggal } from '../../lib/tanggal.ts';

assert.equal(keRingkasan('<p>Satu.</p><p>Dua.</p>'), 'Satu. Dua.');
assert.equal(
  keRingkasan('<p>Kerja bakti <strong>RW 01</strong></p>'),
  'Kerja bakti RW 01',
);
assert.equal(
  keRingkasan('<p>Ronda &amp; kerja bakti</p>'),
  'Ronda & kerja bakti',
);
assert.equal(keRingkasan('   <p>  Rapi.  </p>  '), 'Rapi.');

assert.equal(
  keRingkasan('<p><img src="data:image/png;base64,AAAA" alt="x"></p>'),
  '',
);
assert.equal(keRingkasan(''), '');

assert.equal(formatTanggal('2026-08-31'), '31 Agustus 2026');
assert.equal(formatTanggal('bukan-tanggal'), 'bukan-tanggal');

console.log('berita/utils: OK');
