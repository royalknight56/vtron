import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: '9xrcmx',
  hosts: {},
  chromeWebSecurity: false,
  video: true,
  e2e: {
    baseUrl: 'https://vtron.site/',
    specPattern: 'cypress/tests/**/*.spec.{ts,tsx}',
    retries: {
      openMode: 0,
      runMode: 3,
    },
  },
});
