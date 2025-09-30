#!/usr/bin/env node
/**
 * OrPaynter Claims MCP Server
 * Handles insurance claims processing, damage detection, and cost estimation
 */

import { z } from 'zod';
import { ofetch } from 'ofetch';

const ORPAYNTER_API_BASE = process.env.ORPAYNTER_API_BASE || '';
const ORPAYNTER_TOKEN = process.env.ORPAYNTER_TOKEN || '';

// Schema definitions
const ClaimSchema = z.object({
  id: z.string(),
  property_address: z.string(),
  damage_type: z.enum(['roof', 'siding', 'windows', 'foundation', 'other']),
  severity: z.enum(['minor', 'moderate', 'severe', 'total']),
  estimated_cost: z.number(),
  photos: z.array(z.string()),
  status: z.enum(['pending', 'approved', 'denied', 'processing']),
  created_at: z.string(),
  updated_at: z.string()
});

const DamageAssessmentSchema = z.object({
  damage_score: z.number().min(0).max(100),
  damage_areas: z.array(z.object({
    type: z.string(),
    severity: z.number().min(0).max(10),
    area_sqft: z.number(),
    repair_cost: z.number()
  })),
  total_estimated_cost: z.number(),
  recommended_actions: z.array(z.string())
});

// Mock data for demo mode
const mockClaims = [
  {
    id: "CLAIM-001",
    property_address: "123 Main St, Hometown, TX 75001",
    damage_type: "roof",
    severity: "moderate",
    estimated_cost: 8500,
    photos: ["roof_damage_1.jpg", "roof_damage_2.jpg"],
    status: "processing",
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T14:30:00Z"
  }
];

// MCP Server Implementation
class OrPaynterClaimsServer {
  async createClaim(propertyAddress: string, damageType: string, photos: string[]) {
    if (!ORPAYNTER_API_BASE) {
      // Demo mode - return mock data
      const newClaim = {
        id: `CLAIM-${Date.now()}`,
        property_address: propertyAddress,
        damage_type: damageType,
        severity: "moderate",
        estimated_cost: Math.floor(Math.random() * 15000) + 5000,
        photos,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return { success: true, claim: newClaim };
    }

    try {
      const response = await ofetch(`${ORPAYNTER_API_BASE}/api/claims`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ORPAYNTER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: {
          property_address: propertyAddress,
          damage_type: damageType,
          photos
        }
      });
      return { success: true, claim: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async assessDamage(photoUrls: string[]) {
    if (!ORPAYNTER_API_BASE) {
      // Demo mode - return mock assessment
      const mockAssessment = {
        damage_score: Math.floor(Math.random() * 40) + 30, // 30-70% damage
        damage_areas: [
          {
            type: "shingles",
            severity: 6,
            area_sqft: 250,
            repair_cost: 3500
          },
          {
            type: "gutters",
            severity: 4,
            area_sqft: 100,
            repair_cost: 1200
          }
        ],
        total_estimated_cost: Math.floor(Math.random() * 10000) + 5000,
        recommended_actions: [
          "Replace damaged shingles",
          "Repair gutter system",
          "Inspect for water damage",
          "Schedule professional inspection"
        ]
      };
      return { success: true, assessment: mockAssessment };
    }

    try {
      const response = await ofetch(`${ORPAYNTER_API_BASE}/api/ai/assess-damage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ORPAYNTER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: { photos: photoUrls }
      });
      return { success: true, assessment: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getClaims() {
    if (!ORPAYNTER_API_BASE) {
      return { success: true, claims: mockClaims };
    }

    try {
      const response = await ofetch(`${ORPAYNTER_API_BASE}/api/claims`, {
        headers: {
          'Authorization': `Bearer ${ORPAYNTER_TOKEN}`
        }
      });
      return { success: true, claims: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async updateClaimStatus(claimId: string, status: string) {
    if (!ORPAYNTER_API_BASE) {
      // Demo mode - return success
      return { success: true, message: `Claim ${claimId} status updated to ${status}` };
    }

    try {
      const response = await ofetch(`${ORPAYNTER_API_BASE}/api/claims/${claimId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${ORPAYNTER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: { status }
      });
      return { success: true, claim: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

// MCP Server startup
async function main() {
  const server = new OrPaynterClaimsServer();
  
  console.log('OrPaynter Claims MCP Server starting...');
  console.log(`Demo Mode: ${!ORPAYNTER_API_BASE ? 'enabled' : 'disabled'}`);
  
  // Export the server for MCP framework integration
  // This would typically integrate with @agent-infra/mcp-shared
  process.on('SIGINT', () => {
    console.log('OrPaynter Claims MCP Server shutting down...');
    process.exit(0);
  });

  // Keep the process alive
  setInterval(() => {}, 1000);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { OrPaynterClaimsServer, ClaimSchema, DamageAssessmentSchema };