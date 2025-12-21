import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createClaimsSdk } from './sdk.js';

const ORPAYNTER_API_BASE = process.env.ORPAYNTER_API_BASE || '';
const ORPAYNTER_TOKEN = process.env.ORPAYNTER_TOKEN || '';

const CreateClaimSchema = z.object({
  projectId: z.string().describe('Project identifier'),
  policyNumber: z.string().describe('Insurance policy number'),
  lossDate: z.string().describe('Date of loss (ISO 8601 format)'),
  description: z.string().optional().describe('Optional claim description'),
});

const GetClaimStatusSchema = z.object({
  claimId: z.string().describe('Claim identifier'),
});

const ExportPacketSchema = z.object({
  claimId: z.string().describe('Claim identifier'),
  format: z.enum(['pdf', 'zip']).describe('Export format'),
});

export function createServer() {
  const server = new Server(
    {
      name: 'orpaynter-claims',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const sdk = createClaimsSdk({
    baseUrl: ORPAYNTER_API_BASE,
    token: ORPAYNTER_TOKEN,
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'createClaim',
        description: 'Create a new insurance claim for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project identifier' },
            policyNumber: {
              type: 'string',
              description: 'Insurance policy number',
            },
            lossDate: {
              type: 'string',
              description: 'Date of loss (ISO 8601 format)',
            },
            description: {
              type: 'string',
              description: 'Optional claim description',
            },
          },
          required: ['projectId', 'policyNumber', 'lossDate'],
        },
      },
      {
        name: 'getClaimStatus',
        description: 'Get current status of an insurance claim',
        inputSchema: {
          type: 'object',
          properties: {
            claimId: { type: 'string', description: 'Claim identifier' },
          },
          required: ['claimId'],
        },
      },
      {
        name: 'exportPacket',
        description: 'Export a claim packet as PDF or ZIP',
        inputSchema: {
          type: 'object',
          properties: {
            claimId: { type: 'string', description: 'Claim identifier' },
            format: {
              type: 'string',
              enum: ['pdf', 'zip'],
              description: 'Export format',
            },
          },
          required: ['claimId', 'format'],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'createClaim': {
          const input = CreateClaimSchema.parse(args);
          const result = await sdk.createClaim(input);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'getClaimStatus': {
          const input = GetClaimStatusSchema.parse(args);
          const result = await sdk.getClaimStatus(input.claimId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'exportPacket': {
          const input = ExportPacketSchema.parse(args);
          const result = await sdk.exportPacket(input.claimId, input.format);
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
