import { describe, it, expect } from 'vitest';
import { parseMermaidClassDiagram } from '../parser.js';
import { ClassDiagramResult } from '../../../../entities/class-diagram/index.js';

describe('公式テストケース検証', () => {
  it('テストケース1: YAML Front Matter、note文、継承関係', () => {
    const input = `---
title: Animal example
---
classDiagram
    note "From Duck till Zebra"
    Animal <|-- Duck
    note for Duck "can fly\ncan swim\ncan dive\ncan help in debugging"
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }`;

    const result = parseMermaidClassDiagram(input);
    
    // Animal クラスの検証
    const animal = result.classes.find(c => c.name === 'Animal');
    expect(animal).toBeDefined();
    expect(animal!.members).toHaveLength(4);
    
    // Duck クラスの検証
    const duck = result.classes.find(c => c.name === 'Duck');
    expect(duck).toBeDefined();
    expect(duck!.members).toHaveLength(3);
    
    // 継承関係の検証
    const inheritances = result.relationships.filter(r => r.type === 'inheritance');
    expect(inheritances).toHaveLength(3);
  });

  it('テストケース2: コロン記法', () => {
    const input = `---
title: Bank example
---
classDiagram
    class BankAccount
    BankAccount : +String owner
    BankAccount : +Bigdecimal balance
    BankAccount : +deposit(amount)
    BankAccount : +withdrawal(amount)`;

    const result = parseMermaidClassDiagram(input);
    
    const bankAccount = result.classes[0];
    expect(bankAccount.name).toBe('BankAccount');
    expect(bankAccount.members).toHaveLength(4);
    
    // パラメータを持つメソッドの検証
    const deposit = bankAccount.members.find(m => m.name === 'deposit');
    expect(deposit!.parameters).toHaveLength(1);
    expect(deposit!.parameters![0]).toEqual({ name: 'amount' });
  });

  it('テストケース3: 波括弧記法', () => {
    const input = `classDiagram
class BankAccount{
    +String owner
    +BigDecimal balance
    +deposit(amount)
    +withdrawal(amount)
}`;

    const result = parseMermaidClassDiagram(input);
    const bankAccount = result.classes[0];
    expect(bankAccount.members).toHaveLength(4);
  });

  it('テストケース4: メソッドの戻り値型', () => {
    const input = `classDiagram
class BankAccount{
    +String owner
    +BigDecimal balance
    +deposit(amount) bool
    +withdrawal(amount) int
}`;

    const result = parseMermaidClassDiagram(input);
    const bankAccount = result.classes[0];
    
    const deposit = bankAccount.members.find(m => m.name === 'deposit');
    expect(deposit!.returnType).toBe('bool');
    
    const withdrawal = bankAccount.members.find(m => m.name === 'withdrawal');
    expect(withdrawal!.returnType).toBe('int');
  });

  it('テストケース5: ジェネリック型', () => {
    const input = `classDiagram
class Square~Shape~{
    int id
    List~int~ position
    setPoints(List~int~ points)
    getPoints() List~int~
}

Square : -List~string~ messages
Square : +setMessages(List~string~ messages)
Square : +getMessages() List~string~
Square : +getDistanceMatrix() List~List~int~~`;

    const result = parseMermaidClassDiagram(input);
    const square = result.classes[0];
    
    expect(square.name).toBe('Square');
    expect(square.genericType).toBe('Shape');
    
    // ジェネリック型の変換確認
    const position = square.members.find(m => m.name === 'position');
    expect(position!.dataType).toBe('List<int>');
    
    // パラメータのジェネリック型
    const setPoints = square.members.find(m => m.name === 'setPoints');
    expect(setPoints!.parameters![0].type).toBe('List<int>');
    
    // 戻り値のジェネリック型
    const getPoints = square.members.find(m => m.name === 'getPoints');
    expect(getPoints!.returnType).toBe('List<int>');
    
    // ネストされたジェネリック型
    const getDistanceMatrix = square.members.find(m => m.name === 'getDistanceMatrix');
    expect(getDistanceMatrix!.returnType).toBe('List<List<int>>');
  });

  it('テストケース6: 名前空間', () => {
    const input = `classDiagram
namespace BaseShapes {
    class Triangle
    class Rectangle {
      double width
      double height
    }
}`;

    const result = parseMermaidClassDiagram(input);
    
    expect(result.namespaces).toBeDefined();
    expect(result.namespaces!).toHaveLength(1);
    expect(result.namespaces![0].name).toBe('BaseShapes');
    expect(result.namespaces![0].classes).toEqual(['Triangle', 'Rectangle']);
    
    const rectangle = result.classes.find(c => c.name === 'Rectangle');
    expect(rectangle!.members).toHaveLength(2);
  });

  it('テストケース7: アノテーション', () => {
    const input = `classDiagram
class Shape{
    <<interface>>
    noOfVertices
    draw()
}
class Color{
    <<enumeration>>
    RED
    BLUE
    GREEN
    WHITE
    BLACK
}`;

    const result = parseMermaidClassDiagram(input);
    
    const shape = result.classes.find(c => c.name === 'Shape');
    expect(shape!.annotations).toEqual(['interface']);
    expect(shape!.members).toHaveLength(2);
    
    const color = result.classes.find(c => c.name === 'Color');
    expect(color!.annotations).toEqual(['enumeration']);
    expect(color!.members).toHaveLength(5);
  });
});