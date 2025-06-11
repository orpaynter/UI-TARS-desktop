import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Jimp } from 'jimp';
import { z } from 'zod';

const NutJSModule = await import('@ui-tars/operator-nut-js');
const { NutJSOperator } = NutJSModule?.default ?? NutJSModule;

let screenWidth: number | null = null;
let screenHeight: number | null = null;
let screenScaleFactor = 1;

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'computer-control-server', // 为服务器提供一个描述性名称
    version: process.env.VERSION || '0.0.1',
  });

  const nutJSOperator = new NutJSOperator();

  /**
   * 辅助函数，用于执行 NutJS operator 的操作，封装了通用参数。
   * @param action_type - 要执行的操作类型。
   * @param action_inputs - 操作所需的输入。
   * @returns 一个表示操作结果的对象。
   */
  const executeNutJsAction = async (
    action_type: string,
    action_inputs: object,
  ) => {
    // 对于需要坐标的操作，检查屏幕尺寸是否已获取
    if (
      ['click', 'double_click', 'right_click', 'drag', 'scroll'].includes(
        action_type,
      ) &&
      (!screenWidth || !screenHeight)
    ) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: 'Screen dimensions not available. Please take a screenshot first using `computer_screenshot`.',
          },
        ],
      };
    }

    await nutJSOperator.execute({
      prediction: '', // 占位符
      factors: [1000, 1000], // 占位符
      parsedPrediction: {
        action_type,
        action_inputs,
        thought: '', // 占位符
        reflection: '', // 占位符
      },
      screenWidth: screenWidth!,
      screenHeight: screenHeight!,
      scaleFactor: screenScaleFactor,
    });

    return {
      isError: false,
      content: [
        {
          type: 'text' as const,
          text: `Action '${action_type}' executed successfully.`,
        },
      ],
    };
  };

  // === MCP 工具定义 ===

  server.tool(
    'computer_screenshot',
    'Takes a screenshot of the current screen. This must be called before any coordinate-based actions to get screen dimensions.',
    {},
    async () => {
      const { base64, scaleFactor } = await nutJSOperator.screenshot();
      const imageBuffer = Buffer.from(base64, 'base64');
      const image = await Jimp.read(imageBuffer);
      const { width, height } = image.bitmap;

      // 更新全局屏幕状态
      screenWidth = width * scaleFactor;
      screenHeight = height * scaleFactor;
      screenScaleFactor = scaleFactor;

      return {
        isError: false,
        content: [
          {
            type: 'image' as const,
            data: base64,
            mimeType: 'image/png',
          },
          {
            type: 'text' as const,
            text: `Screenshot taken. Physical resolution: ${width}x${height}. Scaled resolution for automation: ${screenWidth}x${screenHeight}. Scale factor: ${scaleFactor}.`,
          },
        ],
      };
    },
  );

  server.tool(
    'computer_mouse_click',
    'Performs a single, double, or right-click at a specific screen coordinate.',
    {
      click_type: z
        .enum(['click', 'double_click', 'right_click'])
        .describe('The type of click to perform.'),
      x: z.number().describe('The x-coordinate for the click.'),
      y: z.number().describe('The y-coordinate for the click.'),
    },
    async (args) => {
      // 将 x, y 坐标转换为 operator 需要的 box 格式
      const action_inputs = {
        start_box: JSON.stringify([args.x, args.y, args.x, args.y]),
      };
      return executeNutJsAction(args.click_type, action_inputs);
    },
  );

  server.tool(
    'computer_mouse_drag',
    'Drags the mouse from a starting coordinate to an ending coordinate.',
    {
      startX: z.number().describe('The starting x-coordinate of the drag.'),
      startY: z.number().describe('The starting y-coordinate of the drag.'),
      endX: z.number().describe('The ending x-coordinate of the drag.'),
      endY: z.number().describe('The ending y-coordinate of the drag.'),
    },
    async (args) => {
      const action_inputs = {
        start_box: JSON.stringify([
          args.startX,
          args.startY,
          args.startX,
          args.startY,
        ]),
        end_box: JSON.stringify([args.endX, args.endY, args.endX, args.endY]),
      };
      return executeNutJsAction('drag', action_inputs);
    },
  );

  server.tool(
    'computer_keyboard_type',
    'Types the given text using the keyboard. To press Enter, end the text with "\\n".',
    {
      text: z
        .string()
        .describe(
          'The text to type. Use "\\n" at the end to simulate pressing Enter.',
        ),
    },
    async (args) => {
      const action_inputs = { content: args.text };
      return executeNutJsAction('type', action_inputs);
    },
  );

  server.tool(
    'computer_keyboard_hotkey',
    'Presses and releases a combination of keys (hotkey).',
    {
      keys: z
        .string()
        .describe(
          'The hotkey to press, with keys separated by "+" or spaces (e.g., "ctrl+c", "meta a").',
        ),
    },
    async (args) => {
      const action_inputs = { key: args.keys };
      return executeNutJsAction('hotkey', action_inputs);
    },
  );

  server.tool(
    'computer_mouse_scroll',
    'Scrolls the mouse wheel up or down. Can optionally move the mouse to a specific coordinate before scrolling.',
    {
      direction: z.enum(['up', 'down']).describe('The direction to scroll.'),
      x: z
        .number()
        .optional()
        .describe(
          'Optional x-coordinate to move the mouse to before scrolling.',
        ),
      y: z
        .number()
        .optional()
        .describe(
          'Optional y-coordinate to move the mouse to before scrolling.',
        ),
    },
    async (args) => {
      const action_inputs: { direction: string; start_box?: string } = {
        direction: args.direction,
      };
      if (args.x !== undefined && args.y !== undefined) {
        action_inputs.start_box = JSON.stringify([
          args.x,
          args.y,
          args.x,
          args.y,
        ]);
      }
      return executeNutJsAction('scroll', action_inputs);
    },
  );

  server.tool(
    'computer_wait',
    'Pauses execution for 5 seconds to wait for UI changes.',
    {},
    async () => {
      return executeNutJsAction('wait', {});
    },
  );

  server.tool(
    'task_finished',
    'Indicates that the task has been successfully completed.',
    {},
    async () => {
      await executeNutJsAction('finished', {});
      return {
        isError: false,
        content: [{ type: 'text' as const, text: 'Task marked as finished.' }],
      };
    },
  );

  server.tool(
    'call_user',
    'Use this when the task is unsolvable or requires user assistance.',
    {
      reason: z
        .string()
        .describe('A brief explanation of why user assistance is needed.'),
    },
    async (args) => {
      await executeNutJsAction('call_user', {});
      return {
        isError: false,
        content: [
          {
            type: 'text' as const,
            text: `Calling user for help. Reason: ${args.reason}`,
          },
        ],
      };
    },
  );

  return server;
}
