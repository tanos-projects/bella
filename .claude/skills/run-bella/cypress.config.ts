import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    supportFile: false,
    specPattern: '.claude/skills/run-bella/*.cy.ts',
  },
});
