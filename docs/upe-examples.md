# Ultimate Prompt Evaluator (UPE) - Usage Examples

## Command Line Examples

### Example 1: Evaluate a Simple Prompt

```bash
$ pnpm upe:eval "You are a helpful AI assistant"

╔══════════════════════════════════════════════════════════════╗
║     Ultimate Prompt Evaluator (UPE)                        ║
╚══════════════════════════════════════════════════════════════╝

📝 Evaluating Prompt...

📊 EVALUATION SCORES

  Overall Score:
    🟠 ██████░░░░ 5.6/10

  Category Breakdown:
    Clarity:                  🟠 █████░░░░░ 5.0/10
    Accuracy:                 🟠 ██████░░░░ 5.8/10
    Robustness:               🟠 ██████░░░░ 5.8/10
    Resource Efficiency:      🟠 ██████░░░░ 6.0/10
    Ethical Alignment:        🟠 ██████░░░░ 6.0/10
    Tool Integration:         🟠 ██████░░░░ 5.8/10
    Multi-Modal Adaptability: 🟠 ██████░░░░ 6.0/10

💡 RECOMMENDATIONS

  1. Add output format specifications
  2. Include examples of desired responses
  3. Define error handling procedures
  ...
```

### Example 2: Get Optimization Suggestions

```bash
$ pnpm upe:optimize "Write a summary"

╔══════════════════════════════════════════════════════════════╗
║     Ultimate Prompt Evaluator (UPE)                        ║
╚══════════════════════════════════════════════════════════════╝

🔧 Generating Optimization Suggestions...

💡 SUGGESTED CHANGES

  1. Add output format specifications
  2. Include examples of desired responses
  3. Define error handling procedures
  4. Add self-verification steps
  5. Request confidence scores
  6. Include validation criteria
```

### Example 3: Evaluate from File

```bash
$ pnpm upe:eval --file apps/ui-tars/src/main/agent/prompts.ts

# Shows comprehensive evaluation of the GUI agent system prompt
```

## TypeScript/JavaScript Examples

### Example 1: Basic Evaluation

```typescript
import { evaluatePrompt } from '@tarko/context-engineer/node';

const myPrompt = `
You are an expert data analyst.

## Task
Analyze the provided dataset and identify patterns.

## Output Format
- Summary of findings (max 200 words)
- List of top 3 patterns found
- Recommendations for next steps

## Constraints
- Use only verified data
- Cite sources for all claims
- Focus on actionable insights
`;

const result = evaluatePrompt(myPrompt);

console.log(`Overall Score: ${result.overallScore.toFixed(1)}/10`);
console.log(`Grade: ${result.overallScore >= 8 ? 'Excellent' : 'Needs Improvement'}`);

// Output:
// Overall Score: 7.2/10
// Grade: Good

console.log('\nStrengths:');
result.strengths.forEach(s => console.log(`  ✓ ${s}`));
// Output:
// ✓ Excellent clarity (8.1/10)
// ✓ Good structure (7.5/10)

console.log('\nRecommendations:');
result.recommendations.slice(0, 3).forEach(r => console.log(`  → ${r}`));
// Output:
// → Add verification steps
// → Include error handling procedures
// → Consider adding examples
```

### Example 2: Check for Specific Criteria

```typescript
import { evaluatePrompt } from '@tarko/context-engineer/node';

const prompt = "Create a comprehensive report on Q4 sales";
const result = evaluatePrompt(prompt);

// Check if prompt meets minimum quality standards
if (result.score.clarity < 6) {
  console.log('⚠️ Warning: Prompt clarity is below acceptable threshold');
  console.log('Suggestions:', result.recommendations.filter(r => 
    r.toLowerCase().includes('clarity') || r.toLowerCase().includes('structure')
  ));
}

// Check for safety and ethical alignment
if (result.score.ethicalAlignment < 7) {
  console.log('⚠️ Warning: Consider adding safety guidelines');
}

// Check for tool integration readiness
if (result.triggeredPathways.includes('Function/Tool Integration')) {
  console.log('💡 Tip: Add specific tool usage guidelines');
}
```

### Example 3: Optimization Workflow

```typescript
import { evaluatePrompt, optimizePrompt } from '@tarko/context-engineer/node';

function improvePrompt(originalPrompt: string): string {
  console.log('📝 Original Prompt:');
  console.log(originalPrompt);
  
  const evaluation = evaluatePrompt(originalPrompt);
  console.log(`\n📊 Current Score: ${evaluation.overallScore.toFixed(1)}/10`);
  
  if (evaluation.overallScore >= 8) {
    console.log('✅ Prompt is already high quality!');
    return originalPrompt;
  }
  
  const { changes } = optimizePrompt(originalPrompt);
  console.log('\n💡 Suggested Improvements:');
  changes.forEach((change, idx) => {
    console.log(`  ${idx + 1}. ${change}`);
  });
  
  console.log('\n🔧 Apply these changes to improve your prompt!');
  return originalPrompt; // In production, apply changes programmatically
}

improvePrompt("Summarize the document");
```

### Example 4: Batch Evaluation

```typescript
import { evaluatePrompt } from '@tarko/context-engineer/node';

const prompts = [
  'You are a helpful assistant',
  'You are an expert programmer. Think step by step and provide accurate, well-tested code.',
  'Analyze this image and describe what you see',
];

console.log('📊 Batch Evaluation Results\n');

const results = prompts.map((prompt, idx) => {
  const result = evaluatePrompt(prompt);
  return {
    index: idx + 1,
    prompt: prompt.substring(0, 40) + '...',
    score: result.overallScore,
    strengths: result.strengths.length,
    weaknesses: result.weaknesses.length,
  };
});

// Sort by score (descending)
results.sort((a, b) => b.score - a.score);

results.forEach(r => {
  const emoji = r.score >= 8 ? '🟢' : r.score >= 6 ? '🟡' : '🔴';
  console.log(`${emoji} Prompt ${r.index}: ${r.score.toFixed(1)}/10`);
  console.log(`   "${r.prompt}"`);
  console.log(`   Strengths: ${r.strengths}, Weaknesses: ${r.weaknesses}\n`);
});
```

### Example 5: Integration with Agent System

```typescript
import { evaluatePrompt } from '@tarko/context-engineer/node';
import { getSystemPromptV1_5 } from 'apps/ui-tars/src/main/agent/prompts';

// Evaluate the current system prompt
const currentPrompt = getSystemPromptV1_5('en', 'normal');
const evaluation = evaluatePrompt(currentPrompt);

console.log('🤖 Agent System Prompt Evaluation');
console.log(`Overall Score: ${evaluation.overallScore.toFixed(1)}/10`);

// Check specific criteria important for GUI agents
const importantCriteria = [
  { name: 'Tool Integration', score: evaluation.score.toolIntegration },
  { name: 'Multi-Modal', score: evaluation.score.multiModalAdaptability },
  { name: 'Robustness', score: evaluation.score.robustness },
];

console.log('\n📋 GUI Agent Specific Scores:');
importantCriteria.forEach(c => {
  const status = c.score >= 7 ? '✅' : '⚠️';
  console.log(`${status} ${c.name}: ${c.score.toFixed(1)}/10`);
});

// Log improvement suggestions
if (evaluation.recommendations.length > 0) {
  console.log('\n💡 Improvement Opportunities:');
  evaluation.recommendations.slice(0, 5).forEach((rec, idx) => {
    console.log(`${idx + 1}. ${rec}`);
  });
}
```

## Real-World Use Cases

### Use Case 1: Prompt Quality Gate in CI/CD

```typescript
import { evaluatePrompt } from '@tarko/context-engineer/node';
import { readFileSync } from 'fs';

// Read system prompts from files
const systemPrompts = [
  'prompts/system.txt',
  'prompts/agent.txt',
  'prompts/browser.txt',
];

let allPass = true;
const MIN_SCORE = 7.0;

systemPrompts.forEach(file => {
  const prompt = readFileSync(file, 'utf-8');
  const result = evaluatePrompt(prompt);
  
  const passed = result.overallScore >= MIN_SCORE;
  allPass = allPass && passed;
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${file}: ${result.overallScore.toFixed(1)}/10`);
  
  if (!passed) {
    console.log('  Issues:');
    result.weaknesses.forEach(w => console.log(`    - ${w}`));
  }
});

if (!allPass) {
  console.error('\n❌ Quality gate failed! Fix prompts before merging.');
  process.exit(1);
}

console.log('\n✅ All prompts meet quality standards!');
```

### Use Case 2: Interactive Prompt Builder

```typescript
import { evaluatePrompt } from '@tarko/context-engineer/node';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function buildPrompt() {
  let prompt = '';
  
  console.log('🏗️ Interactive Prompt Builder\n');
  console.log('Build your prompt section by section:\n');
  
  rl.question('1. Define the role: ', (role) => {
    prompt += `You are ${role}.\n\n`;
    
    rl.question('2. Describe the task: ', (task) => {
      prompt += `## Task\n${task}\n\n`;
      
      rl.question('3. Specify output format: ', (format) => {
        prompt += `## Output Format\n${format}\n`;
        
        console.log('\n📊 Evaluating your prompt...\n');
        const result = evaluatePrompt(prompt);
        
        console.log('Final Prompt:');
        console.log('─'.repeat(60));
        console.log(prompt);
        console.log('─'.repeat(60));
        console.log(`\nScore: ${result.overallScore.toFixed(1)}/10`);
        
        if (result.overallScore < 7) {
          console.log('\n💡 Suggestions to improve:');
          result.recommendations.slice(0, 3).forEach(r => 
            console.log(`  - ${r}`)
          );
        } else {
          console.log('\n✅ Great prompt! Ready to use.');
        }
        
        rl.close();
      });
    });
  });
}

buildPrompt();
```

### Use Case 3: Prompt Version Comparison

```typescript
import { evaluatePrompt } from '@tarko/context-engineer/node';

const v1 = "You are a helpful assistant. Answer questions.";
const v2 = `You are an expert assistant.

Think step by step before answering.
Provide accurate, well-reasoned responses.
If uncertain, ask for clarification.`;

console.log('📊 Comparing Prompt Versions\n');

const r1 = evaluatePrompt(v1);
const r2 = evaluatePrompt(v2);

console.log(`Version 1: ${r1.overallScore.toFixed(1)}/10`);
console.log(`Version 2: ${r2.overallScore.toFixed(1)}/10`);

const improvement = ((r2.overallScore - r1.overallScore) / r1.overallScore * 100);
console.log(`\nImprovement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`);

console.log('\nCategory Improvements:');
Object.keys(r1.score).forEach(category => {
  const diff = r2.score[category as keyof typeof r2.score] - 
               r1.score[category as keyof typeof r1.score];
  if (Math.abs(diff) >= 0.5) {
    const arrow = diff > 0 ? '📈' : '📉';
    console.log(`  ${arrow} ${category}: ${diff > 0 ? '+' : ''}${diff.toFixed(1)}`);
  }
});
```

## Best Practices

1. **Always evaluate before deploying**: Run UPE on all system prompts before production
2. **Use in development**: Integrate into your IDE or development workflow
3. **Track improvements**: Compare versions to see what changes help
4. **Set quality gates**: Require minimum scores for critical prompts
5. **Review recommendations**: UPE provides actionable suggestions - use them!

## License

Copyright (c) 2025 Bytedance, Inc. and its affiliates.  
SPDX-License-Identifier: Apache-2.0
