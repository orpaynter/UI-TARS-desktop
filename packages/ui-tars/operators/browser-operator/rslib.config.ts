/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { defineConfig } from '@rslib/core';
import { rslibConfig } from '@common/configs/rslib.config';

export default defineConfig({
  ...rslibConfig,
  lib: [
    {
      format: 'esm',
      syntax: 'es2021',
      bundle: false,
      dts: false, // Disable declaration files to avoid TypeScript errors
      banner: { js: '/**\n* Copyright (c) 2025 Bytedance, Inc. and its affiliates.\n* SPDX-License-Identifier: Apache-2.0\n*/' },
    },
    {
      format: 'cjs',
      syntax: 'es2021',
      bundle: false,
      dts: false, // Disable declaration files to avoid TypeScript errors
      banner: { js: '/**\n* Copyright (c) 2025 Bytedance, Inc. and its affiliates.\n* SPDX-License-Identifier: Apache-2.0\n*/' },
    },
  ],
});
