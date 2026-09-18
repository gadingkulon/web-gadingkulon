import logoTerang from '@/assets/Logo-lightmode.png';
import { env } from '@/config/env';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src={logoTerang}
      alt={env.appName}
      width={592}
      height={96}
      decoding="async"
      className={cn('h-7 w-auto', className)}
    />
  );
}
