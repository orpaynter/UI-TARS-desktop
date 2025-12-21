import { ofetch } from 'ofetch';

export type SdkOpts = { baseUrl: string; token?: string };

export interface RoofAnalysisInput {
  base64Image: string;
  address?: string;
}

export interface DamageType {
  type: string;
  confidence: number;
}

export interface RoofAnalysisResponse {
  severityScore: number;
  damageTypes: DamageType[];
  notes: string;
}

export interface MaterialEstimateInput {
  severityScore: number;
  roofAreaSqFt?: number;
}

export interface MaterialEstimateResponse {
  bundles: number;
  underlaymentRolls: number;
  nailsBoxes: number;
  notes: string;
}

export function createAiSdk({ baseUrl, token }: SdkOpts) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (token) headers['authorization'] = `Bearer ${token}`;

  const http = ofetch.create({ baseURL: baseUrl, headers });

  return {
    async analyzeRoofImage(
      input: RoofAnalysisInput,
    ): Promise<RoofAnalysisResponse> {
      if (!baseUrl) {
        // Mock analysis for demo mode
        return {
          severityScore: 0.72,
          damageTypes: [
            { type: 'hail', confidence: 0.81 },
            { type: 'wind', confidence: 0.59 },
          ],
          notes: 'Mock analysis (no API base configured)',
        };
      }
      return http('/ai/roof/analyze', { method: 'POST', body: input });
    },

    async materialEstimate(
      input: MaterialEstimateInput,
    ): Promise<MaterialEstimateResponse> {
      if (!baseUrl) {
        const { severityScore, roofAreaSqFt = 2000 } = input;
        const bundles = Math.round(30 + 70 * severityScore);
        return {
          bundles,
          underlaymentRolls: Math.max(1, Math.round(bundles / 10)),
          nailsBoxes: Math.max(1, Math.round(bundles / 8)),
          notes: `Mock estimate for ~${roofAreaSqFt}sqft roof (no API base configured)`,
        };
      }
      return http('/ai/roof/materials', { method: 'POST', body: input });
    },
  };
}
