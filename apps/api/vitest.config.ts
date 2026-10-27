import { defineConfig } from 'vitest/config';

/**
 * El codigo usa ESM/NodeNext, asi que los imports relativos llevan `.js`.
 * Vite no resuelve `.js` -> `.ts` por si solo; este plugin lo hace para que las
 * pruebas puedan importar el codigo fuente tal como se escribe.
 */
export default defineConfig({
  plugins: [
    {
      name: 'play2-js-to-ts',
      enforce: 'pre',
      async resolveId(source, importer) {
        if (importer && source.startsWith('.') && source.endsWith('.js')) {
          const resolved = await this.resolve(source.replace(/\.js$/, '.ts'), importer, {
            skipSelf: true,
          });
          if (resolved) return resolved;
        }
        return null;
      },
    },
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
