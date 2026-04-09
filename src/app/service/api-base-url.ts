type AppImportMetaEnv = {
  readonly NG_APP_API_URL?: string;
  readonly VITE_API_URL?: string;
};

const importMeta = import.meta as ImportMeta & {
  readonly env?: AppImportMetaEnv;
};

function toAbsoluteHttpUrl(value: string): string {
  const normalized = value.trim();
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `https://${normalized}`;
}

// Determine the API base URL from environment variables, with a fallback to localhost
const configuredApiBaseUrl = toAbsoluteHttpUrl(
  importMeta.env?.NG_APP_API_URL ?? importMeta.env?.VITE_API_URL ?? 'https://test-dev-front-nine.vercel.app/'
);

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, '');
