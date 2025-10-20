# Ultimate Prompt Evaluator (UPE)

## Overview

The Ultimate Prompt Evaluator (UPE) is a comprehensive prompt analysis, refinement, and optimization system integrated into the UI-TARS-desktop project. It provides expert-level prompt evaluation capabilities to help improve the clarity, effectiveness, and safety of prompts used throughout the system.

## What it Does

UPE analyzes prompts using a sophisticated framework and provides:
- **Comprehensive scoring** across 7 key dimensions
- **Technique identification** from a library of 12+ prompting strategies
- **Automated pathway triggers** for optimization (10+ pathways)
- **Actionable recommendations** for improvement
- **Detailed analysis reports** with strengths and weaknesses

## Core Components

### 1. 5-Stage Cognitive Architecture

UPE evaluates prompts through five sequential stages:

1. **Initialization**: Parse and understand the prompt structure
2. **Expertise Acquisition**: Identify applicable prompting techniques
3. **Adaptive Response**: Evaluate against quality criteria
4. **Self-Optimization**: Identify improvement pathways
5. **Neural Symbiosis**: Generate comprehensive recommendations

### 2. 34-Point Quality Criteria

Prompts are evaluated across **7 categories** with specific criteria:

#### Clarity (5 criteria)
- Task Definition
- Language Precision
- Structure
- Examples
- Constraints

#### Accuracy (5 criteria)
- Factual Grounding
- Source Attribution
- Hallucination Prevention
- Verification Steps
- Confidence Indicators

#### Robustness (5 criteria)
- Edge Case Handling
- Error Recovery
- Input Variation
- Fallback Strategies
- Consistency

#### Resource Efficiency (5 criteria)
- Token Usage
- Redundancy
- Context Management
- Iteration Count
- Complexity Balance

#### Ethical Alignment (5 criteria)
- Safety Constraints
- Privacy Protection
- Bias Awareness
- Harmful Content Prevention
- Transparency

#### Tool Integration (5 criteria)
- Tool Selection
- API Usage
- Function Orchestration
- Tool Error Handling
- Output Integration

#### Multi-Modal Adaptability (4 criteria)
- Image Understanding
- Cross-Modal Integration
- Format Flexibility
- Modal-Specific Instructions

### 3. Prompting Techniques Library

UPE recognizes 12+ prompting techniques across three categories:

**Foundational Techniques:**
- Zero-Shot
- Few-Shot
- Chain-of-Thought (CoT)
- Role Prompting

**Advanced Techniques:**
- Tree-of-Thoughts (ToT)
- Retrieval-Augmented Generation (RAG)
- Self-Consistency
- Automatic Reasoning and Tool-use (ART)

**Specialized Techniques:**
- Multi-Modal Prompting
- Constitutional AI
- Prompt Chaining
- Meta-Prompting

### 4. Evaluation Pathways

UPE features 10+ prioritized pathways that trigger automatically:

1. **Context Preservation** (Priority: 10)
2. **Intent Refinement** (Priority: 9)
3. **Error Prevention** (Priority: 9)
4. **Safety & Ethical Alignment** (Priority: 9)
5. **Function Integration** (Priority: 8)
6. **Format Transition** (Priority: 8)
7. **Multi-Modal Handling** (Priority: 8)
8. **Chain-of-Thought Enhancement** (Priority: 7)
9. **Resource Optimization** (Priority: 7)
10. **Output Validation** (Priority: 7)

## Usage

### Basic Evaluation

```typescript
import { evaluatePrompt } from '@tarko/context-engineer/node';

const prompt = `You are a helpful AI assistant. 
Please think step by step and provide accurate answers.`;

const result = evaluatePrompt(prompt);

console.log('Overall Score:', result.overallScore);
console.log('Strengths:', result.strengths);
console.log('Weaknesses:', result.weaknesses);
console.log('Recommendations:', result.recommendations);
console.log('Analysis:', result.analysis);
```

### Optimization

```typescript
import { optimizePrompt } from '@tarko/context-engineer/node';

const prompt = 'Simple task description';
const { optimized, changes } = optimizePrompt(prompt);

console.log('Suggested Changes:', changes);
```

### Advanced Usage

```typescript
import { UltimatePromptEvaluator } from '@tarko/context-engineer/node';

const evaluator = new UltimatePromptEvaluator();
const result = evaluator.evaluate(yourPrompt);

// Access detailed scores
console.log('Clarity Score:', result.score.clarity);
console.log('Accuracy Score:', result.score.accuracy);
console.log('Triggered Pathways:', result.triggeredPathways);
```

## Evaluation Output

The evaluation returns a comprehensive `PromptEvaluationResult` object:

```typescript
interface PromptEvaluationResult {
  score: {
    clarity: number;              // 0-10
    accuracy: number;             // 0-10
    robustness: number;           // 0-10
    resourceEfficiency: number;   // 0-10
    ethicalAlignment: number;     // 0-10
    toolIntegration: number;      // 0-10
    multiModalAdaptability: number; // 0-10
  };
  overallScore: number;           // 0-10 (average)
  strengths: string[];            // Identified strengths
  weaknesses: string[];           // Areas for improvement
  recommendations: string[];      // Actionable suggestions
  triggeredPathways: string[];    // Activated optimization pathways
  analysis: string;               // Detailed analysis report
}
```

## Integration Points

### With Agent TARS

UPE can evaluate system prompts used by Agent TARS:

```typescript
import { DEFAULT_SYSTEM_PROMPT } from '@agent-tars/core';
import { evaluatePrompt } from '@tarko/context-engineer/node';

const evaluation = evaluatePrompt(DEFAULT_SYSTEM_PROMPT);
// Use evaluation results to improve agent prompts
```

### With UI-TARS Desktop

Evaluate prompts used in the desktop application's agent system:

```typescript
import { getSystemPromptV1_5 } from 'apps/ui-tars/src/main/agent/prompts';
import { evaluatePrompt } from '@tarko/context-engineer/node';

const prompt = getSystemPromptV1_5('en', 'normal');
const result = evaluatePrompt(prompt);
```

## Grading Scale

- **9.0-10.0**: Excellent - Prompt is well-crafted and highly effective
- **7.0-8.9**: Good - Prompt is solid with minor improvements possible
- **5.0-6.9**: Fair - Prompt has room for significant improvement
- **Below 5.0**: Needs Improvement - Prompt requires substantial refinement

## Best Practices

1. **Use UPE during prompt development** to catch issues early
2. **Iteratively improve** prompts based on recommendations
3. **Pay attention to triggered pathways** - they highlight specific issues
4. **Balance all 7 categories** for well-rounded prompts
5. **Test with real-world examples** from your use case
6. **Review weaknesses carefully** - they often reveal critical gaps

## Examples

### Example 1: Well-Structured Prompt

```typescript
const prompt = `You are a data analyst expert.

## Task
Analyze the provided dataset and identify patterns.

## Output Format
- Summary of findings
- List of identified patterns
- Recommendations

## Constraints
- Use only verified data
- Cite sources for all claims
- Focus on actionable insights`;

const result = evaluatePrompt(prompt);
// Expected: High scores in Clarity and Structure
```

### Example 2: Tool-Integrated Prompt

```typescript
const prompt = `You are a GUI agent with access to browser tools.

Use browser_get_markdown to extract content.
Use browser_vision_control for visual interactions.

Handle errors gracefully and provide fallback strategies.`;

const result = evaluatePrompt(prompt);
// Expected: High Tool Integration score
```

## Technical Details

### Location
- **Package**: `@tarko/context-engineer`
- **Module**: `src/node/prompt-evaluator.ts`
- **Tests**: `tests/prompt-evaluator.test.ts`

### Dependencies
- No external dependencies beyond TypeScript
- Fully self-contained evaluation logic

### Performance
- Fast evaluation (~ms for typical prompts)
- No external API calls
- Stateless evaluation (thread-safe)

## Future Enhancements

Planned improvements for UPE include:

1. **LLM-powered evaluation** for deeper semantic analysis
2. **Custom criteria sets** for domain-specific evaluation
3. **Prompt templates** with pre-validated patterns
4. **Version comparison** to track prompt evolution
5. **A/B testing framework** for prompt variants
6. **UI integration** for visual prompt editing and evaluation

## Contributing

To add new evaluation criteria or pathways:

1. Add criteria to `QUALITY_CRITERIA` array
2. Implement evaluation logic in `evaluateSingleCriterion`
3. Add corresponding tests
4. Update documentation

For new prompting techniques:

1. Add to `PROMPT_TECHNIQUES` array
2. Implement detection in `identifyTechniques`
3. Add test cases

## License

Copyright (c) 2025 Bytedance, Inc. and its affiliates.
SPDX-License-Identifier: Apache-2.0
