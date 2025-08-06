import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

/**
 * Information about a single file
 */
interface FileInfo {
  /** Relative path from workspace root */
  relativePath: string;
  /** File content or error message */
  content: string;
  /** Whether reading the file failed */
  hasError: boolean;
  /** File size in bytes */
  size: number;
}

/**
 * Result of directory expansion operation
 */
interface DirectoryExpansionResult {
  /** List of directories that were processed */
  processedDirectories: string[];
  /** All files found in the directories */
  files: FileInfo[];
  /** Formatted content ready for LLM consumption */
  expandedContent: string;
  /** Summary statistics */
  stats: {
    totalFiles: number;
    totalSize: number;
    errorCount: number;
  };
}

/**
 * Options for directory expansion
 */
interface DirectoryExpansionOptions {
  /** Maximum file size to read (in bytes, default: 1MB) */
  maxFileSize?: number;
  /** File extensions to ignore (e.g., ['.jpg', '.png', '.pdf']) */
  ignoreExtensions?: string[];
  /** Directory names to ignore (e.g., ['node_modules', '.git']) */
  ignoreDirs?: string[];
  /** Maximum depth for recursive reading (default: 10) */
  maxDepth?: number;
}

/**
 * Default options for directory expansion
 */
const DEFAULT_OPTIONS: Required<DirectoryExpansionOptions> = {
  maxFileSize: 1024 * 1024, // 1MB
  ignoreExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.zip', '.tar', '.gz'],
  ignoreDirs: ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'],
  maxDepth: 10,
};

/**
 * DirectoryExpander - High-performance directory content reader
 * 
 * Features:
 * - Parallel file reading for optimal performance
 * - Automatic deduplication of directory paths
 * - Recursive directory traversal with depth limits
 * - Smart filtering of binary and large files
 * - LLM-optimized output formatting
 */
export class DirectoryExpander {
  private options: Required<DirectoryExpansionOptions>;

  constructor(options: DirectoryExpansionOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Expand multiple directories with deduplication and parallel processing
   * @param directoryPaths Array of directory paths to expand
   * @param workspacePath Base workspace path for security validation
   * @returns Promise resolving to expansion result
   */
  async expandDirectories(
    directoryPaths: string[],
    workspacePath: string,
  ): Promise<DirectoryExpansionResult> {
    // Step 1: Deduplicate and validate paths
    const uniquePaths = this.deduplicatePaths(directoryPaths);
    const validatedPaths = this.validatePaths(uniquePaths, workspacePath);

    if (validatedPaths.length === 0) {
      return {
        processedDirectories: [],
        files: [],
        expandedContent: '',
        stats: { totalFiles: 0, totalSize: 0, errorCount: 0 },
      };
    }

    // Step 2: Collect all files from all directories in parallel
    const fileCollectionPromises = validatedPaths.map((dirPath) =>
      this.collectFilesRecursively(dirPath, workspacePath, 0),
    );

    const fileArrays = await Promise.all(fileCollectionPromises);
    const allFilePaths = fileArrays.flat();

    // Step 3: Deduplicate files (in case directories overlap)
    const uniqueFilePaths = [...new Set(allFilePaths)];

    // Step 4: Read all files in parallel
    const fileReadPromises = uniqueFilePaths.map((filePath) =>
      this.readFileInfo(filePath, workspacePath),
    );

    const files = await Promise.all(fileReadPromises);

    // Step 5: Calculate statistics
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      errorCount: files.filter((file) => file.hasError).length,
    };

    // Step 6: Format content for LLM consumption
    const expandedContent = this.formatForLLM(validatedPaths, files);

    return {
      processedDirectories: validatedPaths,
      files,
      expandedContent,
      stats,
    };
  }

  /**
   * Deduplicate directory paths and resolve relative paths
   */
  private deduplicatePaths(directoryPaths: string[]): string[] {
    const normalizedPaths = directoryPaths
      .map((p) => path.normalize(p))
      .filter((p) => p.length > 0);

    return [...new Set(normalizedPaths)];
  }

  /**
   * Validate paths for security and existence
   */
  private validatePaths(directoryPaths: string[], workspacePath: string): string[] {
    const validPaths: string[] = [];

    for (const dirPath of directoryPaths) {
      try {
        const absolutePath = path.resolve(workspacePath, dirPath);
        const normalizedWorkspace = path.resolve(workspacePath);

        // Security check: ensure path is within workspace
        if (!absolutePath.startsWith(normalizedWorkspace)) {
          console.warn(`Directory path outside workspace: ${dirPath}`);
          continue;
        }

        // Existence check
        if (!fsSync.existsSync(absolutePath) || !fsSync.statSync(absolutePath).isDirectory()) {
          console.warn(`Directory not found or not a directory: ${dirPath}`);
          continue;
        }

        validPaths.push(absolutePath);
      } catch (error) {
        console.warn(`Failed to validate directory path ${dirPath}:`, error);
      }
    }

    return validPaths;
  }

  /**
   * Recursively collect all file paths in a directory
   */
  private async collectFilesRecursively(
    directoryPath: string,
    workspacePath: string,
    depth: number,
  ): Promise<string[]> {
    if (depth > this.options.maxDepth) {
      return [];
    }

    try {
      const entries = await fs.readdir(directoryPath, { withFileTypes: true });
      const filePaths: string[] = [];

      for (const entry of entries) {
        const fullPath = path.join(directoryPath, entry.name);

        if (entry.isFile()) {
          // Check file extension
          const ext = path.extname(entry.name).toLowerCase();
          if (!this.options.ignoreExtensions.includes(ext)) {
            filePaths.push(fullPath);
          }
        } else if (entry.isDirectory()) {
          // Check if directory should be ignored
          if (!this.options.ignoreDirs.includes(entry.name)) {
            const subFiles = await this.collectFilesRecursively(fullPath, workspacePath, depth + 1);
            filePaths.push(...subFiles);
          }
        }
      }

      return filePaths;
    } catch (error) {
      console.warn(`Failed to read directory ${directoryPath}:`, error);
      return [];
    }
  }

  /**
   * Read file information including content
   */
  private async readFileInfo(filePath: string, workspacePath: string): Promise<FileInfo> {
    const relativePath = path.relative(workspacePath, filePath);

    try {
      const stats = await fs.stat(filePath);

      // Check file size limit
      if (stats.size > this.options.maxFileSize) {
        return {
          relativePath,
          content: `[File too large: ${this.formatFileSize(stats.size)}]`,
          hasError: true,
          size: stats.size,
        };
      }

      // Read file content
      const content = await fs.readFile(filePath, 'utf8');

      return {
        relativePath,
        content,
        hasError: false,
        size: stats.size,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        relativePath,
        content: `[Error reading file: ${errorMessage}]`,
        hasError: true,
        size: 0,
      };
    }
  }

  /**
   * Format the results for optimal LLM consumption
   */
  private formatForLLM(directories: string[], files: FileInfo[]): string {
    const sections: string[] = [];

    // Add summary section
    const stats = {
      totalFiles: files.length,
      successfulFiles: files.filter((f) => !f.hasError).length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
    };

    sections.push(
      `=== Directory Content Summary ===`,
      `Processed Directories: ${directories.length}`,
      `Total Files: ${stats.totalFiles}`,
      `Successfully Read: ${stats.successfulFiles}`,
      `Total Size: ${this.formatFileSize(stats.totalSize)}`,
      ``,
    );

    // Group files by directory for better organization
    const filesByDirectory = new Map<string, FileInfo[]>();
    
    for (const file of files) {
      const dir = path.dirname(file.relativePath);
      if (!filesByDirectory.has(dir)) {
        filesByDirectory.set(dir, []);
      }
      filesByDirectory.get(dir)!.push(file);
    }

    // Sort directories and files for consistent output
    const sortedDirectories = Array.from(filesByDirectory.keys()).sort();

    for (const dir of sortedDirectories) {
      const dirFiles = filesByDirectory.get(dir)!.sort((a, b) => 
        a.relativePath.localeCompare(b.relativePath)
      );

      sections.push(`=== Directory: ${dir || '.'} ===`);

      for (const file of dirFiles) {
        sections.push(
          ``,
          `--- File: ${file.relativePath} ---`,
          file.content,
          `--- End of ${file.relativePath} ---`,
        );
      }

      sections.push(`=== End of Directory: ${dir || '.'} ===`, ``);
    }

    return sections.join('\n');
  }

  /**
   * Format file size in human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}
