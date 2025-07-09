import { Tool, z } from '@mcp-agent/core';
import { AgentEventStream } from '@mcp-agent/core';
import { BasePlannerStrategy } from './base-strategy';
import { PlannerContext, ToolFilterResult } from '../types';

/**
 * Default planner strategy - uses simplified todo format with markdown input
 * This strategy provides a natural, todo-style planning approach using markdown lists
 */
export class DefaultPlannerStrategy extends BasePlannerStrategy {
  getSystemInstrucution(): string {
    return `
<planning_approach>
For complex tasks that need multiple steps, use structured planning:

1. **Planning Phase**: Create todos using create_todos with markdown format
2. **Execution Phase**: Execute steps and update progress with edit_todos  
3. **Completion**: Mark items complete when finished

Use markdown todo format: "- [ ] Task description" for incomplete, "- [x] Task description" for completed.
</planning_approach>
`;
  }

  createPlanningTools(context: PlannerContext): Tool[] {
    const createTodosTool = new Tool({
      id: 'create_todos',
      description: 'Create a todo list for complex tasks using markdown format.',
      parameters: z.object({
        title: z.string().describe('Brief title of the task'),
        todos: z.string().describe('Markdown todo list with - [ ] for incomplete items'),
        needsPlanning: z.boolean().describe('Whether this task needs systematic planning'),
      }),
      function: async ({ title, todos, needsPlanning }) => {
        if (!needsPlanning) {
          context.state.completed = true;
          context.state.stage = 'execute';
          return { status: 'skipped', message: 'Task is simple, no planning needed' };
        }

        const steps = this.parseMarkdownTodos(todos);
        if (steps.length === 0) {
          return { error: 'Invalid todo format' };
        }

        context.state.steps = steps;
        context.state.stage = 'execute';
        this.sendPlanEvents(context.sessionId, steps, 'start');
        this.sendPlanEvents(context.sessionId, steps, 'update');

        return {
          status: 'success',
          title,
          message: `Created ${steps.length}-item todo list: "${title}"`,
        };
      },
    });

    return [createTodosTool];
  }

  createPlanUpdateTools(context: PlannerContext): Tool[] {
    const editTodosTool = new Tool({
      id: 'edit_todos',
      description:
        'Update todo list progress after completing actual work. Use - [x] for completed items, - [ ] for incomplete. ' +
        '⚠️ CRITICAL: DO NOT call this tool consecutively without doing actual work between calls. ' +
        'IMPORTANT: Only call this tool AFTER you have actually executed the necessary tools and gathered the required information. ' +
        'Do not call this tool if you have not done any actual work.',
      parameters: z.object({
        thought: z
          .string()
          .describe(
            'Your structured thinking following this exact 5-step format: ' +
              '1. WHAT: What task am I completing this time and how does it relate to the original request? ' +
              '2. DUPLICATE CHECK: Am I smart enough to avoid repetition? What task am I completing and am I not repeating previous work? ' +
              '3. WHY: Why do I believe this task is complete? What work did I do and what results did I see? My confidence level is ___ (out of 100) ' +
              '4. REFLECTION: Is my judgment incomplete? Am I being lazy? For example, when researching projects, did I only find 1-2 instead of being thorough? ' +
              '5. NEXT: What should I do next? ' +
              'If you did no actual work, do NOT call this tool.',
          ),
        todos: z.string().describe('Complete updated markdown todo list'),
      }),
      function: async ({ thought, todos }) => {
        if (!context.state.steps?.length) {
          return { error: 'Create todos first using create_todos' };
        }

        const updatedSteps = this.parseMarkdownTodos(todos);
        if (updatedSteps.length === 0) {
          return { error: 'Invalid todo format' };
        }

        context.state.steps = updatedSteps;
        const isComplete = updatedSteps.every((step) => step.done);

        if (isComplete) {
          context.state.completed = true;
          this.sendPlanEvents(context.sessionId, updatedSteps, 'finish');
          return {
            status: 'completed',
            thought,
          };
        } else {
          this.sendPlanEvents(context.sessionId, updatedSteps, 'update');
          return {
            status: 'updated',
            thought,
          };
        }
      },
    });

    return [editTodosTool];
  }

  /**
   * Parse markdown todo format into plan steps
   * Supports both - [ ] and - [x] formats
   */
  private parseMarkdownTodos(todos: string): AgentEventStream.PlanStep[] {
    const lines = todos.split('\n').filter((line) => line.trim());
    const steps: AgentEventStream.PlanStep[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Match markdown todo format: - [ ] or - [x]
      const incompleteMatch = trimmed.match(/^-\s*\[\s*\]\s*(.+)$/);
      const completedMatch = trimmed.match(/^-\s*\[x\]\s*(.+)$/i);

      if (incompleteMatch) {
        steps.push({
          content: incompleteMatch[1].trim(),
          done: false,
        });
      } else if (completedMatch) {
        steps.push({
          content: completedMatch[1].trim(),
          done: true,
        });
      }
      // Ignore lines that don't match the expected format
    }

    return steps;
  }

  filterToolsForStage(context: PlannerContext): ToolFilterResult {
    const { state } = context;

    if (state.completed) {
      return {
        tools: context.availableTools,
        systemPromptAddition: 'Planning completed. Use all tools to provide final answer.',
      };
    }

    const createPlanningTools = this.createPlanningTools(context);
    const updatePlanningTools = this.createPlanUpdateTools(context);

    switch (state.stage) {
      case 'plan':
        const planningTools = state.steps.length === 0 ? createPlanningTools : updatePlanningTools;
        return {
          tools: planningTools,
          systemPromptAddition: this.formatCurrentPlanForPrompt(state.steps),
        };

      case 'execute':
        return {
          tools: [...context.availableTools, ...updatePlanningTools],
          systemPromptAddition: this.formatCurrentPlanForPrompt(state.steps),
        };

      default:
        return { tools: context.availableTools };
    }
  }

  isPlanningCompleted(steps: AgentEventStream.PlanStep[]): boolean {
    return steps.length > 0 && steps.every((step) => step.done);
  }

  private formatCurrentPlanForPrompt(steps: AgentEventStream.PlanStep[]): string {
    if (steps.length === 0) {
      return 'For complex tasks, create todos using create_todos.';
    }

    const stepsList = steps
      .map((step) => `- [${step.done ? 'x' : ' '}] ${step.content}`)
      .join('\n');

    const completedCount = steps.filter((s) => s.done).length;

    return `
<current_todos>
${stepsList}

Progress: ${completedCount}/${steps.length} completed

IMPORTANT REMINDERS:
- Only call edit_todos AFTER you have done actual work (executed tools, gathered information)
- ⚠️ DO NOT call edit_todos consecutively without doing actual work between calls
- If you haven't done any real work yet, continue working instead of updating the todos
- In the thought parameter, follow the structured 5-step thinking format:
  1. WHAT: What task am I completing this time and how does it relate to the original request?
  2. DUPLICATE CHECK: Am I smart enough to avoid repetition? What task am I completing and am I not repeating previous work?
  3. WHY: Why do I believe this task is complete? What work did I do and what results did I see? My confidence level is ___ (out of 100)
  4. REFLECTION: Is my judgment incomplete? Am I being lazy? For example, when researching projects, did I only find 1-2 instead of being thorough?
  5. NEXT: What should I do next?
- Be specific about tools you called and information you gathered
</current_todos>`;
  }
}
