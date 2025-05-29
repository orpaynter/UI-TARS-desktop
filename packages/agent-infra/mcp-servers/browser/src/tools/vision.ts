import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ToolContext } from '../typings.js';

type ToolNames = keyof typeof visionToolsMap;
type ToolInputMap = {
  [K in ToolNames]: (typeof visionToolsMap)[K] extends {
    inputSchema: infer S;
  }
    ? S extends z.ZodType<any, any, any>
      ? z.infer<S>
      : unknown
    : unknown;
};

export const visionToolsMap = {
  browser_vision_screen_click: {
    description: 'Click left mouse button on the page with vision and snapshot',
    inputSchema: z.object({
      x: z.number().describe('X coordinate'),
      y: z.number().describe('Y coordinate'),
    }),
  },
};

export const getVisionTools = (ctx: ToolContext) => {
  const { page } = ctx;

  const visionTools: {
    [K in ToolNames]: (args: ToolInputMap[K]) => Promise<CallToolResult>;
  } = {
    browser_vision_screen_click: async (args) => {
      try {
        await page.mouse.move(args.x, args.y);
        await page.mouse.down();
        await page.mouse.up();

        return {
          content: [
            {
              type: 'text',
              text: `Vision click at ${args.x}, ${args.y}`,
            },
          ],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: 'Error clicking on the page' }],
          isError: true,
        };
      }
    },
  };
  return visionTools;
};
