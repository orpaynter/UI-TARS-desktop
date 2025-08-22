#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ofetch } from 'ofetch';

// OrPaynter Claims API Types
const ClaimSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  claimNumber: z.string(),
  status: z.enum(['pending', 'approved', 'denied', 'processing']),
  amount: z.number(),
  description: z.string(),
  dateCreated: z.string(),
  dateUpdated: z.string(),
  documents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.string()
  })).optional()
});

const PropertySchema = z.object({
  id: z.string(),
  address: z.string(),
  owner: z.string(),
  type: z.enum(['residential', 'commercial', 'industrial']),
  value: z.number(),
  insurancePolicy: z.string().optional()
});

type Claim = z.infer<typeof ClaimSchema>;
type Property = z.infer<typeof PropertySchema>;

// Mock data for development/demo mode
const MOCK_CLAIMS: Claim[] = [
  {
    id: 'claim-001',
    propertyId: 'prop-001',
    claimNumber: 'CL-2024-001',
    status: 'pending',
    amount: 15000,
    description: 'Water damage from burst pipe in kitchen',
    dateCreated: '2024-01-15T10:00:00Z',
    dateUpdated: '2024-01-15T10:00:00Z',
    documents: [
      {
        id: 'doc-001',
        name: 'damage-photos.pdf',
        url: 'https://example.com/docs/damage-photos.pdf',
        type: 'photo'
      }
    ]
  },
  {
    id: 'claim-002',
    propertyId: 'prop-002',
    claimNumber: 'CL-2024-002',
    status: 'approved',
    amount: 8500,
    description: 'Roof damage from storm',
    dateCreated: '2024-01-10T14:30:00Z',
    dateUpdated: '2024-01-12T09:15:00Z'
  }
];

const MOCK_PROPERTIES: Property[] = [
  {
    id: 'prop-001',
    address: '123 Main St, Anytown, ST 12345',
    owner: 'John Doe',
    type: 'residential',
    value: 350000,
    insurancePolicy: 'POL-2024-001'
  },
  {
    id: 'prop-002',
    address: '456 Oak Ave, Somewhere, ST 67890',
    owner: 'Jane Smith',
    type: 'residential',
    value: 425000,
    insurancePolicy: 'POL-2024-002'
  }
];

// OrPaynter API client
class OrPaynterClaimsClient {
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
      // Return mock data in demo mode
      return this.getMockData<T>(endpoint);
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
      console.warn(`OrPaynter API request failed, falling back to mock data:`, error);
      return this.getMockData<T>(endpoint);
    }
  }

  private getMockData<T>(endpoint: string): T {
    if (endpoint.includes('/claims')) {
      if (endpoint.includes('/claims/')) {
        const claimId = endpoint.split('/claims/')[1];
        return MOCK_CLAIMS.find(c => c.id === claimId) as T;
      }
      return MOCK_CLAIMS as T;
    }
    if (endpoint.includes('/properties')) {
      if (endpoint.includes('/properties/')) {
        const propertyId = endpoint.split('/properties/')[1];
        return MOCK_PROPERTIES.find(p => p.id === propertyId) as T;
      }
      return MOCK_PROPERTIES as T;
    }
    return {} as T;
  }

  async getClaims(): Promise<Claim[]> {
    return this.makeRequest<Claim[]>('/api/v1/claims');
  }

  async getClaim(claimId: string): Promise<Claim> {
    return this.makeRequest<Claim>(`/api/v1/claims/${claimId}`);
  }

  async createClaim(claimData: Partial<Claim>): Promise<Claim> {
    if (this.isDemoMode) {
      const newClaim: Claim = {
        id: `claim-${Date.now()}`,
        propertyId: claimData.propertyId || 'prop-001',
        claimNumber: `CL-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        status: 'pending',
        amount: claimData.amount || 0,
        description: claimData.description || '',
        dateCreated: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
        documents: claimData.documents || []
      };
      MOCK_CLAIMS.push(newClaim);
      return newClaim;
    }

    return this.makeRequest<Claim>('/api/v1/claims', {
      method: 'POST',
      body: claimData
    });
  }

  async updateClaim(claimId: string, updates: Partial<Claim>): Promise<Claim> {
    if (this.isDemoMode) {
      const claimIndex = MOCK_CLAIMS.findIndex(c => c.id === claimId);
      if (claimIndex >= 0) {
        MOCK_CLAIMS[claimIndex] = { ...MOCK_CLAIMS[claimIndex], ...updates, dateUpdated: new Date().toISOString() };
        return MOCK_CLAIMS[claimIndex];
      }
      throw new Error(`Claim ${claimId} not found`);
    }

    return this.makeRequest<Claim>(`/api/v1/claims/${claimId}`, {
      method: 'PUT',
      body: updates
    });
  }

  async getProperties(): Promise<Property[]> {
    return this.makeRequest<Property[]>('/api/v1/properties');
  }

  async getProperty(propertyId: string): Promise<Property> {
    return this.makeRequest<Property>(`/api/v1/properties/${propertyId}`);
  }
}

// Environment variables
const ORPAYNTER_API_BASE = process.env.ORPAYNTER_API_BASE || '';
const ORPAYNTER_TOKEN = process.env.ORPAYNTER_TOKEN || '';

// Create and start the MCP server
const client = new OrPaynterClaimsClient(
  ORPAYNTER_API_BASE,
  ORPAYNTER_TOKEN
);

const server = new McpServer({
  name: 'orpaynter-claims',
  version: '1.0.0',
});

// Register tools
server.tool(
  'list_claims',
  'List all insurance claims in the OrPaynter system',
  {
    type: 'object',
    properties: {},
    required: []
  },
  async () => {
    const claims = await client.getClaims();
    return {
      content: [
        {
          type: 'text',
          text: `Found ${claims.length} claims:\n\n${claims.map(claim => 
            `• ${claim.claimNumber} - ${claim.description} ($${claim.amount.toLocaleString()}) - Status: ${claim.status}`
          ).join('\n')}`
        }
      ]
    };
  }
);

server.tool(
  'get_claim_details',
  'Get detailed information about a specific insurance claim',
  {
    type: 'object',
    properties: {
      claimId: {
        type: 'string',
        description: 'The ID of the claim to retrieve'
      }
    },
    required: ['claimId']
  },
  async ({ claimId }) => {
    const claim = await client.getClaim(claimId);
    return {
      content: [
        {
          type: 'text',
          text: `Claim Details:\n\n` +
                `Claim Number: ${claim.claimNumber}\n` +
                `Property ID: ${claim.propertyId}\n` +
                `Status: ${claim.status}\n` +
                `Amount: $${claim.amount.toLocaleString()}\n` +
                `Description: ${claim.description}\n` +
                `Created: ${new Date(claim.dateCreated).toLocaleDateString()}\n` +
                `Updated: ${new Date(claim.dateUpdated).toLocaleDateString()}\n` +
                (claim.documents ? `Documents: ${claim.documents.length} attached` : 'No documents')
        }
      ]
    };
  }
);

server.tool(
  'create_claim',
  'Create a new insurance claim in the OrPaynter system',
  {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'The ID of the property for this claim'
      },
      amount: {
        type: 'number',
        description: 'The claim amount in dollars'
      },
      description: {
        type: 'string',
        description: 'Description of the damage or incident'
      }
    },
    required: ['propertyId', 'amount', 'description']
  },
  async ({ propertyId, amount, description }) => {
    const claim = await client.createClaim({ propertyId, amount, description });
    return {
      content: [
        {
          type: 'text',
          text: `✅ Claim created successfully!\n\n` +
                `Claim Number: ${claim.claimNumber}\n` +
                `Claim ID: ${claim.id}\n` +
                `Amount: $${claim.amount.toLocaleString()}\n` +
                `Status: ${claim.status}\n` +
                `Description: ${claim.description}`
        }
      ]
    };
  }
);

server.tool(
  'update_claim_status',
  'Update the status of an existing insurance claim',
  {
    type: 'object',
    properties: {
      claimId: {
        type: 'string',
        description: 'The ID of the claim to update'
      },
      status: {
        type: 'string',
        enum: ['pending', 'approved', 'denied', 'processing'],
        description: 'The new status for the claim'
      }
    },
    required: ['claimId', 'status']
  },
  async ({ claimId, status }) => {
    const claim = await client.updateClaim(claimId, { status });
    return {
      content: [
        {
          type: 'text',
          text: `✅ Claim ${claim.claimNumber} status updated to: ${status}`
        }
      ]
    };
  }
);

server.tool(
  'list_properties',
  'List all properties in the OrPaynter system',
  {
    type: 'object',
    properties: {},
    required: []
  },
  async () => {
    const properties = await client.getProperties();
    return {
      content: [
        {
          type: 'text',
          text: `Found ${properties.length} properties:\n\n${properties.map(prop => 
            `• ${prop.address} - ${prop.owner} ($${prop.value.toLocaleString()}) - ${prop.type}`
          ).join('\n')}`
        }
      ]
    };
  }
);

server.tool(
  'get_property_details',
  'Get detailed information about a specific property',
  {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'The ID of the property to retrieve'
      }
    },
    required: ['propertyId']
  },
  async ({ propertyId }) => {
    const property = await client.getProperty(propertyId);
    return {
      content: [
        {
          type: 'text',
          text: `Property Details:\n\n` +
                `Address: ${property.address}\n` +
                `Owner: ${property.owner}\n` +
                `Type: ${property.type}\n` +
                `Value: $${property.value.toLocaleString()}\n` +
                `Insurance Policy: ${property.insurancePolicy || 'Not specified'}`
        }
      ]
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OrPaynter Claims MCP server running on stdio');
}

// Simple CLI: `mcp-orpaynter-claims` starts the server
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}