export const API_PREFIX = '/api';

export function withApiPrefix(url?: string): string | undefined {
  if (!url) return url;

  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

  if (normalizedUrl === API_PREFIX || normalizedUrl.startsWith(`${API_PREFIX}/`)) {
    return normalizedUrl;
  }

  return `${API_PREFIX}${normalizedUrl}`;
}
