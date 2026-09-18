const ENTITAS: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

export function keRingkasan(isi: string): string {
  return isi
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (e) => ENTITAS[e])
    .replace(/\s+/g, ' ')
    .trim();
}

export function bantuFotoUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (
    url.startsWith('data:image/') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }
  if (url.startsWith('/uploads/')) {
    return `/api${url}`;
  }
  return url;
}
