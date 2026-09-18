import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink, Focus, Maximize2, UserCheck } from 'lucide-react';
import { useTitikLokasiList } from '../hooks/use-titik-lokasi';
import type { KategoriTitik, TitikLokasi } from '../types';
import { dapatkanTemaTitik } from '../warna';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

const PUSAT_PADUKUHAN: [number, number] = [-7.656826, 110.363111];
const DEFAULT_ZOOM = 16;

const PETA_BOUNDS = {
  minLat: -7.6605,
  maxLat: -7.653,
  minLon: 110.358,
  maxLon: 110.3685,
};

function dapatkanKoordinat(item: TitikLokasi): [number, number] {
  if (
    item.lat != null &&
    item.lon != null &&
    !Number.isNaN(Number(item.lat)) &&
    !Number.isNaN(Number(item.lon))
  ) {
    return [Number(item.lat), Number(item.lon)];
  }
  const hitungLat =
    PETA_BOUNDS.maxLat -
    (item.y / 100) * (PETA_BOUNDS.maxLat - PETA_BOUNDS.minLat);
  const hitungLon =
    PETA_BOUNDS.minLon +
    (item.x / 100) * (PETA_BOUNDS.maxLon - PETA_BOUNDS.minLon);
  return [hitungLat, hitungLon];
}

function dapatkanWarnaDanIkon(item: TitikLokasi) {
  const tema = dapatkanTemaTitik(item);
  return {
    bg: tema.bgIkon,
    ring: tema.ringHotspot,
    badgeClass: `background-color: ${tema.bgHex}; color: white;`,
    simbol: tema.simbol,
  };
}

function buatDivIcon(item: TitikLokasi) {
  const { bg, simbol } = dapatkanWarnaDanIkon(item);

  return L.divIcon({
    className: 'sigalon-osm-marker',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer group" style="width: 36px; height: 36px;">
        <span class="relative flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold shadow-lg border-2 border-black ring-2 ring-white transition-transform duration-150 group-hover:scale-115 ${bg}">
          ${simbol}
        </span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function buatPopupHtml(item: TitikLokasi, lat: number, lon: number) {
  const { badgeClass } = dapatkanWarnaDanIkon(item);
  const mapsUrl =
    item.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 2px; min-width: 210px;">
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
        <span style="display: inline-block; padding: 2px 8px; font-size: 10px; font-weight: 700; border-radius: 4px; ${badgeClass}">
          ${item.kategoriLabel}
        </span>
        ${
          item.peran
            ? `<span style="padding: 1px 6px; font-size: 9px; font-family: monospace; font-weight: 600; border-radius: 3px; background: #f1f5f9; color: #334155; border: 1px solid #000000;">${item.peran}</span>`
            : ''
        }
      </div>
      <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3;">
        ${item.nama}
      </h4>
      ${
        item.deskripsi
          ? `<p style="margin: 6px 0 0 0; font-size: 11px; color: #475569; line-height: 1.5;">${item.deskripsi}</p>`
          : ''
      }
      <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #000000;">
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: #2563eb; text-decoration: none;">
          <span>Buka di Google Maps</span> ↗
        </a>
      </div>
    </div>
  `;
}

export function PetaOpenStreetMap({ className }: { className?: string }) {
  const { data: hotspots = [], isLoading } = useTitikLokasiList();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [tabAktif, setTabAktif] = useState<'semua' | KategoriTitik>('semua');
  const [modalOpen, setModalOpen] = useState(false);

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: PUSAT_PADUKUHAN,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: false, // Hindari mencegat scroll halaman web
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Update Markers saat data atau filter kategori berubah
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer || !mapInstanceRef.current) return;

    layer.clearLayers();

    const dataTerfilter = hotspots.filter((item) => {
      if (tabAktif === 'semua') return true;
      return item.kategori === tabAktif;
    });

    dataTerfilter.forEach((item) => {
      const [lat, lon] = dapatkanKoordinat(item);
      const icon = buatDivIcon(item);
      const marker = L.marker([lat, lon], { icon });

      marker.bindPopup(buatPopupHtml(item, lat, lon), {
        maxWidth: 280,
      });

      layer.addLayer(marker);
    });
  }, [hotspots, tabAktif]);

  const resetPusatPeta = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(PUSAT_PADUKUHAN, DEFAULT_ZOOM, {
        animate: true,
      });
    }
  };

  const jumlahFasilitas = hotspots.filter(
    (t) => t.kategori === 'fasilitas',
  ).length;
  const jumlahPerangkat = hotspots.filter(
    (t) => t.kategori === 'perangkat',
  ).length;

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Filter Kategori Titik di Atas Peta OSM */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setTabAktif('semua')}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                tabAktif === 'semua'
                  ? 'shadow-xs bg-slate-900 text-white'
                  : 'border-1 border-black bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              Semua Titik
              <span
                className={cn(
                  'py-0.2 ml-1 rounded-full px-1.5 text-2xs font-extrabold',
                  tabAktif === 'semua'
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-200 text-slate-900',
                )}
              >
                {hotspots.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTabAktif('fasilitas')}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                tabAktif === 'fasilitas'
                  ? 'shadow-xs bg-teal-700 text-white'
                  : 'border-1 border-black bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              Fasilitas Umum
              <span
                className={cn(
                  'py-0.2 ml-1 rounded-full px-1.5 text-2xs font-extrabold',
                  tabAktif === 'fasilitas'
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-200 text-slate-900',
                )}
              >
                {jumlahFasilitas}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTabAktif('perangkat')}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                tabAktif === 'perangkat'
                  ? 'shadow-xs bg-blue-700 text-white'
                  : 'border-1 border-black bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              Perangkat Desa
              <span
                className={cn(
                  'py-0.2 ml-1 rounded-full px-1.5 text-2xs font-extrabold',
                  tabAktif === 'perangkat'
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-200 text-slate-900',
                )}
              >
                {jumlahPerangkat}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={resetPusatPeta}
              className="shadow-xs inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-1 border-black bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 transition-colors hover:bg-slate-100"
              title="Kembalikan fokus ke pusat Padukuhan Gading Kulon"
            >
              <Focus className="h-3.5 w-3.5 shrink-0 text-slate-900" />
              <span className="hidden sm:inline">Pusat Wilayah</span>
            </button>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="shadow-xs inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-1 border-black bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 transition-colors hover:bg-slate-100"
              title="Buka peta ukuran penuh"
            >
              <Maximize2 className="h-3.5 w-3.5 shrink-0 text-slate-900" />
              <span className="hidden sm:inline">Peta Penuh</span>
            </button>
          </div>
        </div>

        {/* Kontainer Peta Leaflet OpenStreetMap */}
        <div
          className={cn(
            'relative z-0 min-h-[360px] overflow-hidden rounded-xl border-1 border-black bg-slate-100 shadow-sm sm:min-h-[440px]',
            className,
          )}
        >
          {isLoading && (
            <div className="backdrop-blur-xs absolute inset-0 z-20 flex items-center justify-center bg-white/70">
              <span className="text-xs text-slate-500">
                Memuat titik peta OpenStreetMap…
              </span>
            </div>
          )}
          {tabAktif === 'perangkat' && jumlahPerangkat === 0 && !isLoading && (
            <div className="backdrop-blur-xs pointer-events-none absolute left-1/2 top-3 z-[400] flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1.5 text-2xs font-medium text-white shadow-md">
              <UserCheck className="h-3.5 w-3.5 text-purple-300" />
              <span>Belum ada data kediaman perangkat desa terdaftar</span>
            </div>
          )}
          <div
            ref={mapContainerRef}
            className="z-0 h-full min-h-[360px] w-full sm:min-h-[440px]"
          />
        </div>
      </div>

      {/* Modal Peta Penuh OpenStreetMap */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Peta Interaktif OpenStreetMap Padukuhan Gading Kulon"
        className="max-w-5xl"
      >
        <div className="space-y-4">
          <div className="h-[65vh] w-full overflow-hidden rounded-lg border-1 border-black bg-slate-100">
            <iframe
              title="Peta OpenStreetMap Layar Penuh"
              className="h-full w-full border-0"
              src="https://www.openstreetmap.org/export/embed.html?bbox=110.354000%2C-7.662000%2C110.372000%2C-7.651000&layer=mapnik&marker=-7.656826%2C110.363111"
            />
          </div>
          <div className="flex flex-col justify-between gap-2.5 border-t-1 border-black pt-3 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              Peta geospasial resmi berbasis OpenStreetMap kontributor terbuka.
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=-7.656826,110.363111"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#FACC15] px-4 py-2 text-xs font-bold text-blue-900 shadow-sm transition-all hover:bg-yellow-400 hover:shadow-md active:scale-[0.98]"
            >
              <span>Buka di Google Maps</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
}
