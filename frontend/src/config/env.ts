function readString(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value : fallback;
}

export const env = {
  apiBaseUrl: readString(import.meta.env.VITE_API_BASE_URL, '/api'),
  appName: readString(import.meta.env.VITE_APP_NAME, 'SIGALON'),
} as const;
