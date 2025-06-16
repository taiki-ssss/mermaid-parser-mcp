import { describe, it, expect } from 'vitest';
import { parseMermaidClassDiagram } from '../parser.js';

describe('Mermaid Class Diagram Parser', () => {
  describe('基本クラス定義パース', () => {
    it('プロパティとメソッドを含む基本クラスをパースできる', () => {
      const mermaidSource = `
        classDiagram
        class BankAccount {
          +String owner
          +BigDecimal balance
          +deposit(amount)
          +withdrawal(amount)
        }
      `;

      const result = parseMermaidClassDiagram(mermaidSource);

      expect(result.classes).toHaveLength(1);
      
      const bankAccount = result.classes[0];
      expect(bankAccount.name).toBe('BankAccount');
      expect(bankAccount.members).toHaveLength(4);
      
      // プロパティの検証
      expect(bankAccount.members[0]).toEqual({
        name: 'owner',
        type: 'property',
        visibility: 'public',
        dataType: 'String'
      });
      
      expect(bankAccount.members[1]).toEqual({
        name: 'balance',
        type: 'property', 
        visibility: 'public',
        dataType: 'BigDecimal'
      });
      
      // メソッドの検証
      expect(bankAccount.members[2]).toEqual({
        name: 'deposit',
        type: 'method',
        visibility: 'public',
        parameters: [{ name: 'amount' }]
      });
      
      expect(bankAccount.members[3]).toEqual({
        name: 'withdrawal',
        type: 'method',
        visibility: 'public',
        parameters: [{ name: 'amount' }]
      });
      
      expect(result.relationships).toHaveLength(0);
    });

    it('可視性記号を正しく解析できる', () => {
      const mermaidSource = `
        classDiagram
        class TestClass {
          +String publicProp
          -String privateProp
          #String protectedProp
          ~String packageProp
        }
      `;

      const result = parseMermaidClassDiagram(mermaidSource);
      const testClass = result.classes[0];
      
      expect(testClass.members[0].visibility).toBe('public');
      expect(testClass.members[1].visibility).toBe('private');
      expect(testClass.members[2].visibility).toBe('protected');
      expect(testClass.members[3].visibility).toBe('package');
    });

    it('最小構成のクラス（メンバーなし）をパースできる', () => {
      const mermaidSource = `
        classDiagram
        class EmptyClass
      `;

      const result = parseMermaidClassDiagram(mermaidSource);
      
      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe('EmptyClass');
      expect(result.classes[0].members).toHaveLength(0);
    });
  });

  describe('継承関係パース', () => {
    it('基本的な継承関係をパースできる', () => {
      const mermaidSource = `
        classDiagram
        class Animal {
          +String name
          +eat()
        }
        class Dog {
          +bark()
        }
        Animal <|-- Dog
      `;

      const result = parseMermaidClassDiagram(mermaidSource);

      expect(result.classes).toHaveLength(2);
      expect(result.relationships).toHaveLength(1);
      
      const relationship = result.relationships[0];
      expect(relationship).toEqual({
        from: 'Animal',
        to: 'Dog',
        type: 'inheritance'
      });
    });

    it('複数の継承関係をパースできる', () => {
      const mermaidSource = `
        classDiagram
        class Animal
        class Dog
        class Cat
        Animal <|-- Dog
        Animal <|-- Cat
      `;

      const result = parseMermaidClassDiagram(mermaidSource);

      expect(result.relationships).toHaveLength(2);
      expect(result.relationships[0]).toEqual({
        from: 'Animal',
        to: 'Dog',
        type: 'inheritance'
      });
      expect(result.relationships[1]).toEqual({
        from: 'Animal',
        to: 'Cat',
        type: 'inheritance'
      });
    });

    it('関係性による暗黙的なクラス定義をサポートできる', () => {
      const mermaidSource = `
        classDiagram
        Vehicle <|-- Car
      `;

      const result = parseMermaidClassDiagram(mermaidSource);

      expect(result.classes).toHaveLength(2);
      expect(result.classes.find((c: any) => c.name === 'Vehicle')).toBeDefined();
      expect(result.classes.find((c: any) => c.name === 'Car')).toBeDefined();
      expect(result.relationships[0]).toEqual({
        from: 'Vehicle',
        to: 'Car',
        type: 'inheritance'
      });
    });
  });

  describe('全関係性パース', () => {
    it('8種類の関係性すべてをパースできる', () => {
      const mermaidSource = `
        classDiagram
        ClassA <|-- ClassB
        ClassC *-- ClassD
        ClassE o-- ClassF
        ClassG --> ClassH
        ClassI -- ClassJ
        ClassK ..> ClassL
        ClassM ..|> ClassN
        ClassO .. ClassP
      `;

      const result = parseMermaidClassDiagram(mermaidSource);

      expect(result.relationships).toHaveLength(8);
      
      expect(result.relationships[0]).toEqual({
        from: 'ClassA',
        to: 'ClassB',
        type: 'inheritance'
      });
      
      expect(result.relationships[1]).toEqual({
        from: 'ClassC',
        to: 'ClassD',
        type: 'composition'
      });
      
      expect(result.relationships[2]).toEqual({
        from: 'ClassE',
        to: 'ClassF',
        type: 'aggregation'
      });
      
      expect(result.relationships[3]).toEqual({
        from: 'ClassG',
        to: 'ClassH',
        type: 'association'
      });
      
      expect(result.relationships[4]).toEqual({
        from: 'ClassI',
        to: 'ClassJ',
        type: 'link_solid'
      });
      
      expect(result.relationships[5]).toEqual({
        from: 'ClassK',
        to: 'ClassL',
        type: 'dependency'
      });
      
      expect(result.relationships[6]).toEqual({
        from: 'ClassM',
        to: 'ClassN',
        type: 'realization'
      });
      
      expect(result.relationships[7]).toEqual({
        from: 'ClassO',
        to: 'ClassP',
        type: 'link_dashed'
      });
    });

    it('関係性ラベルと多重度をパースできる', () => {
      const mermaidSource = `
        classDiagram
        Customer "1" --> "*" Order : places
        Order "1" --> "1..*" OrderItem : contains
      `;

      const result = parseMermaidClassDiagram(mermaidSource);

      expect(result.relationships).toHaveLength(2);
      
      expect(result.relationships[0]).toEqual({
        from: 'Customer',
        to: 'Order',
        type: 'association',
        label: 'places',
        multiplicity: {
          from: '1',
          to: '*'
        }
      });
      
      expect(result.relationships[1]).toEqual({
        from: 'Order',
        to: 'OrderItem',
        type: 'association',
        label: 'contains',
        multiplicity: {
          from: '1',
          to: '1..*'
        }
      });
    });
  });

  describe('複合ケース', () => {
    it('クラス定義と関係性を組み合わせた複雑な図をパースできる', () => {
      const mermaidSource = `
        classDiagram
        class Animal {
          +String name
          +int age
          +eat()
          +sleep()
        }
        class Dog {
          +String breed
          +bark()
        }
        class Cat {
          +bool isIndoor
          +meow()
        }
        Animal <|-- Dog
        Animal <|-- Cat
        Dog --> Cat : chases
      `;

      const result = parseMermaidClassDiagram(mermaidSource);

      expect(result.classes).toHaveLength(3);
      expect(result.relationships).toHaveLength(3);
      
      // Animalクラスの検証
      const animal = result.classes.find((c: any) => c.name === 'Animal');
      expect(animal).toBeDefined();
      expect(animal!.members).toHaveLength(4);
      
      // 関係性の検証
      expect(result.relationships.find((r: any) => r.from === 'Animal' && r.to === 'Dog' && r.type === 'inheritance')).toBeDefined();
      expect(result.relationships.find((r: any) => r.from === 'Animal' && r.to === 'Cat' && r.type === 'inheritance')).toBeDefined();
      expect(result.relationships.find((r: any) => r.from === 'Dog' && r.to === 'Cat' && r.type === 'association' && r.label === 'chases')).toBeDefined();
    });
  });

  describe('異常系テスト', () => {
    it('classDiagramで始まらない場合エラーを投げる', () => {
      const mermaidSource = `
        invalidDiagram
        class TestClass
      `;

      expect(() => parseMermaidClassDiagram(mermaidSource))
        .toThrow('Invalid Mermaid syntax: must start with classDiagram');
    });

    it('無効なクラス定義でエラーを投げる', () => {
      const mermaidSource = `
        classDiagram
        class 123invalid
      `;

      expect(() => parseMermaidClassDiagram(mermaidSource))
        .toThrow('Invalid class definition');
    });

    it('無効なメンバー定義でエラーを投げる', () => {
      const mermaidSource = `
        classDiagram
        class TestClass {
          @@invalid@@member@@
        }
      `;

      expect(() => parseMermaidClassDiagram(mermaidSource))
        .toThrow('Invalid property definition');
    });

  });

  describe('ユーティリティ関数テスト', () => {
    it('startsWith関数が正しく動作する', async () => {
      const { startsWith } = await import('../utils.js');
      
      expect(startsWith('Hello World', 'hello')).toBe(true);
      expect(startsWith('Hello World', 'world')).toBe(false);
      expect(startsWith('', 'test')).toBe(false);
    });

    it('getMemberType関数が正しく動作する', async () => {
      const { getMemberType } = await import('../utils.js');
      
      expect(getMemberType('method()')).toBe('method');
      expect(getMemberType('property')).toBe('property');
      expect(getMemberType('')).toBe('property');
    });

    it('splitLines関数が正しく動作する', async () => {
      const { splitLines } = await import('../utils.js');
      
      expect(splitLines('line1\nline2\n\nline3')).toEqual(['line1', 'line2', 'line3']);
      expect(splitLines('')).toEqual([]);
      expect(splitLines('   ')).toEqual([]);
    });

    it('parseVisibility関数が正しく動作する', async () => {
      const { parseVisibility } = await import('../utils.js');
      
      expect(parseVisibility('+')).toBe('public');
      expect(parseVisibility('-')).toBe('private');
      expect(parseVisibility('#')).toBe('protected');
      expect(parseVisibility('~')).toBe('package');
      expect(parseVisibility('')).toBe('public');
      expect(parseVisibility('?')).toBe('public');
    });

    it('関係性の全パターンを個別にテスト', () => {
      // コンポジション
      const comp = `classDiagram\nClass1 *-- Class2`;
      const compResult = parseMermaidClassDiagram(comp);
      expect(compResult.relationships[0].type).toBe('composition');
      
      // 集約
      const agg = `classDiagram\nClass1 o-- Class2`;
      const aggResult = parseMermaidClassDiagram(agg);
      expect(aggResult.relationships[0].type).toBe('aggregation');
      
      // 依存
      const dep = `classDiagram\nClass1 ..> Class2`;
      const depResult = parseMermaidClassDiagram(dep);
      expect(depResult.relationships[0].type).toBe('dependency');
      
      // 実現
      const real = `classDiagram\nClass1 ..|> Class2`;
      const realResult = parseMermaidClassDiagram(real);
      expect(realResult.relationships[0].type).toBe('realization');
      
      // リンク実線
      const linkSolid = `classDiagram\nClass1 -- Class2`;
      const linkSolidResult = parseMermaidClassDiagram(linkSolid);
      expect(linkSolidResult.relationships[0].type).toBe('link_solid');
      
      // リンク破線
      const linkDashed = `classDiagram\nClass1 .. Class2`;
      const linkDashedResult = parseMermaidClassDiagram(linkDashed);
      expect(linkDashedResult.relationships[0].type).toBe('link_dashed');
    });
  });
});