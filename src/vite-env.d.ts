/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Finnhub free API key for live stock quotes (fidel-daytrader). Optional —
   *  without it that card stays simulated. */
  readonly VITE_FINNHUB_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
