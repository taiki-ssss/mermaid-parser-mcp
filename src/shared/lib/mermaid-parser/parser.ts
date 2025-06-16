import { Result, ok, err } from 'neverthrow';
import { ClassDiagramResult, ClassDefinition, ClassMember, Relationship } from '../../../entities/class-diagram/index.js';
import { MermaidSourceSchema, ClassDiagramResultSchema } from '../../../entities/class-diagram/schema.js';
import { splitLines, startsWith, parseVisibility, getMemberType, removeYamlFrontMatter, removeNotes, convertGenericType, extractGenericType } from './utils.js';

/**
 * MermaidクラスダイアグラムをパースしてJSONに変換
 */
export function parseMermaidClassDiagram(mermaidSource: string): ClassDiagramResult {
  // 入力バリデーション
  const validatedInput = MermaidSourceSchema.parse(mermaidSource);
  
  // 前処理: YAML Front MatterとNote文を除去
  let processedInput = removeYamlFrontMatter(validatedInput);
  processedInput = removeNotes(processedInput);
  
  const lines = splitLines(processedInput);
  
  // classDiagramで始まることを確認
  if (lines.length === 0 || !startsWith(lines[0], 'classDiagram')) {
    throw new Error('Invalid Mermaid syntax: must start with classDiagram');
  }
  
  const result: ClassDiagramResult = {
    classes: [],
    relationships: []
  };
  
  let i = 1; // classDiagram行をスキップ
  
  let currentNamespace: string | undefined = undefined;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (startsWith(line, 'namespace ')) {
      // 名前空間の開始
      const namespaceMatch = line.match(/^namespace\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{?/);
      if (namespaceMatch) {
        currentNamespace = namespaceMatch[1];
        if (!result.namespaces) {
          result.namespaces = [];
        }
        result.namespaces.push({
          name: currentNamespace,
          classes: []
        });
      }
      i++;
    } else if (line === '}' && currentNamespace) {
      // 名前空間の終了
      currentNamespace = undefined;
      i++;
    } else if (startsWith(line, 'class ')) {
      // クラス定義の処理
      const classResult = parseClassDefinition(lines, i);
      
      // 既存のクラスを確認し、存在する場合は置き換える
      const existingClassIndex = result.classes.findIndex(c => c.name === classResult.classDefinition.name);
      if (existingClassIndex >= 0) {
        // 既存のクラスを新しい定義で置き換える
        result.classes[existingClassIndex] = classResult.classDefinition;
      } else {
        // 新しいクラスを追加
        result.classes.push(classResult.classDefinition);
      }
      
      // 名前空間内のクラスの場合
      if (currentNamespace) {
        const namespace = result.namespaces?.find(ns => ns.name === currentNamespace);
        if (namespace && !namespace.classes.includes(classResult.classDefinition.name)) {
          namespace.classes.push(classResult.classDefinition.name);
        }
      }
      
      i = classResult.nextIndex;
    } else if (line.match(/^[A-Za-z_][A-Za-z0-9_]*\s*:\s*.+/) && !line.includes('<|--') && !line.includes('-->') && !line.includes('--') && !line.includes('..')) {
      // コロン記法でのメンバー定義: "ClassName : +type member" または "ClassName: +method()"
      parseColonMemberDefinition(line, result);
      i++;
    } else if (line.includes('<|--') || line.includes('-->') || line.includes('*--') || line.includes('o--') || 
               line.includes('..>') || line.includes('..|>') || (line.includes('--') && !line.match(/^[A-Za-z_][A-Za-z0-9_]*\s*:/)) || (line.includes('..') && !line.includes('..|>') && !line.includes('..>'))) {
      // 関係性の処理（ラベル付きも含む）
      const relationship = parseRelationship(line);
      result.relationships.push(relationship);
      
      // 暗黙的なクラス定義の処理
      addImplicitClasses(result, relationship);
      i++;
    } else {
      i++;
    }
  }
  
  // 出力バリデーション
  return ClassDiagramResultSchema.parse(result);
}

/**
 * クラス定義をパース
 */
function parseClassDefinition(lines: string[], startIndex: number): {
  classDefinition: ClassDefinition;
  nextIndex: number;
} {
  const line = lines[startIndex].trim();
  
  // "class ClassName {" または "class ClassName~GenericType~ {" の形式
  const classMatch = line.match(/^class\s+([A-Za-z][A-Za-z0-9_~]*)\s*(\{?)/);
  if (!classMatch) {
    throw new Error(`Invalid class definition: ${line}`);
  }
  
  const classNameWithGeneric = classMatch[1];
  const hasOpenBrace = classMatch[2] === '{';
  
  // ジェネリック型を抽出
  const { name: className, genericType } = extractGenericType(classNameWithGeneric);
  
  const classDefinition: ClassDefinition = {
    name: className,
    members: []
  };
  
  if (genericType) {
    classDefinition.genericType = genericType;
  }
  
  let currentIndex = startIndex + 1;
  
  // 波括弧形式の場合、メンバーを解析
  if (hasOpenBrace) {
    while (currentIndex < lines.length) {
      const memberLine = lines[currentIndex].trim();
      
      // 終了波括弧をチェック
      if (memberLine === '}') {
        currentIndex++;
        break;
      }
      
      // アノテーションをチェック
      if (memberLine.match(/^<<\w+>>$/)) {
        const annotation = memberLine.slice(2, -2);
        if (!classDefinition.annotations) {
          classDefinition.annotations = [];
        }
        classDefinition.annotations.push(annotation);
        currentIndex++;
        continue;
      }
      
      // メンバー定義をパース
      if (memberLine.length > 0) {
        const member = parseMember(memberLine);
        classDefinition.members.push(member);
      }
      
      currentIndex++;
    }
  }
  
  return {
    classDefinition,
    nextIndex: currentIndex
  };
}

/**
 * メンバー定義をパース
 */
function parseMember(memberLine: string): ClassMember {
  // 可視性記号なしの単純なメンバー（enum値など）をチェック
  if (memberLine.match(/^[A-Za-z_][A-Za-z0-9_]*$/)) {
    return {
      name: memberLine,
      type: 'property',
      visibility: 'public'
    };
  }
  
  // メソッドかプロパティかチェック
  const hasParentheses = memberLine.includes('(');
  
  if (hasParentheses) {
    // メソッドの場合: "+deposit(amount)" または "+deposit(amount) bool"
    const methodWithReturnMatch = memberLine.match(/^([+\-#~]?)([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*([A-Za-z_][A-Za-z0-9_~<>]*)?/);
    if (!methodWithReturnMatch) {
      throw new Error(`Invalid method definition: ${memberLine}`);
    }
    
    const visibilitySymbol = methodWithReturnMatch[1] || '+';
    const methodName = methodWithReturnMatch[2];
    const paramsStr = methodWithReturnMatch[3];
    const returnType = methodWithReturnMatch[4];
    
    // パラメータをパース
    const parameters = paramsStr ? parseMethodParameters(paramsStr) : [];
    
    const member: ClassMember = {
      name: methodName,
      type: 'method',
      visibility: parseVisibility(visibilitySymbol)
    };
    
    if (parameters.length > 0) {
      member.parameters = parameters;
    }
    
    if (returnType) {
      member.returnType = convertGenericType(returnType);
    }
    
    return member;
  } else {
    // プロパティの場合: "+String owner" または "List~int~ position"
    const propertyMatch = memberLine.match(/^([+\-#~]?)([A-Za-z_][A-Za-z0-9_~<>]*)\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (!propertyMatch) {
      throw new Error(`Invalid property definition: ${memberLine}`);
    }
    
    const visibilitySymbol = propertyMatch[1] || '+';
    const dataType = propertyMatch[2];
    const propertyName = propertyMatch[3];
    
    // ジェネリック型を変換
    const convertedDataType = convertGenericType(dataType);
    
    return {
      name: propertyName,
      type: 'property',
      visibility: parseVisibility(visibilitySymbol),
      dataType: convertedDataType
    };
  }
}

/**
 * 関係性をパース
 */
function parseRelationship(line: string): Relationship {
  // 継承関係: "Animal <|-- Dog"
  const inheritanceMatch = line.match(/([A-Za-z_][A-Za-z0-9_]*)\s*<\|\-\-\s*([A-Za-z_][A-Za-z0-9_]*)/);
  if (inheritanceMatch) {
    return {
      from: inheritanceMatch[1],
      to: inheritanceMatch[2],
      type: 'inheritance'
    };
  }

  // コンポジション: "Class1 *-- Class2"
  const compositionMatch = line.match(/([A-Za-z_][A-Za-z0-9_]*)\s*\*\-\-\s*([A-Za-z_][A-Za-z0-9_]*)/);
  if (compositionMatch) {
    return {
      from: compositionMatch[1],
      to: compositionMatch[2],
      type: 'composition'
    };
  }

  // 集約: "Class1 o-- Class2"
  const aggregationMatch = line.match(/([A-Za-z_][A-Za-z0-9_]*)\s*o\-\-\s*([A-Za-z_][A-Za-z0-9_]*)/);
  if (aggregationMatch) {
    return {
      from: aggregationMatch[1],
      to: aggregationMatch[2],
      type: 'aggregation'
    };
  }

  // 関連（多重度・ラベル付き）: 'Customer "1" --> "*" Order : places'
  const associationWithLabelMatch = line.match(/([A-Za-z_][A-Za-z0-9_]*)\s*(?:"([^"]*)")?\s*\-\->\s*(?:"([^"]*)")?\s*([A-Za-z_][A-Za-z0-9_]*)\s*(?:\s*:\s*([A-Za-z_][A-Za-z0-9_]*))?/);
  if (associationWithLabelMatch) {
    const relationship: Relationship = {
      from: associationWithLabelMatch[1],
      to: associationWithLabelMatch[4],
      type: 'association'
    };
    
    if (associationWithLabelMatch[2] || associationWithLabelMatch[3]) {
      relationship.multiplicity = {
        from: associationWithLabelMatch[2],
        to: associationWithLabelMatch[3]
      };
    }
    
    if (associationWithLabelMatch[5]) {
      relationship.label = associationWithLabelMatch[5];
    }
    
    return relationship;
  }

  // 関連: "Class1 --> Class2"
  const associationMatch = line.match(/([A-Za-z_][A-Za-z0-9_]*)\s*\-\->\s*([A-Za-z_][A-Za-z0-9_]*)/);
  if (associationMatch) {
    return {
      from: associationMatch[1],
      to: associationMatch[2],
      type: 'association'
    };
  }

  // 依存: "Class1 ..> Class2"
  const dependencyMatch = line.match(/([A-Za-z_][A-Za-z0-9_]*)\s*\.\.\>\s*([A-Za-z_][A-Za-z0-9_]*)/);
  if (dependencyMatch) {
    return {
      from: dependencyMatch[1],
      to: dependencyMatch[2],
      type: 'dependency'
    };
  }

  // 実現: "Class1 ..|> Class2"
  const realizationMatch = line.match(/([A-Za-z_][A-Za-z0-9_]*)\s*\.\.\|\>\s*([A-Za-z_][A-Za-z0-9_]*)/);
  if (realizationMatch) {
    return {
      from: realizationMatch[1],
      to: realizationMatch[2],
      type: 'realization'
    };
  }

  // リンク(実線): "Class1 -- Class2"
  const linkSolidMatch = line.match(/([A-Za-z_][A-Za-z0-9_]*)\s*\-\-\s*([A-Za-z_][A-Za-z0-9_]*)/);
  if (linkSolidMatch) {
    return {
      from: linkSolidMatch[1],
      to: linkSolidMatch[2],
      type: 'link_solid'
    };
  }

  // リンク(破線): "Class1 .. Class2"
  const linkDashedMatch = line.match(/([A-Za-z_][A-Za-z0-9_]*)\s*\.\.\s*([A-Za-z_][A-Za-z0-9_]*)/);
  if (linkDashedMatch) {
    return {
      from: linkDashedMatch[1],
      to: linkDashedMatch[2],
      type: 'link_dashed'
    };
  }

  throw new Error(`Invalid relationship definition: ${line}`);
}

/**
 * 暗黙的なクラス定義を追加
 */
function addImplicitClasses(result: ClassDiagramResult, relationship: Relationship): void {
  // fromクラスが存在しない場合は追加
  if (!result.classes.find((c: ClassDefinition) => c.name === relationship.from)) {
    result.classes.push({
      name: relationship.from,
      members: []
    });
  }

  // toクラスが存在しない場合は追加
  if (!result.classes.find((c: ClassDefinition) => c.name === relationship.to)) {
    result.classes.push({
      name: relationship.to,
      members: []
    });
  }
}

/**
 * コロン記法でのメンバー定義をパース
 * "ClassName : +type member" または "ClassName: +method()"
 */
function parseColonMemberDefinition(line: string, result: ClassDiagramResult): void {
  const colonMatch = line.match(/([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+)/);
  if (!colonMatch) return;
  
  const className = colonMatch[1];
  const memberDef = colonMatch[2].trim();
  
  // クラスを取得または作成
  let classDefinition = result.classes.find((c: ClassDefinition) => c.name === className);
  if (!classDefinition) {
    classDefinition = {
      name: className,
      members: []
    };
    result.classes.push(classDefinition);
  }
  
  // メンバーをパース
  const member = parseMember(memberDef);
  classDefinition.members.push(member);
}

/**
 * メソッドパラメータをパース
 */
function parseMethodParameters(paramsStr: string): Array<{ name: string; type?: string }> {
  if (!paramsStr.trim()) return [];
  
  const params = paramsStr.split(',').map(p => p.trim());
  return params.map(param => {
    // "Type name" 形式をチェック (ジェネリック型も含む)
    const typeAndNameMatch = param.match(/^([A-Za-z_][A-Za-z0-9_~<>]*)\s+([A-Za-z_][A-Za-z0-9_]*)$/);
    if (typeAndNameMatch) {
      return {
        type: convertGenericType(typeAndNameMatch[1]),
        name: typeAndNameMatch[2]
      };
    }
    
    // 名前のみの場合
    return { name: param };
  });
}