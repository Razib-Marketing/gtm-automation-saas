export interface WorkerBindings {
  DB: D1Database;
  ASSETS: Fetcher;
  BROWSER: BrowserRun;
  RESEND_API_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  CRON_SECRET?: string;
  POLAR_ACCESS_TOKEN?: string;
  POLAR_ORGANIZATION_ID?: string;
  POLAR_PRODUCT_PRO_ID?: string;
  POLAR_PRODUCT_CUSTOM_ID?: string;
  POLAR_WEBHOOK_SECRET?: string;
  EMAIL?: {
    send: (message: Record<string, unknown>) => Promise<void>;
  };
}
