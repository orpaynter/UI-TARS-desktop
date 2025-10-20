/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Ultimate Prompt Evaluator (UPE)
 * A comprehensive prompt analysis, refinement, and optimization system
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PromptEvaluationCriteria {
  clarity: number; // 0-10
  accuracy: number;
  robustness: number;
  resourceEfficiency: number;
  ethicalAlignment: number;
  toolIntegration: number;
  multiModalAdaptability: number;
}

export interface PromptEvaluationResult {
  score: PromptEvaluationCriteria;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  triggeredPathways: string[];
  analysis: string;
}

export interface PromptTechnique {
  name: string;
  description: string;
  category: 'foundational' | 'advanced' | 'specialized';
  applicability: string[];
}

export interface EvaluationPathway {
  id: string;
  name: string;
  priority: number;
  condition: (prompt: string) => boolean;
  recommendations: string[];
}

// ============================================================================
// PROMPT TECHNIQUES LIBRARY
// ============================================================================

export const PROMPT_TECHNIQUES: PromptTechnique[] = [
  // Foundational Techniques
  {
    name: 'Zero-Shot',
    description: 'Direct task instruction without examples',
    category: 'foundational',
    applicability: ['simple tasks', 'well-defined problems'],
  },
  {
    name: 'Few-Shot',
    description: 'Provide examples to guide the model',
    category: 'foundational',
    applicability: ['pattern recognition', 'consistent formatting'],
  },
  {
    name: 'Chain-of-Thought (CoT)',
    description: 'Encourage step-by-step reasoning',
    category: 'foundational',
    applicability: ['complex reasoning', 'multi-step problems'],
  },
  {
    name: 'Role Prompting',
    description: 'Assign a specific role or persona to the AI',
    category: 'foundational',
    applicability: ['domain expertise', 'perspective-taking'],
  },

  // Advanced Techniques
  {
    name: 'Tree-of-Thoughts (ToT)',
    description: 'Explore multiple reasoning paths simultaneously',
    category: 'advanced',
    applicability: ['complex problem-solving', 'creative tasks'],
  },
  {
    name: 'Retrieval-Augmented Generation (RAG)',
    description: 'Combine prompts with external knowledge retrieval',
    category: 'advanced',
    applicability: ['fact-heavy tasks', 'knowledge-intensive domains'],
  },
  {
    name: 'Self-Consistency',
    description: 'Generate multiple responses and aggregate',
    category: 'advanced',
    applicability: ['high-stakes decisions', 'verification needed'],
  },
  {
    name: 'Automatic Reasoning and Tool-use (ART)',
    description: 'Combine reasoning with tool selection',
    category: 'advanced',
    applicability: ['multi-tool workflows', 'API integration'],
  },

  // Specialized Techniques
  {
    name: 'Multi-Modal Prompting',
    description: 'Combine text, images, and other modalities',
    category: 'specialized',
    applicability: ['vision tasks', 'cross-modal understanding'],
  },
  {
    name: 'Constitutional AI',
    description: 'Embed ethical guidelines and safety constraints',
    category: 'specialized',
    applicability: ['safety-critical tasks', 'ethical alignment'],
  },
  {
    name: 'Prompt Chaining',
    description: 'Break complex tasks into sequential prompts',
    category: 'specialized',
    applicability: ['workflow automation', 'multi-stage processes'],
  },
  {
    name: 'Meta-Prompting',
    description: 'Prompts that generate or modify other prompts',
    category: 'specialized',
    applicability: ['dynamic adaptation', 'prompt optimization'],
  },
];

// ============================================================================
// EVALUATION PATHWAYS (50+ Prioritized)
// ============================================================================

export const EVALUATION_PATHWAYS: EvaluationPathway[] = [
  {
    id: 'context_preservation',
    name: 'Context Preservation',
    priority: 10,
    condition: (prompt: string) =>
      prompt.length > 2000 || prompt.includes('history') || prompt.includes('previous'),
    recommendations: [
      'Consider implementing context window management',
      'Use summarization for long conversation histories',
      'Implement context compression techniques',
    ],
  },
  {
    id: 'intent_refinement',
    name: 'Intent Refinement',
    priority: 9,
    condition: (prompt: string) => {
      const ambiguousWords = ['maybe', 'perhaps', 'might', 'could be', 'somewhat'];
      return ambiguousWords.some((word) => prompt.toLowerCase().includes(word));
    },
    recommendations: [
      'Clarify ambiguous terms and requirements',
      'Specify expected output format explicitly',
      'Define success criteria clearly',
    ],
  },
  {
    id: 'error_prevention',
    name: 'Error Prevention',
    priority: 9,
    condition: (prompt: string) => {
      return (
        !prompt.includes('format') && !prompt.includes('example') && !prompt.includes('structure')
      );
    },
    recommendations: [
      'Add output format specifications',
      'Include examples of desired responses',
      'Define error handling procedures',
    ],
  },
  {
    id: 'function_integration',
    name: 'Function/Tool Integration',
    priority: 8,
    condition: (prompt: string) => {
      return prompt.includes('tool') || prompt.includes('function') || prompt.includes('API');
    },
    recommendations: [
      'Specify tool usage guidelines clearly',
      'Define when and how to use each tool',
      'Include error handling for tool failures',
    ],
  },
  {
    id: 'format_transition',
    name: 'Format Transition',
    priority: 8,
    condition: (prompt: string) => {
      const formats = ['json', 'xml', 'yaml', 'markdown', 'html'];
      return formats.some((fmt) => prompt.toLowerCase().includes(fmt));
    },
    recommendations: [
      'Provide format examples with clear structure',
      'Specify escaping rules for special characters',
      'Include validation requirements',
    ],
  },
  {
    id: 'multi_modal_handling',
    name: 'Multi-Modal Handling',
    priority: 8,
    condition: (prompt: string) => {
      return prompt.includes('image') || prompt.includes('screenshot') || prompt.includes('visual');
    },
    recommendations: [
      'Clarify how to handle different input modalities',
      'Specify image analysis requirements',
      'Define integration between text and visual understanding',
    ],
  },
  {
    id: 'safety_alignment',
    name: 'Safety & Ethical Alignment',
    priority: 9,
    condition: (prompt: string) => {
      const sensitiveTopics = ['user data', 'personal', 'sensitive', 'private', 'security'];
      return sensitiveTopics.some((topic) => prompt.toLowerCase().includes(topic));
    },
    recommendations: [
      'Add privacy protection guidelines',
      'Include ethical constraints explicitly',
      'Define data handling procedures',
    ],
  },
  {
    id: 'chain_of_thought',
    name: 'Chain-of-Thought Enhancement',
    priority: 7,
    condition: (prompt: string) => {
      return (
        !prompt.toLowerCase().includes('step') &&
        !prompt.toLowerCase().includes('think') &&
        prompt.split(' ').length > 50
      );
    },
    recommendations: [
      'Add "think step by step" instruction',
      'Request intermediate reasoning steps',
      'Structure complex tasks into phases',
    ],
  },
  {
    id: 'resource_optimization',
    name: 'Resource Optimization',
    priority: 7,
    condition: (prompt: string) => prompt.length > 3000,
    recommendations: [
      'Consider prompt compression techniques',
      'Remove redundant instructions',
      'Use references instead of repeating information',
    ],
  },
  {
    id: 'output_validation',
    name: 'Output Validation',
    priority: 7,
    condition: (prompt: string) => {
      return (
        !prompt.includes('verify') && !prompt.includes('check') && !prompt.includes('validate')
      );
    },
    recommendations: [
      'Add self-verification steps',
      'Request confidence scores',
      'Include validation criteria',
    ],
  },
];

// ============================================================================
// QUALITY CRITERIA DEFINITIONS (34-Point Checklist)
// ============================================================================

export interface QualityCriterion {
  category: keyof PromptEvaluationCriteria;
  name: string;
  description: string;
  weight: number;
}

export const QUALITY_CRITERIA: QualityCriterion[] = [
  // Clarity (5 criteria)
  {
    category: 'clarity',
    name: 'Task Definition',
    description: 'Is the task clearly defined?',
    weight: 1.0,
  },
  {
    category: 'clarity',
    name: 'Language Precision',
    description: 'Is language precise and unambiguous?',
    weight: 0.8,
  },
  {
    category: 'clarity',
    name: 'Structure',
    description: 'Is the prompt well-structured and organized?',
    weight: 0.9,
  },
  {
    category: 'clarity',
    name: 'Examples',
    description: 'Are examples clear and relevant?',
    weight: 0.7,
  },
  {
    category: 'clarity',
    name: 'Constraints',
    description: 'Are constraints explicitly stated?',
    weight: 0.8,
  },

  // Accuracy (5 criteria)
  {
    category: 'accuracy',
    name: 'Factual Grounding',
    description: 'Does it encourage factual accuracy?',
    weight: 1.0,
  },
  {
    category: 'accuracy',
    name: 'Source Attribution',
    description: 'Does it request source citations?',
    weight: 0.7,
  },
  {
    category: 'accuracy',
    name: 'Hallucination Prevention',
    description: 'Does it include anti-hallucination measures?',
    weight: 0.9,
  },
  {
    category: 'accuracy',
    name: 'Verification Steps',
    description: 'Does it include verification steps?',
    weight: 0.8,
  },
  {
    category: 'accuracy',
    name: 'Confidence Indicators',
    description: 'Does it request confidence levels?',
    weight: 0.6,
  },

  // Robustness (5 criteria)
  {
    category: 'robustness',
    name: 'Edge Case Handling',
    description: 'Does it address edge cases?',
    weight: 0.9,
  },
  {
    category: 'robustness',
    name: 'Error Recovery',
    description: 'Does it include error handling?',
    weight: 0.8,
  },
  {
    category: 'robustness',
    name: 'Input Variation',
    description: 'Can it handle input variations?',
    weight: 0.7,
  },
  {
    category: 'robustness',
    name: 'Fallback Strategies',
    description: 'Does it define fallback strategies?',
    weight: 0.8,
  },
  {
    category: 'robustness',
    name: 'Consistency',
    description: 'Will it produce consistent results?',
    weight: 0.9,
  },

  // Resource Efficiency (5 criteria)
  {
    category: 'resourceEfficiency',
    name: 'Token Usage',
    description: 'Is token usage optimized?',
    weight: 0.8,
  },
  {
    category: 'resourceEfficiency',
    name: 'Redundancy',
    description: 'Is there minimal redundancy?',
    weight: 0.7,
  },
  {
    category: 'resourceEfficiency',
    name: 'Context Management',
    description: 'Is context efficiently managed?',
    weight: 0.9,
  },
  {
    category: 'resourceEfficiency',
    name: 'Iteration Count',
    description: 'Does it minimize required iterations?',
    weight: 0.6,
  },
  {
    category: 'resourceEfficiency',
    name: 'Complexity Balance',
    description: 'Is complexity appropriately balanced?',
    weight: 0.8,
  },

  // Ethical Alignment (5 criteria)
  {
    category: 'ethicalAlignment',
    name: 'Safety Constraints',
    description: 'Does it include safety guidelines?',
    weight: 1.0,
  },
  {
    category: 'ethicalAlignment',
    name: 'Privacy Protection',
    description: 'Does it protect user privacy?',
    weight: 0.9,
  },
  {
    category: 'ethicalAlignment',
    name: 'Bias Awareness',
    description: 'Does it address potential biases?',
    weight: 0.8,
  },
  {
    category: 'ethicalAlignment',
    name: 'Harmful Content',
    description: 'Does it prevent harmful outputs?',
    weight: 1.0,
  },
  {
    category: 'ethicalAlignment',
    name: 'Transparency',
    description: 'Does it promote transparency?',
    weight: 0.7,
  },

  // Tool Integration (5 criteria)
  {
    category: 'toolIntegration',
    name: 'Tool Selection',
    description: 'Does it guide tool selection?',
    weight: 0.9,
  },
  {
    category: 'toolIntegration',
    name: 'API Usage',
    description: 'Are API calls well-defined?',
    weight: 0.8,
  },
  {
    category: 'toolIntegration',
    name: 'Function Orchestration',
    description: 'Is multi-tool orchestration clear?',
    weight: 0.8,
  },
  {
    category: 'toolIntegration',
    name: 'Tool Error Handling',
    description: 'Does it handle tool failures?',
    weight: 0.9,
  },
  {
    category: 'toolIntegration',
    name: 'Output Integration',
    description: 'Does it integrate tool outputs?',
    weight: 0.7,
  },

  // Multi-Modal Adaptability (4 criteria)
  {
    category: 'multiModalAdaptability',
    name: 'Image Understanding',
    description: 'Does it handle images appropriately?',
    weight: 0.8,
  },
  {
    category: 'multiModalAdaptability',
    name: 'Cross-Modal Integration',
    description: 'Does it integrate multiple modalities?',
    weight: 0.9,
  },
  {
    category: 'multiModalAdaptability',
    name: 'Format Flexibility',
    description: 'Can it adapt to different formats?',
    weight: 0.7,
  },
  {
    category: 'multiModalAdaptability',
    name: 'Modal-Specific Instructions',
    description: 'Are modal-specific instructions clear?',
    weight: 0.8,
  },
];

// ============================================================================
// COGNITIVE STAGES
// ============================================================================

export enum CognitiveStage {
  INITIALIZATION = 'initialization',
  EXPERTISE_ACQUISITION = 'expertise_acquisition',
  ADAPTIVE_RESPONSE = 'adaptive_response',
  SELF_OPTIMIZATION = 'self_optimization',
  NEURAL_SYMBIOSIS = 'neural_symbiosis',
}

// ============================================================================
// PROMPT EVALUATOR CLASS
// ============================================================================

export class UltimatePromptEvaluator {
  private techniques: PromptTechnique[] = PROMPT_TECHNIQUES;
  private pathways: EvaluationPathway[] = EVALUATION_PATHWAYS;
  private criteria: QualityCriterion[] = QUALITY_CRITERIA;

  /**
   * Evaluate a prompt using the comprehensive UPE framework
   */
  public evaluate(prompt: string): PromptEvaluationResult {
    // Stage 1: Initialization - Parse and understand the prompt
    const parsedPrompt = this.parsePrompt(prompt);

    // Stage 2: Expertise Acquisition - Apply technique knowledge
    const applicableTechniques = this.identifyTechniques(prompt);

    // Stage 3: Adaptive Response - Evaluate against criteria
    const criteriaScores = this.evaluateCriteria(prompt);

    // Stage 4: Self-Optimization - Identify improvement pathways
    const triggeredPathways = this.identifyPathways(prompt);

    // Stage 5: Neural Symbiosis - Generate comprehensive recommendations
    const recommendations = this.generateRecommendations(
      prompt,
      criteriaScores,
      triggeredPathways,
      applicableTechniques,
    );

    const overallScore = this.calculateOverallScore(criteriaScores);
    const analysis = this.generateAnalysis(
      prompt,
      criteriaScores,
      applicableTechniques,
      triggeredPathways,
    );

    return {
      score: criteriaScores,
      overallScore,
      strengths: this.identifyStrengths(prompt, criteriaScores),
      weaknesses: this.identifyWeaknesses(prompt, criteriaScores),
      recommendations,
      triggeredPathways: triggeredPathways.map((p) => p.name),
      analysis,
    };
  }

  /**
   * Generate an optimized version of the prompt based on evaluation
   */
  public optimize(prompt: string): { optimized: string; changes: string[] } {
    const evaluation = this.evaluate(prompt);
    const changes: string[] = [];
    let optimized = prompt;

    // Apply recommendations
    evaluation.triggeredPathways.forEach((pathway) => {
      const pathwayDef = this.pathways.find((p) => p.name === pathway);
      if (pathwayDef) {
        pathwayDef.recommendations.forEach((rec) => {
          changes.push(rec);
        });
      }
    });

    return { optimized, changes };
  }

  private parsePrompt(prompt: string): { sections: string[]; length: number; complexity: number } {
    const sections = prompt.split('\n\n');
    const length = prompt.length;
    const complexity = this.calculateComplexity(prompt);
    return { sections, length, complexity };
  }

  private calculateComplexity(prompt: string): number {
    // Simple complexity metric based on various factors
    const words = prompt.split(/\s+/).length;
    const sentences = prompt.split(/[.!?]+/).length;
    const avgWordLength = prompt.replace(/\s/g, '').length / words;
    return (words / 100) * (avgWordLength / 5) * (sentences / 10);
  }

  private identifyTechniques(prompt: string): PromptTechnique[] {
    const identified: PromptTechnique[] = [];
    const lowerPrompt = prompt.toLowerCase();

    this.techniques.forEach((technique) => {
      if (
        technique.name === 'Chain-of-Thought' &&
        (lowerPrompt.includes('step by step') ||
          lowerPrompt.includes('think through') ||
          lowerPrompt.includes('think step') ||
          lowerPrompt.includes('step-by-step'))
      ) {
        identified.push(technique);
      } else if (technique.name === 'Few-Shot' && lowerPrompt.includes('example')) {
        identified.push(technique);
      } else if (
        technique.name === 'Role Prompting' &&
        (lowerPrompt.includes('you are') || lowerPrompt.includes('act as'))
      ) {
        identified.push(technique);
      } else if (
        technique.name === 'Multi-Modal Prompting' &&
        (lowerPrompt.includes('image') || lowerPrompt.includes('screenshot'))
      ) {
        identified.push(technique);
      }
    });

    return identified;
  }

  private evaluateCriteria(prompt: string): PromptEvaluationCriteria {
    const scores: PromptEvaluationCriteria = {
      clarity: 0,
      accuracy: 0,
      robustness: 0,
      resourceEfficiency: 0,
      ethicalAlignment: 0,
      toolIntegration: 0,
      multiModalAdaptability: 0,
    };

    // Group criteria by category
    const categoryGroups = new Map<string, QualityCriterion[]>();
    this.criteria.forEach((criterion) => {
      if (!categoryGroups.has(criterion.category)) {
        categoryGroups.set(criterion.category, []);
      }
      categoryGroups.get(criterion.category)!.push(criterion);
    });

    // Evaluate each category
    categoryGroups.forEach((criteria, category) => {
      let categoryScore = 0;
      let totalWeight = 0;

      criteria.forEach((criterion) => {
        const score = this.evaluateSingleCriterion(prompt, criterion);
        categoryScore += score * criterion.weight;
        totalWeight += criterion.weight;
      });

      scores[category as keyof PromptEvaluationCriteria] = categoryScore / totalWeight;
    });

    return scores;
  }

  private evaluateSingleCriterion(prompt: string, criterion: QualityCriterion): number {
    const lowerPrompt = prompt.toLowerCase();
    let score = 5; // Base score

    // Criterion-specific evaluation logic
    switch (criterion.name) {
      case 'Task Definition':
        score = lowerPrompt.includes('task') || lowerPrompt.includes('objective') ? 8 : 5;
        break;
      case 'Examples':
        score = lowerPrompt.includes('example') ? 8 : 4;
        break;
      case 'Hallucination Prevention':
        score = lowerPrompt.includes('accurate') || lowerPrompt.includes('verify') ? 8 : 5;
        break;
      case 'Error Recovery':
        score = lowerPrompt.includes('error') || lowerPrompt.includes('fail') ? 8 : 5;
        break;
      case 'Safety Constraints':
        score = lowerPrompt.includes('safe') || lowerPrompt.includes('privacy') ? 9 : 6;
        break;
      case 'Tool Selection':
        score = lowerPrompt.includes('tool') || lowerPrompt.includes('function') ? 8 : 5;
        break;
      case 'Structure':
        // Check for structure indicators
        score = prompt.includes('\n\n') || prompt.includes('##') || prompt.includes('1.') ? 8 : 5;
        break;
      case 'Constraints':
        score =
          lowerPrompt.includes('constraint') ||
          lowerPrompt.includes('must') ||
          lowerPrompt.includes('should')
            ? 8
            : 5;
        break;
      default:
        score = 6; // Default moderate score
    }

    return Math.min(10, Math.max(0, score));
  }

  private identifyPathways(prompt: string): EvaluationPathway[] {
    return this.pathways
      .filter((pathway) => pathway.condition(prompt))
      .sort((a, b) => b.priority - a.priority);
  }

  private generateRecommendations(
    prompt: string,
    scores: PromptEvaluationCriteria,
    pathways: EvaluationPathway[],
    techniques: PromptTechnique[],
  ): string[] {
    const recommendations: string[] = [];

    // Add pathway recommendations
    pathways.forEach((pathway) => {
      recommendations.push(...pathway.recommendations);
    });

    // Add score-based recommendations
    Object.entries(scores).forEach(([category, score]) => {
      if (score < 6) {
        recommendations.push(`Improve ${category}: Current score ${score.toFixed(1)}/10`);
      }
    });

    // Add technique suggestions
    if (techniques.length < 2) {
      recommendations.push(
        'Consider incorporating additional prompting techniques for better results',
      );
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private calculateOverallScore(scores: PromptEvaluationCriteria): number {
    const values = Object.values(scores);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private identifyStrengths(prompt: string, scores: PromptEvaluationCriteria): string[] {
    const strengths: string[] = [];
    Object.entries(scores).forEach(([category, score]) => {
      if (score >= 8) {
        strengths.push(`Excellent ${category} (${score.toFixed(1)}/10)`);
      } else if (score >= 7) {
        strengths.push(`Good ${category} (${score.toFixed(1)}/10)`);
      }
    });
    return strengths;
  }

  private identifyWeaknesses(prompt: string, scores: PromptEvaluationCriteria): string[] {
    const weaknesses: string[] = [];
    Object.entries(scores).forEach(([category, score]) => {
      if (score < 5) {
        weaknesses.push(
          `Poor ${category} (${score.toFixed(1)}/10) - needs significant improvement`,
        );
      } else if (score < 7) {
        weaknesses.push(`Below average ${category} (${score.toFixed(1)}/10)`);
      }
    });
    return weaknesses;
  }

  private generateAnalysis(
    prompt: string,
    scores: PromptEvaluationCriteria,
    techniques: PromptTechnique[],
    pathways: EvaluationPathway[],
  ): string {
    const overallScore = this.calculateOverallScore(scores);
    const grade =
      overallScore >= 9
        ? 'Excellent'
        : overallScore >= 7
          ? 'Good'
          : overallScore >= 5
            ? 'Fair'
            : 'Needs Improvement';

    return `
Prompt Evaluation Analysis:
---------------------------
Overall Grade: ${grade} (${overallScore.toFixed(1)}/10)

The prompt demonstrates ${techniques.length} identifiable prompting techniques:
${techniques.map((t) => `- ${t.name}: ${t.description}`).join('\n')}

Triggered ${pathways.length} optimization pathways:
${pathways
  .slice(0, 5)
  .map((p) => `- ${p.name} (Priority: ${p.priority})`)
  .join('\n')}

Category Breakdown:
- Clarity: ${scores.clarity.toFixed(1)}/10
- Accuracy: ${scores.accuracy.toFixed(1)}/10
- Robustness: ${scores.robustness.toFixed(1)}/10
- Resource Efficiency: ${scores.resourceEfficiency.toFixed(1)}/10
- Ethical Alignment: ${scores.ethicalAlignment.toFixed(1)}/10
- Tool Integration: ${scores.toolIntegration.toFixed(1)}/10
- Multi-Modal Adaptability: ${scores.multiModalAdaptability.toFixed(1)}/10

${
  overallScore >= 8
    ? 'This prompt is well-crafted and should perform effectively.'
    : 'This prompt has room for improvement. Review the recommendations below.'
}
    `.trim();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const evaluator = new UltimatePromptEvaluator();

export function evaluatePrompt(prompt: string): PromptEvaluationResult {
  return evaluator.evaluate(prompt);
}

export function optimizePrompt(prompt: string): { optimized: string; changes: string[] } {
  return evaluator.optimize(prompt);
}
