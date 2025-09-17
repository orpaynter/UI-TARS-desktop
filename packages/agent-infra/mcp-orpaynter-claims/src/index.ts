#!/usr/bin/env node
/**
 * OrPaynter Claims MCP Server
 * Handles roof damage claims processing
 */
import { startSseAndStreamableHttpMcpServer } from 'mcp-http-server';
import { program } from 'commander';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createServer } from './server.js';

program
  .name(process.env.NAME || 'mcp-orpaynter-claims')
  .description(
    process.env.DESCRIPTION || 'MCP server for OrPaynter claims processing',
  )
  .version(process.env.VERSION || '0.1.0')
  .option('--host <host>', 'host to bind server to. Default is localhost.')
  .option('--port <port>', 'port to listen on for SSE and HTTP transport.')
  .action(async (options) => {
    try {
      const createMcpServer = async () => {
        const server: McpServer = createServer();
        return server;
      };

      if (options.port || options.host) {
        await startSseAndStreamableHttpMcpServer({
          host: options.host,
          port: options.port,
          createMcpServer: async () => createMcpServer(),
        });
      } else {
        const server = await createMcpServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.debug('OrPaynter Claims MCP Server running on stdio');
      }
    } catch (error) {
      console.error('Error: ', error);
      process.exit(1);
    }
  });

program.parse();
