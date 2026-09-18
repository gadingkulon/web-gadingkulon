import type { ReactNode } from 'react';
import { Alert } from './Alert';
import { EmptyState } from './EmptyState';
import { LoadingBlock } from './Spinner';

interface QueryBoundaryProps<T> {
  isLoading: boolean;
  isError: boolean;

  data: T | null | undefined;

  isEmpty?: (data: T) => boolean;
  loadingLabel?: string;
  loadingFallback?: ReactNode;
  errorMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;

  empty?: ReactNode;
  children: (data: T) => ReactNode;
}

export function QueryBoundary<T>({
  isLoading,
  isError,
  data,
  isEmpty,
  loadingLabel,
  loadingFallback,
  errorMessage = 'Gagal memuat data. Silakan muat ulang halaman.',
  emptyTitle = 'Tidak ada data',
  emptyDescription,
  empty,
  children,
}: QueryBoundaryProps<T>) {
  if (isLoading)
    return <>{loadingFallback ?? <LoadingBlock label={loadingLabel} />}</>;
  if (isError || data === undefined)
    return <Alert tone="error">{errorMessage}</Alert>;

  if (data === null || isEmpty?.(data)) {
    return (
      <>
        {empty ?? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </>
    );
  }

  return <>{children(data)}</>;
}
