import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createAiSdk } from './sdk.js';

const ORPAYNTER_API_BASE = process.env.ORPAYNTER_API_BASE || '';
const ORPAYNTER_TOKEN = process.env.ORPAYNTER_TOKEN || '';

const AnalyzeRoofImageSchema = z.object({
  base64Image: z.string().describe('Base64-encoded roof image'),
  address: z.string().optional().describe('Optional property address'),
});

const MaterialEstimateSchema = z.object({
  severityScore: z.number().min(0).max(1).describe('Severity score from 0-1'),
  roofAreaSqFt: z
    .number()
    .optional()
    .describe('Optional roof area in square feet'),
});

export function createServer() {
  const server = new Server(
    {
      name: 'orpaynter-ai',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const sdk = createAiSdk({
    baseUrl: ORPAYNTER_API_BASE,
    token: ORPAYNTER_TOKEN,
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'analyzeRoofImage',
        description:
          'Analyze a roof image and return severity score and damage types',
        inputSchema: {
          type: 'object',
          properties: {
            base64Image: {
              type: 'string',
              description: 'Base64-encoded roof image',
            },
            address: {
              type: 'string',
              description: 'Optional property address',
            },
          },
          required: ['base64Image'],
        },
      },
      {
        name: 'materialEstimate',
        description:
          'Estimate material quantities based on severity score and optional roof area',
        inputSchema: {
          type: 'object',
          properties: {
            severityScore: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Severity score from 0-1',
            },
            roofAreaSqFt: {
              type: 'number',
              description: 'Optional roof area in square feet',
            },
          },
          required: ['severityScore'],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'analyzeRoofImage': {
          const input = AnalyzeRoofImageSchema.parse(args);
          const result = await sdk.analyzeRoofImage(input);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'materialEstimate': {
          const input = MaterialEstimateSchema.parse(args);
          const result = await sdk.materialEstimate(input);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export async function runServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
