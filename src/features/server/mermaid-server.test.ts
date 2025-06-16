import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { classDiagramTool, erDiagramTool, createMermaidServer } from './mermaid-server.js';
import type { MermaidParserError } from './mermaid-server.js';

describe('MermaidServer', () => {
  describe('classDiagramTool', () => {
    const validClassDiagram = `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal : +int age
    Animal : +String gender
    Duck : +String beakColor
    Duck : +swim()
    Fish : -int sizeInFeet
    Fish : -canEat()`;

    it('正常なクラス図を解析できる', async () => {
      const result = await classDiagramTool({ mermaidSource: validClassDiagram });
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { content } = result.value;
        expect(content).toHaveLength(1);
        expect(content[0].type).toBe('text');
        
        const parsed = JSON.parse(content[0].text);
        expect(parsed.classes).toHaveLength(3);
        expect(parsed.relationships).toHaveLength(2);
      }
    });

    it('無効な構文の場合はエラーを返す', async () => {
      const invalidDiagram = 'invalid syntax';
      const result = await classDiagramTool({ mermaidSource: invalidDiagram });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_SYNTAX');
        expect(result.error.message).toContain('Invalid Mermaid syntax');
      }
    });

    it('空の入力の場合はバリデーションエラーを返す', async () => {
      const result = await classDiagramTool({ mermaidSource: '' });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('VALIDATION_ERROR');
      }
    });

    it('ロガーが提供された場合はログを出力する', async () => {
      const mockLogger = vi.fn();
      await classDiagramTool(
        { mermaidSource: validClassDiagram },
        { logger: mockLogger }
      );
      
      expect(mockLogger).toHaveBeenCalled();
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('classDiagramTool called with source length:'),
        expect.any(Number)
      );
    });
  });

  describe('erDiagramTool', () => {
    const validERDiagram = `erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string name
        string custNumber
        string sector
    }
    ORDER ||--|{ LINE-ITEM : contains
    ORDER {
        int orderNumber PK
        string deliveryAddress
    }
    LINE-ITEM {
        string productCode
        int quantity
        float pricePerUnit
    }`;

    it('正常なER図を解析できる', async () => {
      const result = await erDiagramTool({ mermaidSource: validERDiagram });
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { content } = result.value;
        expect(content).toHaveLength(1);
        expect(content[0].type).toBe('text');
        
        const parsed = JSON.parse(content[0].text);
        expect(parsed.entities).toHaveLength(3);
        expect(parsed.relationships).toHaveLength(2);
        
        // エンティティの詳細確認
        const customer = parsed.entities.find((e: any) => e.name === 'CUSTOMER');
        expect(customer).toBeDefined();
        // ER図パーサーはmembersまたはattributesを使う
        const customerAttrs = customer.members || customer.attributes;
        expect(customerAttrs).toHaveLength(3);
        
        const order = parsed.entities.find((e: any) => e.name === 'ORDER');
        expect(order).toBeDefined();
        const orderAttrs = order.members || order.attributes;
        expect(orderAttrs).toBeDefined();
        expect(orderAttrs).toHaveLength(2);
        
        // PKを持つ属性の確認
        const orderNumber = orderAttrs.find((m: any) => m.name === 'orderNumber');
        expect(orderNumber).toBeDefined();
        expect(orderNumber.keys).toContain('PK');
      }
    });

    it('無効な構文の場合はエラーを返す', async () => {
      const invalidDiagram = 'invalid er diagram';
      const result = await erDiagramTool({ mermaidSource: invalidDiagram });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_SYNTAX');
        expect(result.error.message).toContain("Invalid ER diagram: missing 'erDiagram' keyword");
      }
    });

    it('空の入力の場合はバリデーションエラーを返す', async () => {
      const result = await erDiagramTool({ mermaidSource: '' });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('VALIDATION_ERROR');
      }
    });

    it('自然言語形式のリレーションシップを解析できる', async () => {
      const naturalLanguageERDiagram = `erDiagram
      MANUFACTURER only one to zero or more CAR : makes
      CAR {
          string registrationNumber PK
          string model
          string make
      }
      MANUFACTURER {
          string name
          string country
      }`;
      
      const result = await erDiagramTool({ mermaidSource: naturalLanguageERDiagram });
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsed = JSON.parse(result.value.content[0].text);
        expect(parsed.relationships).toHaveLength(1);
        expect(parsed.relationships[0].label).toBe('makes');
        expect(parsed.relationships[0].cardinality).toBeDefined();
        expect(parsed.relationships[0].cardinality.from).toBe('exactly one');
        expect(parsed.relationships[0].cardinality.to).toBe('zero or more');
      }
    });

    it('パースエラーの場合は詳細なエラー情報を返す', async () => {
      const invalidERDiagram = `erDiagram
      INVALID {
        invalid syntax here
      }
      ANOTHER-ENTITY`;
      
      const result = await erDiagramTool({ mermaidSource: invalidERDiagram });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PARSE_ERROR');
        expect(result.error.message).toContain('Invalid syntax');
      }
    });

    it('ロガーが提供された場合はログを出力する', async () => {
      const mockLogger = vi.fn();
      await erDiagramTool(
        { mermaidSource: validERDiagram },
        { logger: mockLogger }
      );
      
      expect(mockLogger).toHaveBeenCalled();
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('erDiagramTool called with source length:'),
        expect.any(Number)
      );
    });
  });

  describe('createMermaidServer', () => {
    it('MCPサーバーインスタンスを作成できる', () => {
      const server = createMermaidServer();
      
      expect(server).toBeDefined();
      expect(server).toHaveProperty('tool');
    });
  });
});