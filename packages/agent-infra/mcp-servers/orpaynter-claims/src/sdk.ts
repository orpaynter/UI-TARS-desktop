import { ofetch } from 'ofetch';

export type SdkOpts = { baseUrl: string; token?: string };

export interface CreateClaimInput {
  projectId: string;
  policyNumber: string;
  lossDate: string;
  description?: string;
}

export interface ClaimResponse {
  id: string;
  status: string;
  projectId: string;
  policyNumber: string;
  lossDate: string;
  createdAt?: string;
}

export interface ClaimStatusResponse {
  id: string;
  status: string;
  updatedAt?: string;
  notes?: string;
}

export interface ExportResponse {
  url: string;
  format: string;
  expiresAt?: string;
}

export function createClaimsSdk({ baseUrl, token }: SdkOpts) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (token) headers['authorization'] = `Bearer ${token}`;

  const http = ofetch.create({ baseURL: baseUrl, headers });

  return {
    async createClaim(input: CreateClaimInput): Promise<ClaimResponse> {
      // Mock fallback for demo mode
      if (!baseUrl) {
        return {
          id: `clm_mock_${Date.now()}`,
          status: 'created',
          ...input,
          createdAt: new Date().toISOString(),
        };
      }
      return http('/claims', { method: 'POST', body: input });
    },

    async getClaimStatus(claimId: string): Promise<ClaimStatusResponse> {
      if (!baseUrl) {
        return {
          id: claimId,
          status: 'pending_review',
          updatedAt: new Date().toISOString(),
          notes: 'Mock status (no API base configured)',
        };
      }
      return http(`/claims/${claimId}`);
    },

    async exportPacket(
      claimId: string,
      format: 'pdf' | 'zip',
    ): Promise<ExportResponse> {
      if (!baseUrl) {
        return {
          url: `https://example.com/mock/${claimId}.${format}`,
          format,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
      }
      return http(`/claims/${claimId}/export?format=${format}`);
    },
  };
}
