type AppImportMetaEnv = {
  readonly NG_APP_API_URL?: string;
  readonly VITE_API_URL?: string;
};

const importMeta = import.meta as ImportMeta & {
  readonly env?: AppImportMetaEnv;
};

const configuredApiBaseUrl = (
  importMeta.env?.NG_APP_API_URL ?? 'test-dev-production-a619.up.railway.app'
).trim();

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, '');
