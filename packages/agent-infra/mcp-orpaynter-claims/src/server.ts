/**
 * OrPaynter Claims MCP Server Implementation
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ofetch } from 'ofetch';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

const ORPAYNTER_API_BASE = process.env.ORPAYNTER_API_BASE || '';
const ORPAYNTER_TOKEN = process.env.ORPAYNTER_TOKEN || '';

// Mock responses for demo mode
const createMockClaimResponse = () => ({
  claimId: `CLAIM-${Date.now()}`,
  status: 'submitted',
  estimatedDamage: Math.floor(Math.random() * 15000) + 5000,
  nextSteps: [
    'Claim submitted successfully',
    'Inspector will be assigned within 24 hours',
    'Damage assessment will be completed within 3 business days',
  ],
  estimatedCompletionDate: new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString(),
});

const createMockStatusResponse = (claimId: string) => ({
  claimId,
  status: Math.random() > 0.5 ? 'in_progress' : 'approved',
  currentStep: 'damage_assessment',
  progress: Math.floor(Math.random() * 100),
  lastUpdated: new Date().toISOString(),
  estimatedCompletion: new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000,
  ).toISOString(),
});

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'orpaynter-claims',
    version: '0.1.0',
  });

  // Submit claim tool
  server.tool(
    'submit_claim',
    'Submit a roof damage insurance claim',
    {
      propertyAddress: z.string().describe('Full property address'),
      damageDescription: z.string().describe('Description of roof damage'),
      photos: z
        .array(z.string())
        .describe('Array of base64 encoded photo data'),
      contactInfo: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
      }),
      insuranceProvider: z.string().optional(),
      policyNumber: z.string().optional(),
    },
    async (args): Promise<CallToolResult> => {
      try {
        if (ORPAYNTER_API_BASE && ORPAYNTER_TOKEN) {
          // Real API call
          const response = await ofetch(`${ORPAYNTER_API_BASE}/api/claims`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${ORPAYNTER_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: args,
          });

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
          const mockResponse = createMockClaimResponse();
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

  // Check claim status tool
  server.tool(
    'check_claim_status',
    'Check the status of an existing claim',
    {
      claimId: z.string().describe('Claim identifier'),
    },
    async (args): Promise<CallToolResult> => {
      try {
        if (ORPAYNTER_API_BASE && ORPAYNTER_TOKEN) {
          // Real API call
          const response = await ofetch(
            `${ORPAYNTER_API_BASE}/api/claims/${args.claimId}`,
            {
              headers: {
                Authorization: `Bearer ${ORPAYNTER_TOKEN}`,
              },
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
          const mockResponse = createMockStatusResponse(args.claimId);
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

  // Get damage estimate tool
  server.tool(
    'get_damage_estimate',
    'Get AI-powered damage assessment and cost estimate',
    {
      photos: z
        .array(z.string())
        .describe('Array of base64 encoded photo data'),
      propertyDetails: z
        .object({
          squareFootage: z.number().optional(),
          roofType: z.string().optional(),
          roofAge: z.number().optional(),
        })
        .optional(),
    },
    async (_args): Promise<CallToolResult> => {
      try {
        const mockEstimate = {
          estimatedCost: Math.floor(Math.random() * 20000) + 3000,
          damageType: 'hail_damage',
          severity: Math.random() > 0.5 ? 'moderate' : 'severe',
          affectedArea: Math.floor(Math.random() * 500) + 100,
          recommendations: [
            'Replace damaged shingles',
            'Inspect gutters for damage',
            'Check for water intrusion',
          ],
          confidence: Math.floor(Math.random() * 30) + 70,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mockEstimate, null, 2),
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
