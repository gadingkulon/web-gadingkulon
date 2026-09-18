const DERAJAT = Math.PI / 180;

export interface Irisan {
  index: number;

  mulai: number;
  akhir: number;
  tengah: number;
}

export function irisanDonut(nilai: number[]): Irisan[] {
  const total = nilai.reduce((n, v) => n + Math.max(v, 0), 0);
  if (total <= 0) return [];

  const hasil: Irisan[] = [];
  let kursor = 0;
  nilai.forEach((v, index) => {
    if (v <= 0) return;
    const akhir = kursor + (v / total) * 360;
    hasil.push({ index, mulai: kursor, akhir, tengah: (kursor + akhir) / 2 });
    kursor = akhir;
  });
  return hasil;
}

export function titik(
  cx: number,
  cy: number,
  r: number,
  sudut: number,
): [number, number] {
  return [
    cx + r * Math.cos(sudut * DERAJAT),
    cy - r * Math.sin(sudut * DERAJAT),
  ];
}

export function jalurIrisan(
  cx: number,
  cy: number,
  rDalam: number,
  rLuar: number,
  mulai: number,
  akhir: number,
): string {
  const besar = akhir - mulai > 180 ? 1 : 0;
  const [xL0, yL0] = titik(cx, cy, rLuar, mulai);
  const [xL1, yL1] = titik(cx, cy, rLuar, akhir);
  const [xD1, yD1] = titik(cx, cy, rDalam, akhir);
  const [xD0, yD0] = titik(cx, cy, rDalam, mulai);

  return [
    `M${xL0} ${yL0}`,
    `A${rLuar} ${rLuar} 0 ${besar} 0 ${xL1} ${yL1}`,
    `L${xD1} ${yD1}`,
    `A${rDalam} ${rDalam} 0 ${besar} 1 ${xD0} ${yD0}`,
    'Z',
  ].join('');
}
