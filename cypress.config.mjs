import { defineConfig } from 'cypress';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  trashAssetsBeforeRuns: false,
  video: true,
  viewportWidth: 1440,
  viewportHeight: 1000,
  defaultCommandTimeout: 15000,
  e2e: {
    experimentalInteractiveRunEvents: true,
    baseUrl: 'http://localhost:3000',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.js',
    setupNodeEvents(on, config) {
      const db = path.join(config.projectRoot, 'data/templates.json');
      let original;
      const restore = () => {
        if (original !== undefined) fs.writeFileSync(db, original);
        return null;
      };
      on('before:spec', () => { original = fs.readFileSync(db); });
      on('task', {
        'templates:restore': restore,
        'templates:read': () => JSON.parse(fs.readFileSync(db, 'utf8')),
      });
      on('after:spec', restore);
      on('after:run', restore);
      return config;
    },
  },
});
