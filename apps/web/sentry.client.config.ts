import * as Sentry from '@sentry/nextjs';

Sentry.init({
  debug: false,
  dsn: 'https://e59a95ba0b70b237301fbc5fcb8e71db@o180224.ingest.us.sentry.io/4506721358512128',
  enabled: process.env.NODE_ENV === 'production',
  ignoreErrors: [
    'ResizeObserver loop completed with undelivered notifications.',
    'ResizeObserver loop limit exceeded'
  ],
  tracesSampleRate: 1
});
