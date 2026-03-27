interface ImportMetaEnv {
  readonly NG_APP_API_URL?: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env?: ImportMetaEnv;
}
