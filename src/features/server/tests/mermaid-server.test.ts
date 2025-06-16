import { describe, it, expect, vi } from 'vitest';
import { classDiagramTool, classDiagramToolWrapper, createMermaidServer } from '../mermaid-server.js';

describe('Mermaid Server', () => {
  describe('classDiagramTool', () => {
    it('正常なMermaidクラス図をパースできる', async () => {
      const mermaidSource = `
        classDiagram
        class BankAccount {
          +String owner
          +BigDecimal balance
          +deposit(amount)
        }
      `;

      const result = await classDiagramTool({ mermaidSource });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const content = result.value.content[0];
        expect(content.type).toBe('text');
        
        const parsedResult = JSON.parse(content.text);
        expect(parsedResult.classes).toHaveLength(1);
        expect(parsedResult.classes[0].name).toBe('BankAccount');
        expect(parsedResult.classes[0].members).toHaveLength(3);
      }
    });

    it('無効なMermaid記法でエラーを返す', async () => {
      const mermaidSource = 'invalid mermaid syntax';

      const result = await classDiagramTool({ mermaidSource });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_SYNTAX');
        expect(result.error.message).toContain('Invalid Mermaid syntax');
      }
    });

    it('空文字列で入力バリデーションエラーを返す', async () => {
      const mermaidSource = '';

      const result = await classDiagramTool({ mermaidSource });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('VALIDATION_ERROR');
      }
    });

    it('サイズ制限を超えた入力でバリデーションエラーを返す', async () => {
      const mermaidSource = 'a'.repeat(100001); // 100KB超過

      const result = await classDiagramTool({ mermaidSource });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('VALIDATION_ERROR');
      }
    });

    it('ログ関数が正しく呼ばれる', async () => {
      const mockLogger = vi.fn();
      const mermaidSource = `
        classDiagram
        class TestClass
      `;

      await classDiagramTool({ mermaidSource }, { logger: mockLogger });

      expect(mockLogger).toHaveBeenCalledWith(
        'classDiagramTool called with source length: %d',
        expect.any(Number)
      );
    });


  });

  describe('classDiagramToolWrapper', () => {
    it('成功時は結果をそのまま返す', async () => {
      const mermaidSource = `
        classDiagram
        class TestClass
      `;

      const result = await classDiagramToolWrapper({ mermaidSource });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect('isError' in result).toBe(false);
    });

    it('エラー時はエラーメッセージを含む結果を返す', async () => {
      const mermaidSource = 'invalid syntax';

      const result = await classDiagramToolWrapper({ mermaidSource });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Error:');
      expect('isError' in result).toBe(true);
      expect((result as any).isError).toBe(true);
    });
  });

  describe('createMermaidServer', () => {
    it('正しくMCPサーバーを作成する', () => {
      const server = createMermaidServer();

      expect(server).toBeDefined();
      // McpServerオブジェクトの構造を確認（nameとversionは内部プロパティの場合がある）
      expect(typeof server.connect).toBe('function');
      expect(typeof server.tool).toBe('function');
    });
  });
});