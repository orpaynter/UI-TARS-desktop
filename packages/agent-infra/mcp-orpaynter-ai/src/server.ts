/**
 * OrPaynter AI MCP Server Implementation
 * Provides AI-powered roof analysis and damage assessment
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ofetch } from 'ofetch';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

const ORPAYNTER_API_BASE = process.env.ORPAYNTER_API_BASE || '';
const ORPAYNTER_TOKEN = process.env.ORPAYNTER_TOKEN || '';

// Mock AI responses
const createMockAnalysisResponse = (photos: string[], analysisType: string) => {
  const damageTypes = [
    'hail_damage',
    'wind_damage',
    'impact_damage',
    'wear_and_tear',
  ];
  const materials = ['asphalt_shingle', 'metal', 'tile', 'slate'];

  return {
    analysisId: `ANALYSIS-${Date.now()}`,
    analysisType,
    confidence: Math.floor(Math.random() * 30) + 70,
    photosAnalyzed: photos.length,
    findings: {
      damageDetected: Math.random() > 0.3,
      damageType: damageTypes[Math.floor(Math.random() * damageTypes.length)],
      materialType: materials[Math.floor(Math.random() * materials.length)],
      damagePercentage: Math.floor(Math.random() * 40) + 10,
      affectedAreas: ['Front-facing slope', 'Gutters', 'Ridge line'].slice(
        0,
        Math.floor(Math.random() * 3) + 1,
      ),
    },
    costEstimate: {
      low: Math.floor(Math.random() * 5000) + 2000,
      high: Math.floor(Math.random() * 10000) + 8000,
      recommended: Math.floor(Math.random() * 7000) + 5000,
    },
    recommendations: [
      'Schedule professional inspection',
      'Document all damage with photos',
      'Contact insurance provider',
      'Obtain multiple contractor quotes',
    ],
    processingTime: `${Math.floor(Math.random() * 30) + 15}s`,
  };
};

const createMockAssessmentResponse = (address: string, photos: string[]) => ({
  assessmentId: `ASSESS-${Date.now()}`,
  propertyAddress: address,
  overallCondition:
    Math.random() > 0.6 ? 'good' : Math.random() > 0.3 ? 'fair' : 'poor',
  roofScore: Math.floor(Math.random() * 40) + 60,
  detailedFindings: {
    structuralIntegrity: Math.floor(Math.random() * 30) + 70,
    weatherResistance: Math.floor(Math.random() * 30) + 70,
    materialCondition: Math.floor(Math.random() * 30) + 70,
    ventilationAdequacy: Math.floor(Math.random() * 30) + 70,
  },
  estimatedLifeRemaining: `${Math.floor(Math.random() * 15) + 5} years`,
  maintenanceRecommendations: [
    'Clean gutters quarterly',
    'Inspect flashing annually',
    'Trim overhanging branches',
    'Check for loose or missing shingles',
  ],
  photosProcessed: photos.length,
  generatedAt: new Date().toISOString(),
});

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'orpaynter-ai',
    version: '0.1.0',
  });

  // Analyze roof photos tool
  server.tool(
    'analyze_roof_photos',
    'Analyze roof photos using AI for damage detection and assessment',
    {
      photos: z
        .array(z.string())
        .describe('Array of base64 encoded photo data'),
      analysisType: z
        .enum(['damage_detection', 'material_assessment', 'cost_estimation'])
        .default('damage_detection'),
    },
    async (args): Promise<CallToolResult> => {
      try {
        if (ORPAYNTER_API_BASE && ORPAYNTER_TOKEN) {
          // Real API call
          const response = await ofetch(
            `${ORPAYNTER_API_BASE}/api/ai/analyze`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${ORPAYNTER_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: args,
            },
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        } else {
          // Demo mode with mock response
          const mockResponse = createMockAnalysisResponse(
            args.photos,
            args.analysisType,
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(mockResponse, null, 2),
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Generate roof assessment tool
  server.tool(
    'generate_roof_assessment',
    'Generate comprehensive roof assessment report',
    {
      propertyAddress: z.string(),
      photos: z.array(z.string()),
      propertyDetails: z
        .object({
          squareFootage: z.number().optional(),
          roofType: z.string().optional(),
          roofAge: z.number().optional(),
          stories: z.number().optional(),
        })
        .optional(),
    },
    async (args): Promise<CallToolResult> => {
      try {
        if (ORPAYNTER_API_BASE && ORPAYNTER_TOKEN) {
          // Real API call
          const response = await ofetch(
            `${ORPAYNTER_API_BASE}/api/ai/assessment`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${ORPAYNTER_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: args,
            },
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        } else {
          // Demo mode with mock response
          const mockResponse = createMockAssessmentResponse(
            args.propertyAddress,
            args.photos,
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(mockResponse, null, 2),
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Generate damage report tool
  server.tool(
    'generate_damage_report',
    'Generate detailed damage report for insurance claims',
    {
      claimId: z.string().describe('Claim identifier'),
      includeImages: z.boolean().default(true),
    },
    async (args): Promise<CallToolResult> => {
      try {
        const mockReport = {
          reportId: `REPORT-${Date.now()}`,
          claimId: args.claimId,
          generatedAt: new Date().toISOString(),
          summary: {
            totalDamageArea: Math.floor(Math.random() * 500) + 100,
            estimatedCost: Math.floor(Math.random() * 15000) + 5000,
            severity: Math.random() > 0.5 ? 'moderate' : 'severe',
            recommendedAction: 'Immediate repair required',
          },
          detailedFindings: [
            'Multiple missing shingles detected on south-facing slope',
            'Granule loss evident across 40% of roof surface',
            'Flashing damage around chimney area',
            'Gutter displacement on east side',
          ],
          photosIncluded: args.includeImages,
          downloadUrl: 'https://orpaynter.com/reports/mock-report.pdf',
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mockReport, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Get repair recommendations tool
  server.tool(
    'get_repair_recommendations',
    'Get AI-powered repair recommendations and contractor matching',
    {
      damageType: z.string().describe('Type of damage detected'),
      location: z
        .string()
        .describe('Property location for contractor matching'),
      urgency: z.enum(['low', 'medium', 'high', 'emergency']).default('medium'),
    },
    async (args): Promise<CallToolResult> => {
      try {
        const mockRecommendations = {
          recommendationId: `REC-${Date.now()}`,
          damageType: args.damageType,
          location: args.location,
          urgency: args.urgency,
          repairSteps: [
            'Emergency tarp installation if needed',
            'Professional damage assessment',
            'Material ordering and scheduling',
            'Repair execution and cleanup',
          ],
          estimatedTimeline: '5-10 business days',
          matchedContractors: [
            {
              name: 'Premium Roofing Solutions',
              rating: 4.8,
              distance: '2.3 miles',
              specialties: ['storm damage', 'insurance work'],
              available: true,
            },
            {
              name: 'Metro Roof Repair',
              rating: 4.6,
              distance: '4.1 miles',
              specialties: ['residential repair', 'emergency service'],
              available: true,
            },
          ],
          materialRecommendations: [
            'GAF Timberline HD shingles',
            'Ice & water shield underlayment',
            'Galvanized flashing',
          ],
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mockRecommendations, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  return server;
}
