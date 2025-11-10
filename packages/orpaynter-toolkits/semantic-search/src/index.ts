/**
 * Semantic Search Toolkit for OrPaynter
 * 
 * AI-powered semantic search for roofing documents, inspections, and reports.
 * Uses Qdrant for vector storage and Hugging Face for embeddings.
 */

import { createQdrantConnector, type QdrantConnector } from '@orpaynter/connector-qdrant';
import { createHuggingFaceConnector, type HuggingFaceConnector } from '@orpaynter/connector-huggingface';

export interface SemanticSearchConfig {
  qdrant: {
    url: string;
    apiKey?: string;
  };
  huggingface: {
    apiKey: string;
  };
  collectionName?: string;
  embeddingModel?: string;
  embeddingDimensions?: number;
}

export interface Document {
  id: number | string;
  text: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: number | string;
  score: number;
  text: string;
  metadata?: Record<string, any>;
}

export interface SearchOptions {
  limit?: number;
  scoreThreshold?: number;
  filter?: Record<string, any>;
}

export interface SemanticSearch {
  // Collection Management
  initializeCollection(): Promise<void>;
  deleteCollection(): Promise<void>;
  getCollectionInfo(): Promise<any>;
  
  // Document Operations
  indexDocument(document: Document): Promise<void>;
  indexDocuments(documents: Document[]): Promise<void>;
  deleteDocument(id: number | string): Promise<void>;
  
  // Search
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  searchSimilarDocuments(documentId: number | string, options?: SearchOptions): Promise<SearchResult[]>;
  
  // Advanced Features
  hybridSearch(query: string, keywords: string[], options?: SearchOptions): Promise<SearchResult[]>;
  multiSearch(queries: string[], options?: SearchOptions): Promise<SearchResult[][]>;
}

/**
 * Create a semantic search instance
 */
export function createSemanticSearch(config: SemanticSearchConfig): SemanticSearch {
  const collectionName = config.collectionName || 'orpaynter_documents';
  const embeddingModel = config.embeddingModel || 'sentence-transformers/all-MiniLM-L6-v2';
  const embeddingDimensions = config.embeddingDimensions || 384;
  
  const qdrant = createQdrantConnector({
    url: config.qdrant.url,
    apiKey: config.qdrant.apiKey,
  });
  
  const hf = createHuggingFaceConnector({
    apiKey: config.huggingface.apiKey,
  });
  
  return {
    async initializeCollection(): Promise<void> {
      try {
        await qdrant.getCollectionInfo(collectionName);
        console.log(`Collection '${collectionName}' already exists`);
      } catch (error) {
        // Collection doesn't exist, create it
        await qdrant.createCollection(collectionName, embeddingDimensions, 'Cosine');
        console.log(`Created collection '${collectionName}'`);
      }
    },
    
    async deleteCollection(): Promise<void> {
      await qdrant.deleteCollection(collectionName);
    },
    
    async getCollectionInfo(): Promise<any> {
      return qdrant.getCollectionInfo(collectionName);
    },
    
    async indexDocument(document: Document): Promise<void> {
      const embedding = await hf.createEmbedding(document.text, {
        model: embeddingModel,
      });
      
      await qdrant.upsert(collectionName, [{
        id: document.id,
        vector: embedding,
        payload: {
          text: document.text,
          ...document.metadata,
        },
      }]);
    },
    
    async indexDocuments(documents: Document[]): Promise<void> {
      // Batch create embeddings
      const texts = documents.map(d => d.text);
      const embeddings = await hf.createEmbeddings(texts, {
        model: embeddingModel,
      });
      
      // Prepare points for Qdrant
      const points = documents.map((doc, index) => ({
        id: doc.id,
        vector: embeddings[index],
        payload: {
          text: doc.text,
          ...doc.metadata,
        },
      }));
      
      // Batch upsert to Qdrant
      await qdrant.upsert(collectionName, points);
    },
    
    async deleteDocument(id: number | string): Promise<void> {
      await qdrant.deletePoints(collectionName, [id]);
    },
    
    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
      const limit = options.limit || 10;
      const scoreThreshold = options.scoreThreshold || 0.0;
      
      // Create query embedding
      const queryEmbedding = await hf.createEmbedding(query, {
        model: embeddingModel,
      });
      
      // Search in Qdrant
      const results = await qdrant.search(collectionName, {
        vector: queryEmbedding,
        limit,
        filter: options.filter,
        scoreThreshold,
      });
      
      // Format results
      return results.map(result => ({
        id: result.id,
        score: result.score,
        text: result.payload?.text || '',
        metadata: result.payload ? { ...result.payload, text: undefined } : undefined,
      }));
    },
    
    async searchSimilarDocuments(documentId: number | string, options: SearchOptions = {}): Promise<SearchResult[]> {
      const limit = options.limit || 10;
      
      // Get the document's vector
      const points = await qdrant.retrieve(collectionName, [documentId], true);
      if (points.length === 0) {
        throw new Error(`Document ${documentId} not found`);
      }
      
      const vector = points[0].vector;
      if (!vector) {
        throw new Error(`Document ${documentId} has no vector`);
      }
      
      // Search for similar documents
      const results = await qdrant.search(collectionName, {
        vector,
        limit: limit + 1, // +1 to exclude the document itself
        filter: options.filter,
      });
      
      // Filter out the original document and format results
      return results
        .filter(result => result.id !== documentId)
        .slice(0, limit)
        .map(result => ({
          id: result.id,
          score: result.score,
          text: result.payload?.text || '',
          metadata: result.payload ? { ...result.payload, text: undefined } : undefined,
        }));
    },
    
    async hybridSearch(query: string, keywords: string[], options: SearchOptions = {}): Promise<SearchResult[]> {
      const limit = options.limit || 10;
      
      // Create query embedding
      const queryEmbedding = await hf.createEmbedding(query, {
        model: embeddingModel,
      });
      
      // Build keyword filter
      const keywordFilter = keywords.length > 0 ? {
        should: keywords.map(keyword => ({
          key: 'text',
          match: { text: keyword },
        })),
      } : undefined;
      
      // Combine with user filter
      const combinedFilter = options.filter || keywordFilter
        ? {
            must: [
              ...(options.filter ? [options.filter] : []),
              ...(keywordFilter ? [keywordFilter] : []),
            ],
          }
        : undefined;
      
      // Search
      const results = await qdrant.search(collectionName, {
        vector: queryEmbedding,
        limit,
        filter: combinedFilter,
      });
      
      return results.map(result => ({
        id: result.id,
        score: result.score,
        text: result.payload?.text || '',
        metadata: result.payload ? { ...result.payload, text: undefined } : undefined,
      }));
    },
    
    async multiSearch(queries: string[], options: SearchOptions = {}): Promise<SearchResult[][]> {
      const limit = options.limit || 10;
      
      // Create embeddings for all queries
      const queryEmbeddings = await hf.createEmbeddings(queries, {
        model: embeddingModel,
      });
      
      // Search for each query
      const allResults = await Promise.all(
        queryEmbeddings.map(queryEmbedding =>
          qdrant.search(collectionName, {
            vector: queryEmbedding,
            limit,
            filter: options.filter,
          })
        )
      );
      
      // Format results
      return allResults.map(results =>
        results.map(result => ({
          id: result.id,
          score: result.score,
          text: result.payload?.text || '',
          metadata: result.payload ? { ...result.payload, text: undefined } : undefined,
        }))
      );
    },
  };
}
