import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Result, ok, err } from 'neverthrow';
import debug from 'debug';
import { parseMermaidClassDiagram } from '../../shared/lib/mermaid-parser/index.js';
import { MermaidSourceSchema } from '../../entities/class-diagram/schema.js';

const log = debug('mcp:mermaid-parser');

export type MermaidParserError = {
  type: 'INVALID_SYNTAX' | 'PARSE_ERROR' | 'VALIDATION_ERROR';
  message: string;
};

export async function classDiagramTool(
  { mermaidSource }: { mermaidSource: string },
  options: {
    logger?: (message: string, ...args: any[]) => void;
  } = {}
): Promise<Result<{ content: Array<{ type: 'text'; text: string }> }, MermaidParserError>> {
  const logger = options.logger || log;

  logger('classDiagramTool called with source length: %d', mermaidSource.length);

  try {
    // 入力バリデーション
    const validatedInput = MermaidSourceSchema.safeParse(mermaidSource);
    if (!validatedInput.success) {
      logger('Input validation failed: %O', validatedInput.error);
      return err({
        type: 'VALIDATION_ERROR',
        message: `Invalid input: ${validatedInput.error.message}`
      });
    }

    // Mermaidクラス図をパース
    const result = parseMermaidClassDiagram(validatedInput.data);
    
    logger('Parse successful: %d classes, %d relationships', 
           result.classes.length, result.relationships.length);

    // 結果をJSON文字列として返す
    const jsonResult = JSON.stringify(result, null, 2);

    return ok({
      content: [
        {
          type: "text" as const,
          text: jsonResult,
        }
      ]
    });
  } catch (error) {
    // パースエラーのハンドリング
    logger('Parse error: %O', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid Mermaid syntax')) {
        return err({
          type: 'INVALID_SYNTAX',
          message: error.message
        });
      }
      
      return err({
        type: 'PARSE_ERROR',
        message: `Parse error: ${error.message}`
      });
    }
    
    return err({
      type: 'PARSE_ERROR',
      message: `Unexpected error during parsing: ${error}`
    });
  }
}

// エラーハンドリングラッパー関数
export async function classDiagramToolWrapper(args: { mermaidSource: string }) {
  const result = await classDiagramTool(args);

  return result.match(
    (success) => success,
    (error) => {
      log('Class diagram tool error: %O', error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error.message}`,
          }
        ],
        isError: true
      };
    }
  );
}

export function createMermaidServer(): McpServer {
  log('Creating Mermaid Parser MCP Server instance');

  const server = new McpServer({
    name: "mermaid-parser",
    version: "1.0.0",
  });

  // Register the "class diagram" tool
  server.tool(
    "class diagram",
    "Parse Mermaid class diagram to JSON",
    {
      mermaidSource: z.string().min(1).max(100000).describe("Mermaid class diagram source text")
    },
    classDiagramToolWrapper
  );

  log('Mermaid Parser MCP Server created with class diagram tool');
  return server;
};