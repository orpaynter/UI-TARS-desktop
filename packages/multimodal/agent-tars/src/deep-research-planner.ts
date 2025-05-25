/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ConsoleLogger,
  Event,
  EventStream,
  EventType,
  PlanStartEvent,
  PlanUpdateEvent,
  PlanFinishEvent,
  PlanStep,
} from '@multimodal/mcp-agent';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration options for the DeepResearchPlanner
 */
export interface DeepResearchPlannerOptions {
  /**
   * Logger instance
   */
  logger: ConsoleLogger;

  /**
   * Event stream for publishing plan events
   */
  eventStream: EventStream;

  /**
   * LLM client for generating and updating plans
   */
  getLLMClient: () => OpenAI;

  /**
   * Model to use for plan generation and updates
   */
  model: string;
}

/**
 * Plan generation request structure with task description
 */
interface PlanGenerationRequest {
  /**
   * The overall task or research question to be addressed
   */
  task: string;

  /**
   * The session ID for tracking
   */
  sessionId: string;
}

/**
 * Plan update request structure with events and session context
 */
interface PlanUpdateRequest {
  /**
   * Current events in the event stream
   */
  events: Event[];

  /**
   * Current plan state
   */
  currentPlan: {
    title: string;
    description: string;
    steps: PlanStep[];
  };

  /**
   * The session ID for tracking
   */
  sessionId: string;
}

/**
 * DeepResearchPlanner - Manages plan generation, tracking, and updates
 *
 * This component is responsible for creating structured research plans,
 * tracking their progress, and updating them as tasks are completed.
 * It works independently from the main agent loop but influences decision-making
 * through the event stream.
 */
export class DeepResearchPlanner {
  private logger: ConsoleLogger;
  private eventStream: EventStream;
  private getLLMClient: () => OpenAI;
  private model: string;
  private currentPlan: {
    title: string;
    description: string;
    steps: PlanStep[];
  } | null = null;

  constructor(options: DeepResearchPlannerOptions) {
    this.logger = options.logger.spawn('DeepResearchPlanner');
    this.eventStream = options.eventStream;
    this.getLLMClient = options.getLLMClient;
    this.model = options.model;
  }

  /**
   * Initialize the planning process by sending a plan start event
   *
   * @param sessionId - Current session identifier
   */
  public initializePlanning(sessionId: string): void {
    this.logger.info(`Initializing planning process for session: ${sessionId}`);

    // Create and send the plan start event
    const planStartEvent: PlanStartEvent = this.eventStream.createEvent(EventType.PLAN_START, {
      sessionId,
    });

    this.eventStream.sendEvent(planStartEvent);
    this.logger.info('Plan start event sent to event stream');
  }

  /**
   * Generate an initial plan based on the user's task
   *
   * @param request - Plan generation request with task details
   * @returns A promise that resolves when the plan has been generated and sent
   */
  public async generatePlan(request: PlanGenerationRequest): Promise<void> {
    const { task, sessionId } = request;

    this.logger.info(`Generating initial plan for task: "${task.substring(0, 50)}..."`);

    try {
      // Use structured outputs to generate a well-formed plan
      const response = await this.getLLMClient().chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a planning expert who excels at creating structured research and execution plans. 
Your task is to create a detailed plan for the following task. 
The plan should include logical steps that help accomplish the task thoroughly and efficiently.
Format your response as a structured JSON object with the following properties:
- title: A concise title for the plan
- description: A brief overview of the plan's approach
- steps: An array of steps, each with:
  - id: A unique identifier (string)
  - title: A short, action-oriented title
  - description: Detailed description of what needs to be done
  - status: Always "pending" for initial plan
  - subSteps: Optional array of sub-steps with the same structure (can be empty)`,
          },
          {
            role: 'user',
            content: `Create a detailed research and execution plan for this task: ${task}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      // Parse the response and create the plan
      const planContent = response.choices[0]?.message?.content || '{}';
      const planData = JSON.parse(planContent);

      // Validate and sanitize the plan data
      const validatedPlan = this.validatePlanStructure(planData);
      this.currentPlan = validatedPlan;

      // Create and send the plan update event
      const planUpdateEvent: PlanUpdateEvent = this.eventStream.createEvent(EventType.PLAN_UPDATE, {
        sessionId,
        plan: validatedPlan,
      });

      this.eventStream.sendEvent(planUpdateEvent);
      this.logger.info(`Initial plan generated with ${validatedPlan.steps.length} main steps`);
    } catch (error) {
      this.logger.error(`Failed to generate plan: ${error}`);

      // Create a basic fallback plan if generation fails
      const fallbackPlan = this.createFallbackPlan(task);
      this.currentPlan = fallbackPlan;

      // Send the fallback plan
      const planUpdateEvent: PlanUpdateEvent = this.eventStream.createEvent(EventType.PLAN_UPDATE, {
        sessionId,
        plan: fallbackPlan,
      });

      this.eventStream.sendEvent(planUpdateEvent);
      this.logger.info('Fallback plan generated due to error');
    }
  }

  /**
   * Update the existing plan based on new events and progress
   *
   * @param request - Plan update request with event context
   * @returns A promise that resolves when the plan has been updated and sent
   */
  public async updatePlan(request: PlanUpdateRequest): Promise<void> {
    const { events, currentPlan, sessionId } = request;

    // Skip if no current plan
    if (!currentPlan) {
      this.logger.warn('Cannot update plan: No current plan exists');
      return;
    }

    this.logger.info('Updating plan based on recent events');

    try {
      // Extract relevant events for context
      const relevantEvents = this.extractRelevantEvents(events);

      // Create a simplified version of the events for the LLM prompt
      const eventsContext = this.formatEventsForContext(relevantEvents);

      // Format the current plan for the LLM prompt
      const planContext = JSON.stringify(currentPlan, null, 2);

      // Use the LLM to update the plan
      const response = await this.getLLMClient().chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a planning expert who updates research plans based on execution progress.
Review the current plan and recent events, then provide an updated plan that reflects the current state.
Mark steps as "completed" if they've been accomplished, "in_progress" if partially done, 
"failed" if unsuccessful, or "pending" if not started.
Return the complete updated plan as a JSON object with the same structure as the current plan.`,
          },
          {
            role: 'user',
            content: `Current plan: ${planContext}\n\nRecent events: ${eventsContext}\n\nUpdate the plan to reflect the current progress. Return the complete updated plan as a JSON object.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      // Parse the response and update the plan
      const updatedPlanContent = response.choices[0]?.message?.content || '{}';
      const updatedPlanData = JSON.parse(updatedPlanContent);

      // Validate the updated plan
      const validatedPlan = this.validatePlanStructure(updatedPlanData);

      // Check if all steps are completed
      const allStepsCompleted = this.checkAllStepsCompleted(validatedPlan.steps);

      // Update the current plan
      this.currentPlan = validatedPlan;

      // Send plan update event
      const planUpdateEvent: PlanUpdateEvent = this.eventStream.createEvent(EventType.PLAN_UPDATE, {
        sessionId,
        plan: validatedPlan,
      });

      this.eventStream.sendEvent(planUpdateEvent);
      this.logger.info(`Plan updated with current progress`);

      // If all steps are completed, send plan finish event
      if (allStepsCompleted) {
        this.finalizePlan(sessionId);
      }
    } catch (error) {
      this.logger.error(`Failed to update plan: ${error}`);

      // Keep the current plan unchanged
      if (this.currentPlan) {
        const planUpdateEvent: PlanUpdateEvent = this.eventStream.createEvent(
          EventType.PLAN_UPDATE,
          {
            sessionId,
            plan: this.currentPlan,
          },
        );

        this.eventStream.sendEvent(planUpdateEvent);
        this.logger.info('Re-sent current plan due to update error');
      }
    }
  }

  /**
   * Generate a comprehensive research report based on completed plan and events
   *
   * @param sessionId - Current session identifier
   * @param events - All events from the session
   * @returns A promise resolving to the generated report text
   */
  public async generateResearchReport(sessionId: string, events: Event[]): Promise<string> {
    this.logger.info('Generating comprehensive research report');

    try {
      // Extract key insights from events
      const relevantEvents = this.extractRelevantEvents(events);
      const eventsContext = this.formatEventsForContext(relevantEvents, true);

      // Format the current plan for context
      const planContext = this.currentPlan
        ? JSON.stringify(this.currentPlan, null, 2)
        : 'No structured plan available';

      // Generate the research report
      const response = await this.getLLMClient().chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a research expert tasked with creating a comprehensive research report.
Based on the execution plan and collected information, synthesize a detailed report that:
1. Summarizes the research question and approach
2. Presents key findings and insights organized by themes
3. Analyzes the implications of the findings
4. Provides well-reasoned conclusions
5. Suggests next steps or further research directions

Format the report with clear headings, professional language, and proper citations when relevant.`,
          },
          {
            role: 'user',
            content: `Plan: ${planContext}\n\nCollected information and research results: ${eventsContext}\n\nCreate a comprehensive research report based on this information.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const reportContent = response.choices[0]?.message?.content || 'Failed to generate report';
      this.logger.info('Research report generated successfully');

      return reportContent;
    } catch (error) {
      this.logger.error(`Failed to generate research report: ${error}`);
      return `Error generating research report: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Finalize the plan by sending a plan finish event
   *
   * @param sessionId - Current session identifier
   */
  public finalizePlan(sessionId: string): void {
    this.logger.info('Finalizing plan - all steps completed');

    // Generate a brief summary of what was accomplished
    const summary = this.generatePlanSummary();

    // Create and send the plan finish event
    const planFinishEvent: PlanFinishEvent = this.eventStream.createEvent(EventType.PLAN_FINISH, {
      sessionId,
      summary,
    });

    this.eventStream.sendEvent(planFinishEvent);
    this.logger.info('Plan finish event sent to event stream');
  }

  /**
   * Generate a summary of the completed plan
   *
   * @returns A summary string describing what was accomplished
   */
  private generatePlanSummary(): string {
    if (!this.currentPlan) {
      return 'No plan was executed.';
    }

    const { title, steps } = this.currentPlan;
    const completedSteps = steps.filter((step) => step.status === 'completed').length;
    const failedSteps = steps.filter((step) => step.status === 'failed').length;

    return `Plan "${title}" completed with ${completedSteps} successful steps and ${failedSteps} failed steps.`;
  }

  /**
   * Create a fallback plan when plan generation fails
   *
   * @param task - The original task description
   * @returns A basic plan structure
   */
  private createFallbackPlan(task: string): {
    title: string;
    description: string;
    steps: PlanStep[];
  } {
    return {
      title: 'Basic Research Plan',
      description: `Explore and address: ${task}`,
      steps: [
        {
          id: uuidv4(),
          title: 'Information Gathering',
          description: 'Collect relevant information about the topic',
          status: 'pending',
        },
        {
          id: uuidv4(),
          title: 'Analysis',
          description: 'Analyze the collected information',
          status: 'pending',
        },
        {
          id: uuidv4(),
          title: 'Synthesis',
          description: 'Synthesize findings into coherent insights',
          status: 'pending',
        },
        {
          id: uuidv4(),
          title: 'Conclusion',
          description: 'Draw conclusions and finalize results',
          status: 'pending',
        },
      ],
    };
  }

  /**
   * Extract relevant events for plan updating
   *
   * @param events - All events from the session
   * @returns A filtered array of relevant events
   */
  private extractRelevantEvents(events: Event[]): Event[] {
    // Focus on events that show progress and results
    const relevantEventTypes = [
      EventType.ASSISTANT_MESSAGE,
      EventType.TOOL_CALL,
      EventType.TOOL_RESULT,
    ];

    // Get events from the last planning update
    // @ts-expect-error
    const lastPlanUpdateIndex = events.findLastIndex(
      (event: Event) => event.type === EventType.PLAN_UPDATE,
    );
    const startIndex = lastPlanUpdateIndex !== -1 ? lastPlanUpdateIndex + 1 : 0;

    // Filter for relevant events after the last plan update
    return events.slice(startIndex).filter((event) => relevantEventTypes.includes(event.type));
  }

  /**
   * Format events into a condensed text representation for LLM context
   *
   * @param events - Relevant events to format
   * @param detailed - Whether to include more details (for report generation)
   * @returns A formatted string representing the events
   */
  private formatEventsForContext(events: Event[], detailed = false): string {
    if (events.length === 0) {
      return 'No relevant events available.';
    }

    return events
      .map((event) => {
        switch (event.type) {
          case EventType.ASSISTANT_MESSAGE:
            return `Assistant: ${(event as any).content?.substring(0, detailed ? 1000 : 200)}`;

          case EventType.TOOL_CALL:
            return `Tool call: ${(event as any).name} with args: ${JSON.stringify((event as any).arguments)}`;

          case EventType.TOOL_RESULT:
            const content = (event as any).content;
            const contentStr =
              typeof content === 'string'
                ? content?.substring(0, detailed ? 1000 : 200)
                : JSON.stringify(content)?.substring(0, detailed ? 1000 : 200);
            return `Tool result: ${(event as any).name} returned: ${contentStr}`;

          default:
            return '';
        }
      })
      .filter((text) => text !== '')
      .join('\n\n');
  }

  /**
   * Validate and sanitize the plan structure
   *
   * @param planData - The raw plan data from LLM
   * @returns A validated plan structure
   */
  private validatePlanStructure(planData: any): {
    title: string;
    description: string;
    steps: PlanStep[];
  } {
    // Ensure the plan has the required structure
    const title = planData.title || 'Research Plan';
    const description = planData.description || 'Systematic approach to address the task';

    // Validate steps array
    let steps: PlanStep[] = [];
    if (Array.isArray(planData.steps)) {
      steps = planData.steps.map((step: any) => this.validateStep(step));
    }

    // Ensure we have at least one step
    if (steps.length === 0) {
      steps = [
        {
          id: uuidv4(),
          title: 'Research and Analysis',
          description: 'Investigate the topic and analyze findings',
          status: 'pending',
        },
      ];
    }

    return { title, description, steps };
  }

  /**
   * Validate and sanitize a single step
   *
   * @param step - The raw step data
   * @returns A validated step structure
   */
  private validateStep(step: any): PlanStep {
    // Ensure required fields
    const validatedStep: PlanStep = {
      id: step.id || uuidv4(),
      title: step.title || 'Unnamed Step',
      description: step.description || 'No description provided',
      status: this.validateStepStatus(step.status),
    };

    // Validate substeps if present
    if (Array.isArray(step.subSteps) && step.subSteps.length > 0) {
      validatedStep.subSteps = step.subSteps.map((subStep: any) => this.validateStep(subStep));
    }

    return validatedStep;
  }

  /**
   * Validate step status to ensure it's one of the allowed values
   *
   * @param status - The status string to validate
   * @returns A validated status string
   */
  private validateStepStatus(
    status: string,
  ): 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed' {
    const validStatuses = ['pending', 'in_progress', 'completed', 'skipped', 'failed'];
    return validStatuses.includes(status) ? (status as any) : 'pending';
  }

  /**
   * Check if all steps (and substeps) are completed
   *
   * @param steps - The steps to check
   * @returns True if all steps are completed or skipped
   */
  private checkAllStepsCompleted(steps: PlanStep[]): boolean {
    const completedStatuses = ['completed', 'skipped'];

    return steps.every((step) => {
      // Check the step status
      const isStepCompleted = completedStatuses.includes(step.status);

      // If the step has substeps, check them recursively
      if (step.subSteps && step.subSteps.length > 0) {
        return isStepCompleted && this.checkAllStepsCompleted(step.subSteps);
      }

      return isStepCompleted;
    });
  }
}
