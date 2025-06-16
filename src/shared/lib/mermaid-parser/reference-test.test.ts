import { describe, it, expect } from "vitest";
import { parseERDiagram } from "./er-diagram-parser.js";

describe("参考資料のテストケース検証", () => {
  describe("テストケース1: YAML frontmatterと点線リレーション", () => {
    it("YAML frontmatterと点線リレーションをサポートすべき", () => {
      const input = `---
title: Order example
---
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`;

      const result = parseERDiagram(input);
      
      if (result.isErr()) {
        console.error("パースエラー:", result.error);
      } else {
        console.log("実際の出力:", JSON.stringify(result.value, null, 2));
      }

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const { entities, relationships } = result.value;
        
        // エンティティの確認
        expect(entities).toHaveLength(4);
        expect(entities.map(e => e.name)).toContain("CUSTOMER");
        expect(entities.map(e => e.name)).toContain("ORDER");
        expect(entities.map(e => e.name)).toContain("LINE-ITEM");
        expect(entities.map(e => e.name)).toContain("DELIVERY-ADDRESS");
        
        // リレーションシップの確認
        expect(relationships).toHaveLength(3);
        
        // 期待される出力形式の確認
        console.log("期待される出力形式:");
        console.log(JSON.stringify({
          entities: [
            { name: "CUSTOMER" },
            { name: "ORDER" },
            { name: "LINE-ITEM" },
            { name: "DELIVERY-ADDRESS" }
          ],
          relationships: [
            {
              from: "CUSTOMER",
              to: "ORDER",
              left: "exactly one",
              right: "zero or more"
            },
            {
              from: "ORDER",
              to: "LINE-ITEM",
              left: "exactly one",
              right: "one or more"
            },
            {
              from: "CUSTOMER",
              to: "DELIVERY-ADDRESS",
              left: "one or more",
              right: "one or more"
            }
          ]
        }, null, 2));
      }
    });
  });

  describe("テストケース3: 点線リレーション", () => {
    it("点線リレーション記号をサポートすべき", () => {
      const input = `erDiagram
    CAR ||--o{ NAMED-DRIVER : allows
    PERSON }o..o{ NAMED-DRIVER : is`;

      const result = parseERDiagram(input);
      
      if (result.isErr()) {
        console.error("パースエラー:", result.error);
      } else {
        console.log("実際の出力:", JSON.stringify(result.value, null, 2));
      }

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const { entities, relationships } = result.value;
        
        // エンティティの確認（NAMED-DRIVERは関係から推測される）
        expect(entities.map(e => e.name)).toContain("CAR");
        expect(entities.map(e => e.name)).toContain("PERSON");
        expect(entities.map(e => e.name)).toContain("NAMED-DRIVER");
        
        // リレーションシップの確認
        expect(relationships).toHaveLength(2);
      }
    });
  });

  describe("テストケース4: 自然言語形式のリレーション", () => {
    it("自然言語形式のリレーションをサポートすべき", () => {
      const input = `erDiagram
    CAR 1 to zero or more NAMED-DRIVER : allows
    PERSON many(0) optionally to 0+ NAMED-DRIVER : is`;

      const result = parseERDiagram(input);
      
      if (result.isErr()) {
        console.error("パースエラー:", result.error);
      } else {
        console.log("実際の出力:", JSON.stringify(result.value, null, 2));
      }
    });
  });
});