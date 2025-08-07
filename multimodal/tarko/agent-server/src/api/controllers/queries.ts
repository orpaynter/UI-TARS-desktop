/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { getLogger } from '@tarko/shared-utils';
import { ImageCompressor, formatBytes } from '@tarko/shared-media-utils';
import { ChatCompletionContentPart, ChatCompletionContentPartImage } from '@tarko/interface';
import { createErrorResponse } from '../../utils/error-handler';
import { DirectoryExpander } from '../../utils/directory-expander';
import fs from 'fs';
import path from 'path';

const imageCompressor = new ImageCompressor({
  quality: 5,
  format: 'webp',
});

const logger = getLogger('Controller-Queries');

/**
 * Compress images in query content if present
 * @param query - The query content that may contain images
 * @returns Processed query with compressed images
 */
async function compressImagesInQuery(
  query: string | ChatCompletionContentPart[],
): Promise<string | ChatCompletionContentPart[]> {
  try {
    // Handle different query formats
    if (typeof query === 'string') {
      return query; // Text only, no compression needed
    }

    // Handle array of content parts (multimodal format)
    if (Array.isArray(query)) {
      const compressedQuery = await Promise.all(
        query.map(async (part: ChatCompletionContentPart) => {
          if (part.type === 'image_url' && part.image_url?.url) {
            return await compressImageUrl(part);
          }
          return part;
        }),
      );
      return compressedQuery;
    }

    return query;
  } catch (error) {
    console.error('Error compressing images in query:', error);
    // Return original query if compression fails
    return query;
  }
}

/**
 * Compress a single image URL
 * @param imagePart - Content part containing image URL
 * @returns Compressed image content part
 */
async function compressImageUrl(
  imagePart: ChatCompletionContentPartImage,
): Promise<ChatCompletionContentPartImage> {
  try {
    const imageUrl = imagePart!.image_url.url;

    // Skip if not a base64 image
    if (!imageUrl.startsWith('data:image/')) {
      return imagePart;
    }

    // Extract base64 data
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
    const originalBuffer = Buffer.from(base64Data, 'base64');
    const originalSize = originalBuffer.length;

    // Compress the image
    const compressedBuffer = await imageCompressor.compressToBuffer(originalBuffer);
    const compressedSize = compressedBuffer.length;

    // Convert compressed buffer to base64
    const compressedBase64 = `data:image/webp;base64,${compressedBuffer.toString('base64')}`;

    // Log compression stats
    const compressionRatio = originalSize / compressedSize;
    const compressionPercentage = ((1 - compressedSize / originalSize) * 100).toFixed(2);

    console.log('Image compression stats:', {
      original: formatBytes(originalSize),
      compressed: formatBytes(compressedSize),
      ratio: `${compressionRatio.toFixed(2)}x (${compressionPercentage}% smaller)`,
      format: 'webp',
      quality: 80,
    });

    return {
      ...imagePart,
      image_url: {
        url: compressedBase64,
      },
    };
  } catch (error) {
    console.error('Error compressing individual image:', error);
    // Return original image part if compression fails
    return imagePart;
  }
}

/**
 * Process contextual references in query content
 * Expands @file: and @dir: references to actual content
 */
async function processContextualReferences(
  query: string | ChatCompletionContentPart[],
  workspacePath: string,
): Promise<string | ChatCompletionContentPart[]> {
  // Only process string queries for now
  if (typeof query !== 'string') {
    return query;
  }

  // Find all contextual references
  const contextualReferencePattern = /@(file|dir):([^\s]+)/g;
  const matches = Array.from(query.matchAll(contextualReferencePattern));

  if (matches.length === 0) {
    return query;
  }

  // Separate file and directory references
  const fileReferences: string[] = [];
  const dirReferences: string[] = [];

  for (const match of matches) {
    const [, type, relativePath] = match;
    if (type === 'file') {
      fileReferences.push(relativePath);
    } else if (type === 'dir') {
      dirReferences.push(relativePath);
    }
  }

  let processedQuery = query;

  // Process directory references with high-performance expansion
  if (dirReferences.length > 0) {
    try {
      const directoryExpander = new DirectoryExpander({
        maxFileSize: 2 * 1024 * 1024, // 2MB limit for LLM context
        ignoreExtensions: [
          '.jpg',
          '.jpeg',
          '.png',
          '.gif',
          '.webp',
          '.svg',
          '.pdf',
          '.zip',
          '.tar',
          '.gz',
          '.exe',
          '.dll',
        ],
        ignoreDirs: [
          'node_modules',
          '.git',
          '.next',
          'dist',
          'build',
          'coverage',
          '.vscode',
          '.idea',
        ],
        maxDepth: 8,
      });

      const expansionResult = await directoryExpander.expandDirectories(
        dirReferences,
        workspacePath,
      );

      // Replace all @dir: references with the expanded content
      for (const dirRef of dirReferences) {
        const pattern = new RegExp(`@dir:${dirRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
        processedQuery = processedQuery.replace(
          pattern,
          `\n\n${expansionResult.expandedContent}\n\n`,
        );
      }

      // Log expansion statistics
      console.log('Directory expansion completed:', {
        directories: expansionResult.processedDirectories.length,
        files: expansionResult.stats.totalFiles,
        totalSize: expansionResult.stats.totalSize,
        errors: expansionResult.stats.errorCount,
      });
    } catch (error) {
      console.error('Failed to expand directories:', error);

      // Fallback to original simple directory listing for error cases
      for (const dirRef of dirReferences) {
        const pattern = new RegExp(`@dir:${dirRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
        processedQuery = processedQuery.replace(
          pattern,
          `\n\n=== Error expanding directory: ${dirRef} ===\n`,
        );
      }
    }
  }

  // Process individual file references (keep existing logic)
  for (const fileRef of fileReferences) {
    try {
      const absolutePath = path.resolve(workspacePath, fileRef);

      // Security check: ensure path is within workspace
      const normalizedWorkspace = path.resolve(workspacePath);
      const normalizedTarget = path.resolve(absolutePath);

      if (!normalizedTarget.startsWith(normalizedWorkspace)) {
        console.warn(`File reference outside workspace: ${fileRef}`);
        continue;
      }

      if (!fs.existsSync(absolutePath)) {
        console.warn(`File reference not found: ${fileRef}`);
        continue;
      }

      const stats = fs.statSync(absolutePath);
      if (stats.isFile()) {
        try {
          const fileContent = fs.readFileSync(absolutePath, 'utf8');
          const expandedContent = `\n\n=== File: ${fileRef} ===\n${fileContent}\n=== End of File ===\n`;

          const pattern = new RegExp(
            `@file:${fileRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
            'g',
          );
          processedQuery = processedQuery.replace(pattern, expandedContent);
        } catch (error) {
          console.error(`Failed to read file ${fileRef}:`, error);
          const pattern = new RegExp(
            `@file:${fileRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
            'g',
          );
          processedQuery = processedQuery.replace(
            pattern,
            `\n\n=== Error reading file: ${fileRef} ===\n`,
          );
        }
      }
    } catch (error) {
      console.error(`Failed to process file reference ${fileRef}:`, error);
    }
  }

  return processedQuery;
}

/**
 * Execute a non-streaming query
 */
export async function executeQuery(req: Request, res: Response) {
  const { sessionId, query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // Get server instance to access workspace path
    const server = req.app.locals.server;
    const workspacePath = server.getCurrentWorkspace();

    // Process contextual references first
    const processedQuery = await processContextualReferences(query, workspacePath);

    // Compress images in processed query
    const compressedQuery = await compressImagesInQuery(processedQuery);

    // Use enhanced error handling in runQuery
    const response = await req.session!.runQuery(compressedQuery);

    if (response.success) {
      res.status(200).json({ result: response.result });
    } else {
      // Send structured error response with 500 status
      res.status(500).json(response);
    }
  } catch (error) {
    // This should never happen with the new error handling, but just in case
    console.error(`Unexpected error processing query in session ${sessionId}:`, error);
    res.status(500).json(createErrorResponse(error));
  }
}

/**
 * Execute a streaming query
 */
export async function executeStreamingQuery(req: Request, res: Response) {
  const { sessionId, query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // Set response headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get server instance to access workspace path
    const server = req.app.locals.server;
    const workspacePath = server.getCurrentWorkspace();

    // Process contextual references first
    const processedQuery = await processContextualReferences(query, workspacePath);

    // Compress images in processed query
    const compressedQuery = await compressImagesInQuery(processedQuery);

    // Get streaming response - any errors will be returned as events
    const eventStream = await req.session!.runQueryStreaming(compressedQuery);

    // Stream events one by one
    for await (const event of eventStream) {
      // Check for error events
      const isErrorEvent = event.type === 'system' && event.level === 'error';

      // Only send data when connection is still open
      if (!res.closed) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);

        // If we encounter an error event, end streaming
        if (isErrorEvent) {
          break;
        }
      } else {
        break;
      }
    }

    // End the stream response
    if (!res.closed) {
      res.end();
    }
  } catch (error) {
    // This should almost never happen with the new error handling
    console.error(`Critical error in streaming query for session ${sessionId}:`, error);

    if (!res.headersSent) {
      res.status(500).json(createErrorResponse(error));
    } else {
      const errorObj = createErrorResponse(error);
      res.write(
        `data: ${JSON.stringify({
          type: 'system',
          level: 'error',
          message: errorObj.error.message,
          timestamp: Date.now(),
        })}\n\n`,
      );
      res.end();
    }
  }
}

/**
 * Abort a running query
 */
export async function abortQuery(req: Request, res: Response) {
  const { sessionId } = req.body;

  try {
    const aborted = req.session!.abortQuery();
    res.status(200).json({ success: aborted });
  } catch (error) {
    console.error(`Error aborting query in session ${sessionId}:`, error);
    res.status(500).json({ error: 'Failed to abort query' });
  }
}
