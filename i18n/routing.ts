import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'hy', 'ru'],
  defaultLocale: 'ru',
  // Do not auto-redirect based on browser Accept-Language header.
  // Visitors always start on /ru; they can switch manually via the language picker.
  localeDetection: false,
});
