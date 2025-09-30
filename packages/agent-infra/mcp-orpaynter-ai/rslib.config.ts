import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'cjs',
      dts: true,
      shims: { cjs: true }
    }
  ],
  output: {
    target: 'node'
  }
});