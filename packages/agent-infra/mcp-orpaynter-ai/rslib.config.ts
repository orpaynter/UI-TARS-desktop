import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      output: {
        distPath: {
          root: 'dist',
        },
      },
      dts: false,
    },
    {
      format: 'cjs',
      output: {
        distPath: {
          root: 'dist',
        },
      },
      dts: false,
    },
  ],
});
