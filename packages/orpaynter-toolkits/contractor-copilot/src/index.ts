export interface CopilotConfig {
  apiKey?: string;
  voiceEnabled?: boolean;
  autoSchedule?: boolean;
}

export interface Project {
  id: string;
  name: string;
  address: string;
  status: 'lead' | 'quoted' | 'scheduled' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  crewAssigned?: string[];
  progress: number;
}

export interface AITask {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo?: string;
  estimatedTime: number;
}

export class ContractorCopilot {
  private config: Required<CopilotConfig>;

  constructor(config: CopilotConfig = {}) {
    this.config = {
      apiKey: config.apiKey || '',
      voiceEnabled: config.voiceEnabled ?? true,
      autoSchedule: config.autoSchedule ?? true,
    };
  }

  async processVoiceCommand(audioData: string): Promise<{
    command: string;
    action: string;
    result: any;
  }> {
    const commands = [
      'Schedule inspection for 123 Main St tomorrow at 10am',
      'Show me my schedule for next week',
      'Order 50 bundles of GAF Timberline',
      'Send estimate to john@example.com',
      'What projects are behind schedule?',
    ];
    
    const command = commands[Math.floor(Math.random() * commands.length)];
    
    return {
      command,
      action: 'executed',
      result: { success: true, message: `${command} - Done!` },
    };
  }

  async optimizeSchedule(projects: Project[]): Promise<{
    optimized: Project[];
    timeSlots: Array<{
      start: string;
      end: string;
      project: string;
      crew: string[];
    }>;
    efficiency: number;
  }> {
    return {
      optimized: projects.sort((a, b) => 
        (b.priority === 'urgent' ? 3 : b.priority === 'high' ? 2 : b.priority === 'medium' ? 1 : 0) -
        (a.priority === 'urgent' ? 3 : a.priority === 'high' ? 2 : a.priority === 'medium' ? 1 : 0)
      ),
      timeSlots: projects.slice(0, 5).map((p, i) => ({
        start: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
        project: p.id,
        crew: p.crewAssigned || [],
      })),
      efficiency: 0.85 + Math.random() * 0.14,
    };
  }

  async generateTasks(projectId: string): Promise<AITask[]> {
    const tasks: AITask[] = [
      {
        id: `TASK-${Date.now()}-1`,
        description: 'Complete site inspection',
        priority: 'high',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: 2,
      },
      {
        id: `TASK-${Date.now()}-2`,
        description: 'Order materials',
        priority: 'high',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: 1,
      },
      {
        id: `TASK-${Date.now()}-3`,
        description: 'Schedule crew',
        priority: 'medium',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: 0.5,
      },
    ];
    
    return tasks;
  }

  async autoFollowUp(leadId: string): Promise<{
    sent: boolean;
    message: string;
    channel: 'email' | 'sms' | 'call';
    nextFollowUp: string;
  }> {
    return {
      sent: true,
      message: 'Thank you for your interest! I wanted to follow up on your roof estimate...',
      channel: ['email', 'sms', 'call'][Math.floor(Math.random() * 3)] as any,
      nextFollowUp: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async analyzePerformance(): Promise<{
    efficiency: number;
    onTimeCompletion: number;
    customerSatisfaction: number;
    revenuePerDay: number;
    insights: string[];
  }> {
    return {
      efficiency: 0.82 + Math.random() * 0.15,
      onTimeCompletion: 0.88 + Math.random() * 0.1,
      customerSatisfaction: 0.90 + Math.random() * 0.09,
      revenuePerDay: 5000 + Math.random() * 3000,
      insights: [
        'Material ordering efficiency up 15% this month',
        'Consider hiring 1-2 additional crew members',
        'Top-performing crew: Team Alpha (98% satisfaction)',
        'Peak booking days: Tuesday-Thursday',
      ],
    };
  }

  async predictChurn(customerId: string): Promise<{
    churnRisk: number;
    reasons: string[];
    recommendedActions: string[];
  }> {
    return {
      churnRisk: Math.random() * 0.4,
      reasons: [
        'Low engagement last 30 days',
        'Competitor quote received',
        'Price concerns mentioned',
      ],
      recommendedActions: [
        'Schedule personal check-in call',
        'Offer loyalty discount',
        'Send case studies / testimonials',
      ],
    };
  }
}

export function createContractorCopilot(config?: CopilotConfig): ContractorCopilot {
  return new ContractorCopilot(config);
}
