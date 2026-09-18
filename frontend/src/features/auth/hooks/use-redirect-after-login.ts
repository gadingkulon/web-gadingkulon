import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { homePathForRole } from '@/routes/role-utils';
import type { Role, Session } from '@/types/auth';

interface LokasiAsal {
  pathname?: string;
  search?: string;
  hash?: string;
}

const areaKhususAdmin = paths.admin.pengurus;

function bolehDibukaOleh(role: Role | undefined, pathname: string): boolean {
  return pathname === areaKhususAdmin ? role === 'ADMIN' : true;
}

export function useRedirectAfterLogin(): (session: Session) => void {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (session: Session) => {
      const asal = (location.state as { from?: LokasiAsal } | null)?.from;
      const beranda = homePathForRole(session.user.role);

      const tujuan =
        asal?.pathname && bolehDibukaOleh(session.user.role, asal.pathname)
          ? `${asal.pathname}${asal.search ?? ''}${asal.hash ?? ''}`
          : beranda;

      if (session.user.harusGantiPassword) {
        navigate(paths.gantiPassword, { state: { from: tujuan } });
        return;
      }

      navigate(tujuan, { replace: true });
    },
    [navigate, location.state],
  );
}
