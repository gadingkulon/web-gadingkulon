import { Logo } from '@/components/ui/Logo';
import ikonMenu from '@/assets/icons/nav/menu.svg';
import { AccountButton } from './AccountButton';

export function PublicTopbar({ onOpenNav }: { onOpenNav: () => void }) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b-1 border-black bg-surface px-4 py-3 sm:px-5 sm:py-4 lg:hidden">
      <div className="flex items-center gap-2">
        <button
          className="-ml-1 rounded-md p-2 text-slate-500 hover:bg-slate-100"
          onClick={onOpenNav}
          aria-label="Buka menu"
        >
          <span
            aria-hidden
            className="block h-5 w-5 bg-current"
            style={{
              mask: `url("${ikonMenu}") center / contain no-repeat`,
              WebkitMask: `url("${ikonMenu}") center / contain no-repeat`,
            }}
          />
        </button>
        <Logo />
      </div>
      <AccountButton />
    </div>
  );
}
