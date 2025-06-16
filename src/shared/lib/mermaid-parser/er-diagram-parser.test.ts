import { describe, it, expect } from "vitest";
import { parseERDiagram } from "./er-diagram-parser.js";
import { RelationshipType, type Entity } from "../../../entities/er-diagram/index.js";

describe("ER図パーサー", () => {
  describe("基本的なリレーションシップの解析", () => {
    it("1対多のリレーションシップを正しく解析できること", () => {
      const input = `
erDiagram
    CUSTOMER ||--o{ ORDER : places
      `;

      const result = parseERDiagram(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { entities, relationships } = result.value;

        // エンティティの確認
        expect(entities).toHaveLength(2);
        expect(entities[0].name).toBe("CUSTOMER");
        expect(entities[1].name).toBe("ORDER");

        // リレーションシップの確認
        expect(relationships).toHaveLength(1);
        expect(relationships[0]).toEqual({
          from: "CUSTOMER",
          to: "ORDER",
          type: RelationshipType.ONE_TO_MANY,
          label: "places",
          cardinality: {
            from: "exactly one",
            to: "zero or more",
          },
        });
      }
    });

    it("多対多のリレーションシップを正しく解析できること", () => {
      const input = `
erDiagram
    STUDENT }o--o{ COURSE : enrolls
      `;

      const result = parseERDiagram(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { entities, relationships } = result.value;

        // エンティティの確認
        expect(entities).toHaveLength(2);
        expect(entities[0].name).toBe("STUDENT");
        expect(entities[1].name).toBe("COURSE");

        // リレーションシップの確認
        expect(relationships).toHaveLength(1);
        expect(relationships[0]).toEqual({
          from: "STUDENT",
          to: "COURSE",
          type: RelationshipType.MANY_TO_MANY,
          label: "enrolls",
          cardinality: {
            from: "zero or more",
            to: "zero or more",
          },
        });
      }
    });

    it("1対1のリレーションシップを正しく解析できること", () => {
      const input = `
erDiagram
    USER ||--|| PROFILE : has
      `;

      const result = parseERDiagram(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { entities, relationships } = result.value;

        // エンティティの確認
        expect(entities).toHaveLength(2);
        expect(entities[0].name).toBe("USER");
        expect(entities[1].name).toBe("PROFILE");

        // リレーションシップの確認
        expect(relationships).toHaveLength(1);
        expect(relationships[0]).toEqual({
          from: "USER",
          to: "PROFILE",
          type: RelationshipType.ONE_TO_ONE,
          label: "has",
          cardinality: {
            from: "exactly one",
            to: "exactly one",
          },
        });
      }
    });

    it("ラベルなしのリレーションシップを正しく解析できること", () => {
      const input = `
erDiagram
    DEPARTMENT ||--o{ EMPLOYEE
      `;

      const result = parseERDiagram(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { entities, relationships } = result.value;

        // エンティティの確認
        expect(entities).toHaveLength(2);
        expect(entities[0].name).toBe("DEPARTMENT");
        expect(entities[1].name).toBe("EMPLOYEE");

        // リレーションシップの確認
        expect(relationships).toHaveLength(1);
        expect(relationships[0]).toEqual({
          from: "DEPARTMENT",
          to: "EMPLOYEE",
          type: RelationshipType.ONE_TO_MANY,
          label: undefined,
          cardinality: {
            from: "exactly one",
            to: "zero or more",
          },
        });
      }
    });

    it("複数のリレーションシップを正しく解析できること", () => {
      const input = `
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER-DETAIL : contains
    PRODUCT ||--o{ ORDER-DETAIL : "is ordered in"
      `;

      const result = parseERDiagram(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { entities, relationships } = result.value;

        // エンティティの確認
        expect(entities).toHaveLength(4);
        expect(entities.map((e: Entity) => e.name)).toEqual([
          "CUSTOMER",
          "ORDER",
          "ORDER-DETAIL",
          "PRODUCT",
        ]);

        // リレーションシップの確認
        expect(relationships).toHaveLength(3);
        expect(relationships[0]).toEqual({
          from: "CUSTOMER",
          to: "ORDER",
          type: RelationshipType.ONE_TO_MANY,
          label: "places",
          cardinality: {
            from: "exactly one",
            to: "zero or more",
          },
        });
        expect(relationships[1]).toEqual({
          from: "ORDER",
          to: "ORDER-DETAIL",
          type: RelationshipType.ONE_TO_MANY,
          label: "contains",
          cardinality: {
            from: "exactly one",
            to: "one or more",
          },
        });
        expect(relationships[2]).toEqual({
          from: "PRODUCT",
          to: "ORDER-DETAIL",
          type: RelationshipType.ONE_TO_MANY,
          label: "is ordered in",
          cardinality: {
            from: "exactly one",
            to: "zero or more",
          },
        });
      }
    });
  });

  describe("エンティティ属性の解析", () => {
    it("エンティティ属性付きの定義を正しく解析できること", () => {
      const input = `
erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string name
        string custNumber
        string sector
    }
    ORDER ||--|{ LINE-ITEM : contains
    ORDER {
        int orderNumber
        string deliveryAddress
    }
    LINE-ITEM {
        string productCode
        int quantity
        float pricePerUnit
    }
      `;

      const result = parseERDiagram(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { entities, relationships } = result.value;

        // エンティティの確認
        expect(entities).toHaveLength(3);
        expect(entities[0].name).toBe("CUSTOMER");
        expect(entities[0].members).toEqual([
          { name: "name", dataType: "string" },
          { name: "custNumber", dataType: "string" },
          { name: "sector", dataType: "string" },
        ]);

        expect(entities[1].name).toBe("ORDER");
        expect(entities[1].members).toEqual([
          { name: "orderNumber", dataType: "int" },
          { name: "deliveryAddress", dataType: "string" },
        ]);

        expect(entities[2].name).toBe("LINE-ITEM");
        expect(entities[2].members).toEqual([
          { name: "productCode", dataType: "string" },
          { name: "quantity", dataType: "int" },
          { name: "pricePerUnit", dataType: "float" },
        ]);

        // リレーションシップの確認
        expect(relationships).toHaveLength(2);
      }
    });

    it("複雑な属性定義を正しく解析できること", () => {
      const input = `
erDiagram
    CAR ||--o{ NAMED-DRIVER : allows
    CAR {
        string registrationNumber PK
        string make
        string model
        string[] parts
    }
    PERSON ||--o{ NAMED-DRIVER : is
    PERSON {
        string driversLicense PK "The license #"
        string(99) firstName "Only 99 characters are allowed"
        string lastName
        string phone UK
        int age
    }
    NAMED-DRIVER {
        string carRegistrationNumber PK, FK
        string driverLicence PK, FK
    }
    MANUFACTURER only one to zero or more CAR : makes
      `;

      const result = parseERDiagram(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { entities, relationships } = result.value;

        // エンティティの確認
        expect(entities).toHaveLength(4);
        
        // エンティティ名をソートしてテスト
        const entitiesByName = entities.reduce((acc: Record<string, Entity>, entity: Entity) => {
          acc[entity.name] = entity;
          return acc;
        }, {} as Record<string, Entity>);
        
        // CARエンティティ
        expect(entitiesByName.CAR).toBeDefined();
        expect(entitiesByName.CAR.members).toEqual([
          { name: "registrationNumber", dataType: "string", keys: ["PK"] },
          { name: "make", dataType: "string" },
          { name: "model", dataType: "string" },
          { name: "parts", dataType: "string[]" },
        ]);

        // PERSONエンティティ
        expect(entitiesByName.PERSON).toBeDefined();
        expect(entitiesByName.PERSON.members).toEqual([
          { name: "driversLicense", dataType: "string", keys: ["PK"], comment: "The license #" },
          { name: "firstName", dataType: "string", length: 99, comment: "Only 99 characters are allowed" },
          { name: "lastName", dataType: "string" },
          { name: "phone", dataType: "string", keys: ["UK"] },
          { name: "age", dataType: "int" },
        ]);

        // NAMED-DRIVERエンティティ
        expect(entitiesByName["NAMED-DRIVER"]).toBeDefined();
        expect(entitiesByName["NAMED-DRIVER"].members).toEqual([
          { name: "carRegistrationNumber", dataType: "string", keys: ["PK", "FK"] },
          { name: "driverLicence", dataType: "string", keys: ["PK", "FK"] },
        ]);

        // MANUFACTURERエンティティ
        expect(entitiesByName.MANUFACTURER).toBeDefined();
        expect(entitiesByName.MANUFACTURER.members).toBeUndefined();

        // リレーションシップの確認
        expect(relationships).toHaveLength(3);
      }
    });
  });

  describe("カーディナリティ解析", () => {
    it("全てのカーディナリティ記号を正しく解析できること", () => {
      const testCases = [
        // exactly one to exactly one
        { symbol: "||--||" },
        // exactly one to zero or more 
        { symbol: "||--o{" },
        // exactly one to one or more
        { symbol: "||--|{" },
        // zero or more to exactly one
        { symbol: "}o--||" },
        // one or more to exactly one
        { symbol: "}|--||" },
        // zero or more to zero or more
        { symbol: "}o--o{" },
        // one or more to one or more
        { symbol: "}|--|{" },
        // zero or one to exactly one
        { symbol: "|o--||" },
        // zero or one to zero or more
        { symbol: "|o--o{" },
        // zero or one to one or more
        { symbol: "|o--|{" },
        // exactly one to zero or one
        { symbol: "||--o|" },
        // zero or one to zero or one
        { symbol: "|o--o|" },
        // one or more to zero or one
        { symbol: "|{--o|" },
        // zero or more to zero or one
        { symbol: "o{--o|" },
      ];

      for (const { symbol } of testCases) {
        const input = `
erDiagram
    ENTITY1 ${symbol} ENTITY2 : relates
        `;

        const result = parseERDiagram(input);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const { relationships } = result.value;
          expect(relationships).toHaveLength(1);
          const rel = relationships[0];
          expect(rel.from).toBe("ENTITY1");
          expect(rel.to).toBe("ENTITY2");
          expect(rel.label).toBe("relates");
          // カーディナリティ情報が含まれることを確認
          expect(rel.cardinality).toBeDefined();
          expect(rel.cardinality?.from).toBeDefined();
          expect(rel.cardinality?.to).toBeDefined();
        }
      }
    });

    it("カーディナリティが読みやすい形式で返されること", () => {
      const testCases = [
        { 
          symbol: "||--||" , 
          expectedFrom: "exactly one",
          expectedTo: "exactly one"
        },
        { 
          symbol: "||--o{" , 
          expectedFrom: "exactly one",
          expectedTo: "zero or more"
        },
        { 
          symbol: "||--|{" , 
          expectedFrom: "exactly one",
          expectedTo: "one or more"
        },
        { 
          symbol: "}o--||" , 
          expectedFrom: "zero or more",
          expectedTo: "exactly one"
        },
        { 
          symbol: "|o--o|" , 
          expectedFrom: "zero or one",
          expectedTo: "zero or one"
        },
      ];

      for (const { symbol, expectedFrom, expectedTo } of testCases) {
        const input = `
erDiagram
    ENTITY1 ${symbol} ENTITY2 : relates
        `;

        const result = parseERDiagram(input);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const { relationships } = result.value;
          expect(relationships).toHaveLength(1);
          const rel = relationships[0];
          expect(rel.cardinality?.from).toBe(expectedFrom);
          expect(rel.cardinality?.to).toBe(expectedTo);
        }
      }
    });
  });

  describe("エッジケース", () => {
    it("自然言語形式の1対1リレーションシップを解析できること", () => {
      const input = `
erDiagram
    USER one to one PROFILE : has
      `;

      const result = parseERDiagram(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { entities, relationships } = result.value;

        // エンティティの確認
        expect(entities).toHaveLength(2);
        expect(entities[0].name).toBe("USER");
        expect(entities[1].name).toBe("PROFILE");

        // リレーションシップの確認
        expect(relationships).toHaveLength(1);
        expect(relationships[0]).toEqual({
          from: "USER",
          to: "PROFILE",
          type: RelationshipType.ONE_TO_ONE,
          label: "has",
          cardinality: {
            from: "exactly one",
            to: "exactly one",
          },
        });
      }
    });

    it("不正な属性行をスキップできること", () => {
      const input = `
erDiagram
    USER {
        
        string name
    }
      `;

      const result = parseERDiagram(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { entities } = result.value;
        expect(entities).toHaveLength(1);
        expect(entities[0].name).toBe("USER");
        expect(entities[0].members).toEqual([
          { name: "name", dataType: "string" },
        ]);
      }
    });

    it("コメントのない属性を正しく解析できること", () => {
      const input = `
erDiagram
    USER {
        string name
        int age
    }
      `;

      const result = parseERDiagram(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { entities } = result.value;
        expect(entities).toHaveLength(1);
        expect(entities[0].members).toEqual([
          { name: "name", dataType: "string" },
          { name: "age", dataType: "int" },
        ]);
      }
    });

    it("自然言語形式のリレーションシップで未知のパターンはエラーになること", () => {
      const testCases = [
        `
erDiagram
    USER some to some GROUP : belongs
        `,
        `
erDiagram
    USER unknown to unknown GROUP : belongs
        `,
        `
erDiagram
    USER few to few GROUP : belongs
        `,
      ];

      for (const input of testCases) {
        const result = parseERDiagram(input);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.message).toContain("Invalid syntax");
        }
      }
    });

    it("自然言語形式の様々なカーディナリティパターンをサポートできること", () => {
      const testCases = [
        {
          input: `
erDiagram
    ENTITY1 only one to zero or more ENTITY2 : relates
          `,
          expectedFrom: "exactly one",
          expectedTo: "zero or more",
        },
        {
          input: `
erDiagram
    ENTITY1 many to one ENTITY2 : relates
          `,
          expectedFrom: "zero or more",
          expectedTo: "exactly one",
        },
        {
          input: `
erDiagram
    ENTITY1 one or more to one ENTITY2 : relates
          `,
          expectedFrom: "one or more",
          expectedTo: "exactly one",
        },
        {
          input: `
erDiagram
    ENTITY1 zero or one to one ENTITY2 : relates
          `,
          expectedFrom: "zero or one",
          expectedTo: "exactly one",
        },
      ];

      for (const { input, expectedFrom, expectedTo } of testCases) {
        const result = parseERDiagram(input);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const { relationships } = result.value;
          expect(relationships).toHaveLength(1);
          expect(relationships[0].cardinality?.from).toBe(expectedFrom);
          expect(relationships[0].cardinality?.to).toBe(expectedTo);
        }
      }
    });

    it("不正な属性行（名前のない属性）をスキップできること", () => {
      const input = `
erDiagram
    USER {
        string
        int age
    }
      `;

      const result = parseERDiagram(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { entities } = result.value;
        expect(entities).toHaveLength(1);
        expect(entities[0].name).toBe("USER");
        expect(entities[0].members).toEqual([
          { name: "age", dataType: "int" },
        ]);
      }
    });

    it("タイトル付きER図を解析できること", () => {
      const input = `
---
title: Order example
---
erDiagram
    CUSTOMER ||--o{ ORDER : places
      `;

      const result = parseERDiagram(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { entities, relationships } = result.value;
        expect(entities).toHaveLength(2);
        expect(relationships).toHaveLength(1);
      }
    });

    it("テストケース4: 数字と記号を含む自然言語パターンを解析できること", () => {
      const testCases = [
        {
          input: `
erDiagram
    CAR 1 to zero or more NAMED-DRIVER : allows
          `,
          expectedFrom: "exactly one",
          expectedTo: "zero or more",
          expectedType: RelationshipType.ONE_TO_ZERO_OR_MANY,
        },
        {
          input: `
erDiagram
    PERSON many(0) optionally to 0+ NAMED-DRIVER : is
          `,
          expectedFrom: "zero or more",
          expectedTo: "zero or more",
          expectedType: RelationshipType.MANY_TO_MANY,
        },
        {
          input: `
erDiagram
    ENTITY1 1 to 0+ ENTITY2 : relates
          `,
          expectedFrom: "exactly one",
          expectedTo: "zero or more",
          expectedType: RelationshipType.ONE_TO_ZERO_OR_MANY,
        },
        {
          input: `
erDiagram
    ENTITY1 1+ to 1 ENTITY2 : relates
          `,
          expectedFrom: "one or more",
          expectedTo: "exactly one",
          expectedType: RelationshipType.MANY_TO_ONE,
        },
      ];

      for (const { input, expectedFrom, expectedTo, expectedType } of testCases) {
        const result = parseERDiagram(input);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const { relationships } = result.value;
          expect(relationships).toHaveLength(1);
          expect(relationships[0].cardinality?.from).toBe(expectedFrom);
          expect(relationships[0].cardinality?.to).toBe(expectedTo);
          expect(relationships[0].type).toBe(expectedType);
        }
      }
    });
  });

  describe("エラーハンドリング", () => {
    it("不正な入力に対してエラーを返すこと", () => {
      const input = `
erDiagram
    INVALID SYNTAX HERE
      `;

      const result = parseERDiagram(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Invalid");
      }
    });

    it("空の入力に対してエラーを返すこと", () => {
      const input = "";

      const result = parseERDiagram(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Empty");
      }
    });
  });
});