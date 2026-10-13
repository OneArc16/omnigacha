import { defineConfig } from 'vitest/config';

// Los tests cubren lógica pura (payloads, validación, formato), así que corren
// en Node sin DOM. Si algún día se testean componentes, añadir un proyecto jsdom.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
