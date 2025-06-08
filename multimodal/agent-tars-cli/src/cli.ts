#!/usr/bin/env node
/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

import { bootstrapCli } from './index';

export { bootstrapCli };

if (require.main === module) {
  bootstrapCli();
}
