import { ofetch } from 'ofetch';

export interface QdrantConfig {
  url: string;
  apiKey?: string;
  timeout?: number;
}

export interface Vector {
  id: string | number;
  vector: number[];
  payload?: Record<string, any>;
}

export interface SearchParams {
  vector: number[];
  limit?: number;
  filter?: Record<string, any>;
  score_threshold?: number;
  with_payload?: boolean;
  with_vector?: boolean;
}

export interface SearchResult {
  id: string | number;
  score: number;
  payload?: Record<string, any>;
  vector?: number[];
}

export interface CollectionInfo {
  name: string;
  vectors_count: number;
  points_count: number;
  segments_count: number;
  status: string;
}

/**
 * Qdrant Vector Database Connector
 *
 * Provides methods to interact with Qdrant for semantic search and vector operations.
 *
 * @example
 * ```typescript
 * const qdrant = new QdrantConnector({
 *   url: 'https://your-cluster.qdrant.io',
 *   apiKey: 'your_api_key'
 * });
 *
 * // Create a collection
 * await qdrant.createCollection('documents', 1536);
 *
 * // Upsert vectors
 * await qdrant.upsert('documents', [
 *   {
 *     id: 1,
 *     vector: [0.1, 0.2, ...],
 *     payload: { text: 'Example document', category: 'tech' }
 *   }
 * ]);
 *
 * // Search
 * const results = await qdrant.search('documents', {
 *   vector: [0.1, 0.2, ...],
 *   limit: 10
 * });
 * ```
 */
export class QdrantConnector {
  private config: Required<QdrantConfig>;
  private http: typeof ofetch;

  constructor(config: QdrantConfig) {
    this.config = {
      url: config.url,
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['api-key'] = this.config.apiKey;
    }

    this.http = ofetch.create({
      baseURL: this.config.url,
      headers,
      timeout: this.config.timeout,
    });
  }

  /**
   * List all collections
   */
  async listCollections(): Promise<string[]> {
    const response = await this.http<{
      result: { collections: Array<{ name: string }> };
    }>('/collections');
    return response.result.collections.map((c) => c.name);
  }

  /**
   * Get collection info
   */
  async getCollection(name: string): Promise<CollectionInfo> {
    const response = await this.http<{ result: any }>(`/collections/${name}`);
    return {
      name,
      vectors_count: response.result.vectors_count || 0,
      points_count: response.result.points_count || 0,
      segments_count: response.result.segments_count || 0,
      status: response.result.status || 'unknown',
    };
  }

  /**
   * Create a new collection
   */
  async createCollection(
    name: string,
    vectorSize: number,
    distance: 'Cosine' | 'Euclid' | 'Dot' = 'Cosine',
  ): Promise<void> {
    await this.http(`/collections/${name}`, {
      method: 'PUT',
      body: {
        vectors: {
          size: vectorSize,
          distance,
        },
      },
    });
  }

  /**
   * Delete a collection
   */
  async deleteCollection(name: string): Promise<void> {
    await this.http(`/collections/${name}`, {
      method: 'DELETE',
    });
  }

  /**
   * Upsert vectors into a collection
   */
  async upsert(collectionName: string, points: Vector[]): Promise<void> {
    await this.http(`/collections/${collectionName}/points`, {
      method: 'PUT',
      body: {
        points: points.map((p) => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload || {},
        })),
      },
    });
  }

  /**
   * Search for similar vectors
   */
  async search(
    collectionName: string,
    params: SearchParams,
  ): Promise<SearchResult[]> {
    const response = await this.http<{ result: any[] }>(
      `/collections/${collectionName}/points/search`,
      {
        method: 'POST',
        body: {
          vector: params.vector,
          limit: params.limit || 10,
          filter: params.filter,
          score_threshold: params.score_threshold,
          with_payload: params.with_payload !== false,
          with_vector: params.with_vector || false,
        },
      },
    );

    return response.result.map((r) => ({
      id: r.id,
      score: r.score,
      payload: r.payload,
      vector: r.vector,
    }));
  }

  /**
   * Get a specific point by ID
   */
  async getPoint(
    collectionName: string,
    id: string | number,
  ): Promise<Vector | null> {
    try {
      const response = await this.http<{ result: any }>(
        `/collections/${collectionName}/points/${id}`,
      );
      return {
        id: response.result.id,
        vector: response.result.vector,
        payload: response.result.payload,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete points from a collection
   */
  async deletePoints(
    collectionName: string,
    ids: Array<string | number>,
  ): Promise<void> {
    await this.http(`/collections/${collectionName}/points/delete`, {
      method: 'POST',
      body: {
        points: ids,
      },
    });
  }

  /**
   * Scroll through all points in a collection
   */
  async scroll(
    collectionName: string,
    options?: {
      limit?: number;
      offset?: string | number;
      with_payload?: boolean;
      with_vector?: boolean;
    },
  ): Promise<{ points: Vector[]; next_offset?: string | number }> {
    const response = await this.http<{ result: any }>(
      `/collections/${collectionName}/points/scroll`,
      {
        method: 'POST',
        body: {
          limit: options?.limit || 100,
          offset: options?.offset,
          with_payload: options?.with_payload !== false,
          with_vector: options?.with_vector || false,
        },
      },
    );

    return {
      points: response.result.points.map((p: any) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
      next_offset: response.result.next_page_offset,
    };
  }

  /**
   * Recommend points similar to positive examples and dissimilar to negative examples
   */
  async recommend(
    collectionName: string,
    positive: Array<string | number>,
    negative: Array<string | number> = [],
    options?: {
      limit?: number;
      filter?: Record<string, any>;
      score_threshold?: number;
    },
  ): Promise<SearchResult[]> {
    const response = await this.http<{ result: any[] }>(
      `/collections/${collectionName}/points/recommend`,
      {
        method: 'POST',
        body: {
          positive,
          negative,
          limit: options?.limit || 10,
          filter: options?.filter,
          score_threshold: options?.score_threshold,
        },
      },
    );

    return response.result.map((r) => ({
      id: r.id,
      score: r.score,
      payload: r.payload,
      vector: r.vector,
    }));
  }

  /**
   * Count points in a collection with optional filter
   */
  async count(
    collectionName: string,
    filter?: Record<string, any>,
  ): Promise<number> {
    const response = await this.http<{ result: { count: number } }>(
      `/collections/${collectionName}/points/count`,
      {
        method: 'POST',
        body: filter ? { filter } : {},
      },
    );

    return response.result.count;
  }

  /**
   * Health check
   */
  async health(): Promise<boolean> {
    try {
      await this.http('/');
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Create a Qdrant connector instance
 */
export function createQdrantConnector(config: QdrantConfig): QdrantConnector {
  return new QdrantConnector(config);
}
