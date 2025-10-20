# @tarko/context-engineer

Context engineering processors, compression tools, and prompt evaluation for Tarko.

## Features

- **Context Reference Processing**: Handle @file: and @dir: references
- **Image Processing**: Compress and optimize images for multimodal inputs
- **Workspace Packing**: Bundle workspace files efficiently
- **Ultimate Prompt Evaluator (UPE)**: Comprehensive prompt analysis and optimization

## Ultimate Prompt Evaluator (UPE)

### Quick Start

```typescript
import { evaluatePrompt } from '@tarko/context-engineer/node';

const result = evaluatePrompt('Your prompt here');
console.log('Score:', result.overallScore);
console.log('Analysis:', result.analysis);
```

### CLI Usage

```bash
# Evaluate a prompt
pnpm upe:eval "You are a helpful assistant"

# Get optimization suggestions
pnpm upe:optimize "Create a report"

# Evaluate a prompt from a file
pnpm upe:eval --file path/to/prompt.txt
```

### Features

- **5-Stage Cognitive Architecture**: Systematic evaluation process
- **34-Point Quality Criteria**: Comprehensive scoring across 7 categories
- **12+ Prompting Techniques**: Library of recognized patterns
- **10+ Optimization Pathways**: Automated improvement suggestions
- **Detailed Analysis Reports**: Actionable insights and recommendations

See [docs/prompt-evaluator.md](../../../docs/prompt-evaluator.md) for complete UPE documentation.

## Development

```bash
pnpm dev           # Build in watch mode
pnpm build         # Build for production
pnpm test          # Run tests
pnpm test:watch    # Watch mode for tests
```

## License

Copyright (c) 2025 Bytedance, Inc. and its affiliates.  
SPDX-License-Identifier: Apache-2.0

