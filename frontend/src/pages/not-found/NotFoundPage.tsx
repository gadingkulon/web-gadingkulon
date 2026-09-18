import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { KreditKkn } from '@/components/ui/KreditKkn';
import { paths } from '@/routes/paths';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-center">
      <div className="my-auto flex flex-col items-center gap-4 px-4">
        <p className="text-6xl font-bold text-brand-600">404</p>
        <h1 className="text-xl font-semibold text-slate-900">
          Halaman tidak ditemukan
        </h1>
        <p className="max-w-sm text-sm text-slate-500">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <Link to={paths.landing}>
          <Button>Kembali ke Beranda</Button>
        </Link>
      </div>

      <KreditKkn className="px-4 py-2" />
    </div>
  );
}
