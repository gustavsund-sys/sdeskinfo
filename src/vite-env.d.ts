/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_VIDEO_TRIGGER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
