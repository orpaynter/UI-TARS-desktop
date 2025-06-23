/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConsoleLogger } from '@mcp-agent/core';

/**
 * Options for image compression
 */
export interface ImageCompressorOptions {
  /** Compression quality (1-100) */
  quality: number;
  /** Output format (e.g., 'webp', 'jpeg') */
  format: 'webp' | 'jpeg' | 'png';
  /* Screenshot cost */
  screenshotTime: number;
}

/**
 * Compression result metadata
 */
export interface CompressionResult {
  /** Compressed image data as base64 string with appropriate data URI prefix */
  base64: string;
  /** Compressed image data as buffer */
  buffer: Buffer;
  /** Original size in bytes */
  originalSize: number;
  /** Compressed size in bytes */
  compressedSize: number;
  /** Compression ratio (original/compressed) */
  compressionRatio: number;
  /** Compression percentage (how much smaller) */
  compressionPercentage: string;
  /** Image width (if available) */
  width?: number;
  /** Image height (if available) */
  height?: number;
  /** Time taken to compress in milliseconds */
  processingTimeMs?: number;
}

/**
 * Utility class for image compression and analysis
 */
export class ImageCompressor {
  private options: ImageCompressorOptions;
  private logger?: ConsoleLogger;

  /**
   * Create a new ImageCompressor instance
   * @param options - Compression options
   * @param logger - Optional logger for compression stats
   */
  constructor(options: ImageCompressorOptions, logger?: ConsoleLogger) {
    this.options = {
      quality: options.quality || 20,
      screenshotTime: options.screenshotTime || 0,
      format: options.format || 'webp',
    };
    this.logger = logger;
  }

  /**
   * Extract width and height information from base64 encoded image
   * @param base64String - Base64 encoded image data
   * @returns Image dimensions (width and height)
   */
  public extractImageDimensions(base64String: string): { width?: number; height?: number } {
    // Remove base64 prefix (if any)
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

    // Decode base64 to binary data
    const buffer = Buffer.from(base64Data, 'base64');
    let width: number | undefined;
    let height: number | undefined;

    // Check image type and extract dimensions
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      // PNG format: width in bytes 16-19, height in bytes 20-23
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);
    } else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      // JPEG format: need to parse SOF0 marker (0xFFC0)
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break;

        const marker = buffer[offset + 1];
        const segmentLength = buffer.readUInt16BE(offset + 2);

        // SOF0, SOF2 markers contain dimension information
        if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7)) {
          height = buffer.readUInt16BE(offset + 5);
          width = buffer.readUInt16BE(offset + 7);
          break;
        }

        offset += 2 + segmentLength;
      }
    }

    // Log if dimensions couldn't be extracted
    if (!width || !height) {
      if (this.logger) {
        this.logger.warn('Unable to extract dimension information from image data');
      }
    }

    return { width, height };
  }

  /**
   * Compress an image from base64 string and return comprehensive result
   * @param base64Image - Base64 encoded image with or without data URI prefix
   * @param processingStartTime - Optional timestamp for measuring total processing time
   * @returns Detailed compression result
   */
  public async compressImage(
    base64Image: string,
    processingStartTime?: number,
  ): Promise<CompressionResult> {
    const startTime = processingStartTime || performance.now();

    // Remove data URI prefix if present
    const originalBase64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const originalBuffer = Buffer.from(originalBase64Data, 'base64');
    const originalSize = originalBuffer.length;

    // Extract dimensions
    const { width, height } = this.extractImageDimensions(base64Image);

    // Compress the image
    const compressedSize = originalBuffer.length;

    // Convert compressed buffer to base64 with data URI prefix
    const compressedBase64 = `data:image/${this.options.format};base64,${originalBuffer.toString(
      'base64',
    )}`;

    // Calculate compression statistics
    const compressionRatio = originalSize / compressedSize;
    const compressionPercentage = ((1 - compressedSize / originalSize) * 100).toFixed(2);

    // Calculate processing time
    const endTime = performance.now();
    const processingTimeMs = endTime - startTime;

    const result: CompressionResult = {
      base64: compressedBase64,
      buffer: originalBuffer,
      originalSize,
      compressedSize,
      compressionRatio,
      compressionPercentage,
      width,
      height,
      processingTimeMs,
    };

    return result;
  }

  /**
   * Log detailed image info (can be called independently)
   * @param result - Compression result
   * @param log - direct log
   */
  public logImageInfo(result: CompressionResult, log?: boolean): void {
    if (log) {
      console.log('Image info:', {
        width: result.width,
        height: result.height,
        size: `${(result.compressedSize / 1024).toFixed(2)} KB`,
        screenshotTime: `${this.options.screenshotTime} ms`,
        time: `${result.processingTimeMs?.toFixed(2)} ms`,
        compression: `${
          result.originalSize / 1024 > 1024
            ? (result.originalSize / 1024 / 1024).toFixed(2) + ' MB'
            : (result.originalSize / 1024).toFixed(2) + ' KB'
        } → ${formatBytes(result.compressedSize)} (${result.compressionPercentage}% reduction)`,
      });
      return;
    }

    // Log with proper logger
    this.logger?.info('Image info:', {
      width: result.width,
      height: result.height,
      size: `${(result.compressedSize / 1024).toFixed(2)} KB`,
      screenshotTime: `${this.options.screenshotTime} ms`,
      time: `${result.processingTimeMs?.toFixed(2)} ms`,
      compression: `${
        result.originalSize / 1024 > 1024
          ? (result.originalSize / 1024 / 1024).toFixed(2) + ' MB'
          : (result.originalSize / 1024).toFixed(2) + ' KB'
      } → ${formatBytes(result.compressedSize)} (${result.compressionPercentage}% reduction)`,
    });
  }
}

/**
 * Format bytes to human-readable string (KB, MB, etc.)
 * @param bytes - Number of bytes
 * @returns Formatted string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Helper class to handle Base64 image operations
 */
export class Base64ImageUtils {
  /**
   * Add data URI prefix to base64 image if not present
   * @param base64 - Base64 string with or without data URI prefix
   * @param mimeType - Optional MIME type (defaults to image/jpeg)
   * @returns Base64 string with data URI prefix
   */
  public static addDataUriPrefix(base64: string, mimeType = 'image/jpeg'): string {
    if (!base64) return '';
    return base64.startsWith('data:') ? base64 : `data:${mimeType};base64,${base64}`;
  }

  /**
   * Remove data URI prefix from base64 string
   * @param base64 - Base64 string with data URI prefix
   * @returns Raw base64 string without prefix
   */
  public static removeDataUriPrefix(base64: string): string {
    return base64.replace(/^data:image\/\w+;base64,/, '');
  }
}
