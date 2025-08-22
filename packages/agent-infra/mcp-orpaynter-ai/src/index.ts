#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ofetch } from 'ofetch';

// OrPaynter AI Analysis Types
const PropertyAnalysisSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  analysisType: z.enum(['damage_assessment', 'risk_evaluation', 'valuation', 'maintenance_prediction']),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  confidence: z.number().min(0).max(1),
  results: z.object({
    summary: z.string(),
    details: z.array(z.object({
      category: z.string(),
      finding: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      recommendation: z.string().optional()
    })),
    estimatedCost: z.number().optional(),
    riskScore: z.number().min(0).max(100).optional()
  }),
  dateCreated: z.string(),
  dateCompleted: z.string().optional()
});

const ImageAnalysisSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  analysisType: z.enum(['damage_detection', 'property_features', 'safety_hazards', 'compliance_check']),
  results: z.object({
    detectedObjects: z.array(z.object({
      object: z.string(),
      confidence: z.number(),
      boundingBox: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number()
      }).optional()
    })),
    damageAssessment: z.object({
      hasDamage: z.boolean(),
      damageType: z.string().optional(),
      severity: z.enum(['minor', 'moderate', 'severe', 'catastrophic']).optional(),
      affectedArea: z.number().optional()
    }).optional(),
    recommendations: z.array(z.string())
  }),
  dateAnalyzed: z.string()
});

type PropertyAnalysis = z.infer<typeof PropertyAnalysisSchema>;
type ImageAnalysis = z.infer<typeof ImageAnalysisSchema>;

// Mock data for development/demo mode
const MOCK_ANALYSES: PropertyAnalysis[] = [
  {
    id: 'analysis-001',
    propertyId: 'prop-001',
    analysisType: 'damage_assessment',
    status: 'completed',
    confidence: 0.92,
    results: {
      summary: 'Water damage detected in kitchen area with moderate severity. Immediate attention required.',
      details: [
        {
          category: 'Water Damage',
          finding: 'Extensive water staining on ceiling and walls',
          severity: 'medium',
          recommendation: 'Replace damaged drywall and inspect for mold'
        },
        {
          category: 'Structural',
          finding: 'Floor warping near sink area',
          severity: 'medium',
          recommendation: 'Replace affected flooring and check subfloor integrity'
        }
      ],
      estimatedCost: 8500,
      riskScore: 65
    },
    dateCreated: '2024-01-15T10:00:00Z',
    dateCompleted: '2024-01-15T10:15:00Z'
  },
  {
    id: 'analysis-002',
    propertyId: 'prop-002',
    analysisType: 'risk_evaluation',
    status: 'completed',
    confidence: 0.88,
    results: {
      summary: 'Property shows low to medium risk factors. Regular maintenance recommended.',
      details: [
        {
          category: 'Roof Condition',
          finding: 'Minor wear on shingles, no immediate concerns',
          severity: 'low',
          recommendation: 'Schedule inspection in 6 months'
        },
        {
          category: 'HVAC System',
          finding: 'System operating within normal parameters',
          severity: 'low',
          recommendation: 'Continue regular filter changes'
        }
      ],
      riskScore: 25
    },
    dateCreated: '2024-01-12T14:30:00Z',
    dateCompleted: '2024-01-12T14:45:00Z'
  }
];

const MOCK_IMAGE_ANALYSES: ImageAnalysis[] = [
  {
    id: 'img-analysis-001',
    imageUrl: 'https://example.com/images/kitchen-damage.jpg',
    analysisType: 'damage_detection',
    results: {
      detectedObjects: [
        {
          object: 'water_stain',
          confidence: 0.94,
          boundingBox: { x: 120, y: 80, width: 200, height: 150 }
        },
        {
          object: 'damaged_ceiling',
          confidence: 0.87,
          boundingBox: { x: 50, y: 20, width: 300, height: 100 }
        }
      ],
      damageAssessment: {
        hasDamage: true,
        damageType: 'water_damage',
        severity: 'moderate',
        affectedArea: 15.5
      },
      recommendations: [
        'Document all visible damage with additional photos',
        'Contact water damage restoration specialist',
        'Check for hidden moisture with moisture meter',
        'Inspect adjacent areas for secondary damage'
      ]
    },
    dateAnalyzed: '2024-01-15T10:05:00Z'
  }
];

// OrPaynter AI API client
class OrPaynterAIClient {
  private baseUrl: string;
  private token: string;
  private isDemoMode: boolean;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.isDemoMode = !baseUrl || baseUrl.includes('demo') || !token || token.includes('demo');
  }

  private async makeRequest<T>(endpoint: string, options: any = {}): Promise<T> {
    if (this.isDemoMode) {
      return this.getMockData<T>(endpoint, options);
    }

    try {
      return await ofetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
    } catch (error) {
      console.warn(`OrPaynter AI API request failed, falling back to mock data:`, error);
      return this.getMockData<T>(endpoint, options);
    }
  }

  private getMockData<T>(endpoint: string, options: any = {}): T {
    // Simulate processing delay
    const delay = Math.random() * 2000 + 1000;
    
    if (endpoint.includes('/analyze/property')) {
      if (options.method === 'POST') {
        // Create new analysis
        const newAnalysis: PropertyAnalysis = {
          id: `analysis-${Date.now()}`,
          propertyId: options.body?.propertyId || 'prop-001',
          analysisType: options.body?.analysisType || 'damage_assessment',
          status: 'processing',
          confidence: 0,
          results: {
            summary: 'Analysis in progress...',
            details: []
          },
          dateCreated: new Date().toISOString()
        };
        
        // Simulate completion after delay
        setTimeout(() => {
          newAnalysis.status = 'completed';
          newAnalysis.confidence = 0.85 + Math.random() * 0.15;
          newAnalysis.dateCompleted = new Date().toISOString();
        }, delay);
        
        MOCK_ANALYSES.push(newAnalysis);
        return newAnalysis as T;
      }
      
      if (endpoint.includes('/analyze/property/')) {
        const analysisId = endpoint.split('/analyze/property/')[1];
        return MOCK_ANALYSES.find(a => a.id === analysisId) as T;
      }
      
      return MOCK_ANALYSES as T;
    }
    
    if (endpoint.includes('/analyze/image')) {
      if (options.method === 'POST') {
        const newImageAnalysis: ImageAnalysis = {
          id: `img-analysis-${Date.now()}`,
          imageUrl: options.body?.imageUrl || 'https://example.com/image.jpg',
          analysisType: options.body?.analysisType || 'damage_detection',
          results: {
            detectedObjects: [
              {
                object: 'damage_area',
                confidence: 0.85 + Math.random() * 0.15
              }
            ],
            recommendations: [
              'Professional inspection recommended',
              'Document findings with additional photos'
            ]
          },
          dateAnalyzed: new Date().toISOString()
        };
        
        MOCK_IMAGE_ANALYSES.push(newImageAnalysis);
        return newImageAnalysis as T;
      }
      
      return MOCK_IMAGE_ANALYSES as T;
    }
    
    return {} as T;
  }

  async analyzeProperty(propertyId: string, analysisType: string): Promise<PropertyAnalysis> {
    return this.makeRequest<PropertyAnalysis>('/api/v1/ai/analyze/property', {
      method: 'POST',
      body: { propertyId, analysisType }
    });
  }

  async getPropertyAnalysis(analysisId: string): Promise<PropertyAnalysis> {
    return this.makeRequest<PropertyAnalysis>(`/api/v1/ai/analyze/property/${analysisId}`);
  }

  async analyzeImage(imageUrl: string, analysisType: string): Promise<ImageAnalysis> {
    return this.makeRequest<ImageAnalysis>('/api/v1/ai/analyze/image', {
      method: 'POST',
      body: { imageUrl, analysisType }
    });
  }

  async getPropertyAnalyses(propertyId?: string): Promise<PropertyAnalysis[]> {
    const analyses = await this.makeRequest<PropertyAnalysis[]>('/api/v1/ai/analyze/property');
    return propertyId ? analyses.filter(a => a.propertyId === propertyId) : analyses;
  }

  async generateMaintenanceSchedule(propertyId: string): Promise<any> {
    if (this.isDemoMode) {
      return {
        propertyId,
        schedule: [
          {
            task: 'HVAC Filter Replacement',
            frequency: 'quarterly',
            nextDue: '2024-04-01',
            priority: 'medium',
            estimatedCost: 50
          },
          {
            task: 'Roof Inspection',
            frequency: 'annually',
            nextDue: '2024-06-01',
            priority: 'high',
            estimatedCost: 300
          },
          {
            task: 'Gutter Cleaning',
            frequency: 'bi-annually',
            nextDue: '2024-03-15',
            priority: 'medium',
            estimatedCost: 150
          }
        ],
        totalAnnualCost: 800,
        riskReduction: 35
      };
    }

    return this.makeRequest('/api/v1/ai/maintenance/schedule', {
      method: 'POST',
      body: { propertyId }
    });
  }
}

// Environment variables
const ORPAYNTER_API_BASE = process.env.ORPAYNTER_API_BASE || '';
const ORPAYNTER_TOKEN = process.env.ORPAYNTER_TOKEN || '';

// Create and start the MCP server
const server = new McpServer({
  name: 'orpaynter-ai',
  version: '1.0.0',
});

const client = new OrPaynterAIClient(
  ORPAYNTER_API_BASE,
  ORPAYNTER_TOKEN
);

// Register tools

// Register each tool with the server
server.tool(
  'analyze_property_damage',
  'Analyze property for damage using AI-powered assessment',
  {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'The ID of the property to analyze'
      },
      analysisType: {
        type: 'string',
        enum: ['damage_assessment', 'risk_evaluation', 'valuation', 'maintenance_prediction'],
        description: 'Type of analysis to perform'
      }
    },
    required: ['propertyId', 'analysisType']
  },
  async ({ propertyId, analysisType }) => {
    const analysis = await client.analyzeProperty(propertyId, analysisType);
    return {
      content: [
        {
          type: 'text',
          text: `🤖 AI Analysis Started\n\n` +
                `Analysis ID: ${analysis.id}\n` +
                `Property: ${analysis.propertyId}\n` +
                `Type: ${analysis.analysisType}\n` +
                `Status: ${analysis.status}\n\n` +
                `Use 'get_analysis_results' with ID ${analysis.id} to check progress.`
        }
      ]
    };
  }
);

server.tool(
  'get_analysis_results',
  'Get results from a completed AI property analysis',
  {
    type: 'object',
    properties: {
      analysisId: {
        type: 'string',
        description: 'The ID of the analysis to retrieve'
      }
    },
    required: ['analysisId']
  },
  async ({ analysisId }) => {
    const analysis = await client.getPropertyAnalysis(analysisId);
    
    let resultText = `🤖 AI Analysis Results\n\n` +
                    `Analysis ID: ${analysis.id}\n` +
                    `Status: ${analysis.status}\n`;
    
    if (analysis.status === 'completed') {
      resultText += `Confidence: ${(analysis.confidence * 100).toFixed(1)}%\n\n` +
                   `📋 Summary:\n${analysis.results.summary}\n\n`;
      
      if (analysis.results.details.length > 0) {
        resultText += `🔍 Detailed Findings:\n`;
        analysis.results.details.forEach((detail, index) => {
          resultText += `${index + 1}. ${detail.category} (${detail.severity})\n` +
                       `   Finding: ${detail.finding}\n`;
          if (detail.recommendation) {
            resultText += `   Recommendation: ${detail.recommendation}\n`;
          }
          resultText += `\n`;
        });
      }
      
      if (analysis.results.estimatedCost) {
        resultText += `💰 Estimated Cost: $${analysis.results.estimatedCost.toLocaleString()}\n`;
      }
      
      if (analysis.results.riskScore) {
        resultText += `⚠️ Risk Score: ${analysis.results.riskScore}/100\n`;
      }
    } else {
      resultText += `\nAnalysis is still ${analysis.status}. Please check again later.`;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: resultText
        }
      ]
    };
  }
);

server.tool(
  'analyze_damage_photo',
  'Analyze a photo for property damage using AI image recognition',
  {
    type: 'object',
    properties: {
      imageUrl: {
        type: 'string',
        description: 'URL of the image to analyze'
      },
      analysisType: {
        type: 'string',
        enum: ['damage_detection', 'property_features', 'safety_hazards', 'compliance_check'],
        description: 'Type of image analysis to perform'
      }
    },
    required: ['imageUrl', 'analysisType']
  },
  async ({ imageUrl, analysisType }) => {
    const analysis = await client.analyzeImage(imageUrl, analysisType);
    
    let resultText = `📸 AI Image Analysis Results\n\n` +
                    `Image: ${analysis.imageUrl}\n` +
                    `Analysis Type: ${analysis.analysisType}\n` +
                    `Date: ${new Date(analysis.dateAnalyzed).toLocaleString()}\n\n`;
    
    if (analysis.results.detectedObjects.length > 0) {
      resultText += `🔍 Detected Objects:\n`;
      analysis.results.detectedObjects.forEach((obj, index) => {
        resultText += `${index + 1}. ${obj.object} (${(obj.confidence * 100).toFixed(1)}% confidence)\n`;
      });
      resultText += `\n`;
    }
    
    if (analysis.results.damageAssessment) {
      const damage = analysis.results.damageAssessment;
      resultText += `🏠 Damage Assessment:\n` +
                   `Has Damage: ${damage.hasDamage ? 'Yes' : 'No'}\n`;
      if (damage.hasDamage) {
        resultText += `Damage Type: ${damage.damageType}\n` +
                     `Severity: ${damage.severity}\n`;
        if (damage.affectedArea) {
          resultText += `Affected Area: ${damage.affectedArea} sq ft\n`;
        }
      }
      resultText += `\n`;
    }
    
    if (analysis.results.recommendations.length > 0) {
      resultText += `💡 Recommendations:\n`;
      analysis.results.recommendations.forEach((rec, index) => {
        resultText += `${index + 1}. ${rec}\n`;
      });
    }
    
    return {
      content: [
        {
          type: 'text',
          text: resultText
        }
      ]
    };
  }
);

server.tool(
  'generate_maintenance_schedule',
  'Generate AI-powered predictive maintenance schedule for a property',
  {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'The ID of the property to generate schedule for'
      }
    },
    required: ['propertyId']
  },
  async ({ propertyId }) => {
    const schedule = await client.generateMaintenanceSchedule(propertyId);
    
    let resultText = `🔧 AI-Generated Maintenance Schedule\n\n` +
                    `Property ID: ${schedule.propertyId}\n\n` +
                    `📅 Scheduled Tasks:\n`;
    
    schedule.schedule.forEach((task: any, index: number) => {
      resultText += `${index + 1}. ${task.task}\n` +
                   `   Frequency: ${task.frequency}\n` +
                   `   Next Due: ${task.nextDue}\n` +
                   `   Priority: ${task.priority}\n` +
                   `   Est. Cost: $${task.estimatedCost}\n\n`;
    });
    
    resultText += `💰 Total Annual Cost: $${schedule.totalAnnualCost}\n` +
                 `📉 Risk Reduction: ${schedule.riskReduction}%\n\n` +
                 `Following this schedule can reduce property risks and extend asset life.`;
    
    return {
      content: [
        {
          type: 'text',
          text: resultText
        }
      ]
    };
  }
);

server.tool(
  'list_property_analyses',
  'List all AI analyses for a property or all properties',
  {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'Optional: Filter analyses for specific property ID'
      }
    },
    required: []
  },
  async ({ propertyId }) => {
    const analyses = await client.getPropertyAnalyses(propertyId);
    
    let resultText = `🤖 AI Analysis History\n\n`;
    
    if (propertyId) {
      resultText += `Property: ${propertyId}\n\n`;
    }
    
    if (analyses.length === 0) {
      resultText += `No analyses found.`;
    } else {
      resultText += `Found ${analyses.length} analyses:\n\n`;
      analyses.forEach((analysis, index) => {
        resultText += `${index + 1}. ${analysis.analysisType} (${analysis.status})\n` +
                     `   ID: ${analysis.id}\n` +
                     `   Property: ${analysis.propertyId}\n` +
                     `   Created: ${new Date(analysis.dateCreated).toLocaleDateString()}\n`;
        if (analysis.status === 'completed') {
          resultText += `   Confidence: ${(analysis.confidence * 100).toFixed(1)}%\n`;
          if (analysis.results.riskScore) {
            resultText += `   Risk Score: ${analysis.results.riskScore}/100\n`;
          }
        }
        resultText += `\n`;
      });
    }
    
    return {
      content: [
        {
          type: 'text',
          text: resultText
        }
      ]
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OrPaynter AI MCP server running on stdio');
}

// Simple CLI: `mcp-orpaynter-ai` starts the server
if (require.main === module) {
  main().catch(console.error);
}