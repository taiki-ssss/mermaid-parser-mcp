import { describe, it, expect } from "vitest";
import { parseERDiagram } from "./er-diagram-parser.js";
import { RelationshipType } from "../../../entities/er-diagram/index.js";

describe("ER Diagram Parser - Reference Test Cases", () => {
  describe("Test Case 1: YAML frontmatter support", () => {
    it("should parse ER diagram with YAML frontmatter", () => {
      const input = `---
title: Order example
---
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`;

      const result = parseERDiagram(input);
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const data = result.value;
        
        // エンティティの確認
        expect(data.entities).toHaveLength(4);
        expect(data.entities.map(e => e.name)).toContain("CUSTOMER");
        expect(data.entities.map(e => e.name)).toContain("ORDER");
        expect(data.entities.map(e => e.name)).toContain("LINE-ITEM");
        expect(data.entities.map(e => e.name)).toContain("DELIVERY-ADDRESS");
        
        // リレーションシップの確認
        expect(data.relationships).toHaveLength(3);
        
        // CUSTOMER to ORDER
        const rel1 = data.relationships.find(r => r.from === "CUSTOMER" && r.to === "ORDER");
        expect(rel1).toBeDefined();
        expect(rel1?.type).toBe(RelationshipType.ONE_TO_MANY);
        expect(rel1?.label).toBe("places");
        expect(rel1?.cardinality).toEqual({ from: "exactly one", to: "zero or more" });
        
        // ORDER to LINE-ITEM
        const rel2 = data.relationships.find(r => r.from === "ORDER" && r.to === "LINE-ITEM");
        expect(rel2).toBeDefined();
        expect(rel2?.type).toBe(RelationshipType.ONE_TO_MANY);
        expect(rel2?.label).toBe("contains");
        expect(rel2?.cardinality).toEqual({ from: "exactly one", to: "one or more" });
        
        // CUSTOMER to DELIVERY-ADDRESS (dotted line)
        const rel3 = data.relationships.find(r => r.from === "CUSTOMER" && r.to === "DELIVERY-ADDRESS");
        expect(rel3).toBeDefined();
        expect(rel3?.type).toBe(RelationshipType.MANY_TO_MANY);
        expect(rel3?.label).toBe("uses");
        expect(rel3?.cardinality).toEqual({ from: "one or more", to: "one or more" });
      }
    });
  });

  describe("Test Case 3: Dotted line relationships", () => {
    it("should parse ER diagram with dotted line relationships", () => {
      const input = `erDiagram
    CAR ||--o{ NAMED-DRIVER : allows
    PERSON }o..o{ NAMED-DRIVER : is`;

      const result = parseERDiagram(input);
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const data = result.value;
        
        // エンティティの確認
        expect(data.entities).toHaveLength(3);
        expect(data.entities.map(e => e.name)).toContain("CAR");
        expect(data.entities.map(e => e.name)).toContain("PERSON");
        expect(data.entities.map(e => e.name)).toContain("NAMED-DRIVER");
        
        // リレーションシップの確認
        expect(data.relationships).toHaveLength(2);
        
        // CAR to NAMED-DRIVER (solid line)
        const rel1 = data.relationships.find(r => r.from === "CAR" && r.to === "NAMED-DRIVER");
        expect(rel1).toBeDefined();
        expect(rel1?.type).toBe(RelationshipType.ONE_TO_MANY);
        expect(rel1?.label).toBe("allows");
        expect(rel1?.cardinality).toEqual({ from: "exactly one", to: "zero or more" });
        
        // PERSON to NAMED-DRIVER (dotted line)
        const rel2 = data.relationships.find(r => r.from === "PERSON" && r.to === "NAMED-DRIVER");
        expect(rel2).toBeDefined();
        expect(rel2?.type).toBe(RelationshipType.MANY_TO_MANY);
        expect(rel2?.label).toBe("is");
        expect(rel2?.cardinality).toEqual({ from: "zero or more", to: "zero or more" });
      }
    });
  });

  describe("Test Case 4: Natural language cardinality", () => {
    it("should parse ER diagram with natural language cardinality", () => {
      const input = `erDiagram
    CAR 1 to zero or more NAMED-DRIVER : allows
    PERSON many(0) optionally to 0+ NAMED-DRIVER : is`;

      const result = parseERDiagram(input);
      
      if (result.isErr()) {
        console.log("Error:", result.error);
      }
      
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const data = result.value;
        
        // エンティティの確認
        expect(data.entities).toHaveLength(3);
        expect(data.entities.map(e => e.name)).toContain("CAR");
        expect(data.entities.map(e => e.name)).toContain("PERSON");
        expect(data.entities.map(e => e.name)).toContain("NAMED-DRIVER");
        
        // リレーションシップの確認（自然言語形式がサポートされている）
        expect(data.relationships).toHaveLength(2);
        
        // CAR to NAMED-DRIVER
        expect(data.relationships[0]).toEqual({
          from: "CAR",
          to: "NAMED-DRIVER",
          type: RelationshipType.ONE_TO_ZERO_OR_MANY,
          label: "allows",
          cardinality: {
            from: "exactly one",
            to: "zero or more"
          }
        });
        
        // PERSON to NAMED-DRIVER  
        expect(data.relationships[1]).toEqual({
          from: "PERSON",
          to: "NAMED-DRIVER",
          type: RelationshipType.MANY_TO_MANY,
          label: "is",
          cardinality: {
            from: "zero or more",
            to: "zero or more"
          }
        });
      }
    });
  });
});