import { Result, ok, err } from "neverthrow";
import {
  type ERDiagramResult,
  type ParseError,
  type Entity,
  type EntityMember,
  type KeyType,
  type Relationship,
  RelationshipType,
} from "../../../entities/er-diagram/index.js";

/**
 * Mermaid記法のER図を解析する
 * @param input Mermaid記法のER図文字列
 * @returns 解析結果またはエラー
 */
export function parseERDiagram(input: string): Result<ERDiagramResult, ParseError> {
  // 入力の検証
  if (!input || input.trim() === "") {
    return err({ message: "Empty input provided" });
  }

  // erDiagramキーワードの確認
  if (!input.includes("erDiagram")) {
    return err({ message: "Invalid ER diagram: missing 'erDiagram' keyword" });
  }

  try {
    const lines = input.split("\n").map((line) => line.trim());
    const entities = new Map<string, Entity>();
    const relationships: Relationship[] = [];
    let currentEntity: string | null = null;
    let inEntityBlock = false;
    let inYamlBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // YAML frontmatterのチェック
      if (line === "---") {
        inYamlBlock = !inYamlBlock;
        continue;
      }
      
      // YAML frontmatter内はスキップ
      if (inYamlBlock) {
        continue;
      }
      
      // 空行やerDiagramキーワードはスキップ
      if (!line || line === "erDiagram") {
        continue;
      }

      // エンティティブロックの終了
      if (line === "}" && inEntityBlock) {
        inEntityBlock = false;
        currentEntity = null;
        continue;
      }

      // エンティティブロック内の属性解析
      if (inEntityBlock && currentEntity) {
        const member = parseAttributeLine(line);
        if (member) {
          const entity = entities.get(currentEntity);
          if (entity) {
            if (!entity.members) {
              entity.members = [];
            }
            entity.members.push(member);
          }
        }
        continue;
      }

      // エンティティブロックの開始をチェック
      const entityBlockMatch = line.match(/^(\w+(?:-\w+)*)\s*\{$/);
      if (entityBlockMatch) {
        currentEntity = entityBlockMatch[1];
        inEntityBlock = true;
        if (!entities.has(currentEntity)) {
          entities.set(currentEntity, { name: currentEntity });
        }
        continue;
      }

      // リレーションシップのパース
      const relationshipMatch = parseRelationshipLine(line);
      if (relationshipMatch) {
        const { from, to, type, label, cardinality } = relationshipMatch;

        // エンティティを記録
        if (!entities.has(from)) {
          entities.set(from, { name: from });
        }
        if (!entities.has(to)) {
          entities.set(to, { name: to });
        }

        // リレーションシップを記録
        relationships.push({ from, to, type, label, cardinality });
      } else if (line && !line.startsWith("erDiagram")) {
        // 不正な構文
        return err({ message: `Invalid syntax: ${line}` });
      }
    }

    return ok({
      entities: Array.from(entities.values()),
      relationships,
    });
  } catch (error) {
    return err({
      message: "Failed to parse ER diagram",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * リレーションシップ行を解析する
 * @param line 解析対象の行
 * @returns リレーションシップ情報またはnull
 */
function parseRelationshipLine(line: string): {
  from: string;
  to: string;
  type: RelationshipType;
  label?: string;
  cardinality?: { from: string; to: string };
} | null {
  // リレーションシップのパターン: ENTITY1 RELATIONSHIP ENTITY2 : LABEL
  // または ENTITY1 RELATIONSHIP ENTITY2
  const patterns = [
    // ラベル付きのパターン（引用符あり）
    /^(\w+(?:-\w+)*)\s+([\|\}o\-\{\.]+)\s+(\w+(?:-\w+)*)\s*:\s*"([^"]+)"$/,
    // ラベル付きのパターン（引用符なし）
    /^(\w+(?:-\w+)*)\s+([\|\}o\-\{\.]+)\s+(\w+(?:-\w+)*)\s*:\s*(\S+)$/,
    // ラベルなしのパターン
    /^(\w+(?:-\w+)*)\s+([\|\}o\-\{\.]+)\s+(\w+(?:-\w+)*)$/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const [, from, relationshipSymbol, to, label] = match;
      const type = parseRelationshipType(relationshipSymbol);
      const cardinality = parseCardinality(relationshipSymbol);
      if (type) {
        return { from, to, type, label, cardinality };
      }
    }
  }

  // 自然言語形式のパターンをチェック
  // 例: MANUFACTURER only one to zero or more CAR : makes
  const naturalLanguagePattern = /^(\w+(?:-\w+)*)\s+(.+?)\s+(\w+(?:-\w+)*)\s*:\s*(.+)$/;
  const naturalMatch = line.match(naturalLanguagePattern);
  if (naturalMatch) {
    const [, from, relationText, to, label] = naturalMatch;
    const type = parseNaturalLanguageRelationship(relationText);
    const cardinality = parseNaturalLanguageCardinality(relationText);
    if (type) {
      return { from, to, type, label, cardinality };
    }
  }

  return null;
}

/**
 * リレーションシップのシンボルから型を判定する
 * @param symbol リレーションシップのシンボル
 * @returns リレーションシップタイプ
 */
function parseRelationshipType(symbol: string): RelationshipType | null {
  // Mermaid記法のマッピング（実線と点線の両方をサポート）
  const typeMap: Record<string, RelationshipType> = {
    // 実線
    "||--||": RelationshipType.ONE_TO_ONE,
    "||--o{": RelationshipType.ONE_TO_MANY,
    "||--|{": RelationshipType.ONE_TO_MANY,
    "}o--||": RelationshipType.MANY_TO_ONE,
    "}|--||": RelationshipType.MANY_TO_ONE,
    "}o--o{": RelationshipType.MANY_TO_MANY,
    "}|--|{": RelationshipType.MANY_TO_MANY,
    "|o--||": RelationshipType.ZERO_OR_ONE_TO_ONE,
    "|o--o{": RelationshipType.ZERO_OR_ONE_TO_MANY,
    "|o--|{": RelationshipType.ZERO_OR_ONE_TO_MANY,
    "||--o|": RelationshipType.ONE_TO_ZERO_OR_MANY,
    "|o--o|": RelationshipType.ZERO_OR_MANY_TO_ZERO_OR_MANY,
    "|{--o|": RelationshipType.ONE_TO_MANY,
    "o{--o|": RelationshipType.MANY_TO_ONE,
    // 点線
    "||..||": RelationshipType.ONE_TO_ONE,
    "||..o{": RelationshipType.ONE_TO_MANY,
    "||..|{": RelationshipType.ONE_TO_MANY,
    "}o..||": RelationshipType.MANY_TO_ONE,
    "}|..||": RelationshipType.MANY_TO_ONE,
    "}o..o{": RelationshipType.MANY_TO_MANY,
    "}|..|{": RelationshipType.MANY_TO_MANY,
    "|o..||": RelationshipType.ZERO_OR_ONE_TO_ONE,
    "|o..o{": RelationshipType.ZERO_OR_ONE_TO_MANY,
    "|o..|{": RelationshipType.ZERO_OR_ONE_TO_MANY,
    "||..o|": RelationshipType.ONE_TO_ZERO_OR_MANY,
    "|o..o|": RelationshipType.ZERO_OR_MANY_TO_ZERO_OR_MANY,
    "|{..o|": RelationshipType.ONE_TO_MANY,
    "o{..o|": RelationshipType.MANY_TO_ONE,
  };

  return typeMap[symbol] || null;
}

/**
 * カーディナリティを解析する
 * @param symbol リレーションシップのシンボル
 * @returns カーディナリティ情報
 */
function parseCardinality(symbol: string): { from: string; to: string } | undefined {
  // シンボルから中央の "--" または ".." を除去して左右のカーディナリティを取得
  let dashIndex = symbol.indexOf("--");
  let separatorLength = 2;
  
  if (dashIndex === -1) {
    dashIndex = symbol.indexOf("..");
    if (dashIndex === -1) {
      return undefined;
    }
  }
  
  const leftSymbol = symbol.substring(0, dashIndex);
  const rightSymbol = symbol.substring(dashIndex + separatorLength);
  
  // 左側のカーディナリティを解析
  let fromCardinality = "";
  if (leftSymbol === "||") {
    fromCardinality = "exactly one";
  } else if (leftSymbol === "|o") {
    fromCardinality = "zero or one";
  } else if (leftSymbol === "|{") {
    fromCardinality = "one or more";
  } else if (leftSymbol === "o{") {
    fromCardinality = "zero or more";
  } else if (leftSymbol === "}|") {
    fromCardinality = "one or more";
  } else if (leftSymbol === "}o") {
    fromCardinality = "zero or more";
  } else if (leftSymbol === "o|") {
    fromCardinality = "zero or one";
  } else if (leftSymbol === "{o") {
    fromCardinality = "zero or more";
  } else if (leftSymbol === "{|") {
    fromCardinality = "one or more";
  }

  // 右側のカーディナリティを解析
  let toCardinality = "";
  if (rightSymbol === "||") {
    toCardinality = "exactly one";
  } else if (rightSymbol === "o|") {
    toCardinality = "zero or one";
  } else if (rightSymbol === "|{") {
    toCardinality = "one or more";
  } else if (rightSymbol === "o{") {
    toCardinality = "zero or more";
  } else if (rightSymbol === "}|") {
    toCardinality = "one or more";
  } else if (rightSymbol === "}o") {
    toCardinality = "zero or more";
  } else if (rightSymbol === "|o") {
    toCardinality = "zero or one";
  } else if (rightSymbol === "{o") {
    toCardinality = "zero or more";
  } else if (rightSymbol === "{|") {
    toCardinality = "one or more";
  }

  if (fromCardinality && toCardinality) {
    return { from: fromCardinality, to: toCardinality };
  }
  
  return undefined;
}

/**
 * 自然言語形式のカーディナリティを解析する
 * @param text リレーションシップのテキスト
 * @returns カーディナリティ情報
 */
function parseNaturalLanguageCardinality(text: string): { from: string; to: string } | undefined {
  const lowerText = text.toLowerCase();
  
  // "only one to zero or more" のようなパターンをパース
  const patterns = [
    // 基本パターン
    /^(only one|exactly one|one|zero or one|zero or more|one or more|many)\s+to\s+(only one|exactly one|one|zero or one|zero or more|one or more|many)$/,
    // 数字と記号を含むパターン（例: "1 to zero or more", "1 to 0+"）
    /^(\d+|\d+\+|0\+)\s+to\s+(\d+|\d+\+|0\+|zero or more|one or more|many)$/,
    // 括弧とオプション記述を含むパターン（例: "many(0) optionally to 0+"）
    /^(many\(\d+\)|\d+|\d+\+|0\+)\s*(?:optionally\s+)?to\s+(\d+|\d+\+|0\+|zero or more|one or more|many)$/,
  ];
  
  for (const pattern of patterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const [, fromText, toText] = match;
      const fromCardinality = normalizeCardinality(fromText);
      const toCardinality = normalizeCardinality(toText);
      if (fromCardinality && toCardinality) {
        return { from: fromCardinality, to: toCardinality };
      }
    }
  }
  
  return undefined;
}

/**
 * カーディナリティテキストを正規化する
 * @param text カーディナリティテキスト
 * @returns 正規化されたカーディナリティ
 */
function normalizeCardinality(text: string): string {
  const lowerText = text.toLowerCase();
  
  // 基本的なテキストパターン
  if (lowerText === "only one" || lowerText === "exactly one" || lowerText === "one") {
    return "exactly one";
  } else if (lowerText === "zero or one") {
    return "zero or one";
  } else if (lowerText === "zero or more" || lowerText === "many") {
    return "zero or more";
  } else if (lowerText === "one or more") {
    return "one or more";
  }
  
  // 数字と記号パターン
  if (lowerText === "1") {
    return "exactly one";
  } else if (lowerText === "0+" || lowerText === "0 or more") {
    return "zero or more";
  } else if (lowerText === "1+" || lowerText === "1 or more") {
    return "one or more";
  }
  
  // 括弧付きパターン（例: many(0)）
  if (lowerText.match(/^many\(0\)$/)) {
    return "zero or more";
  } else if (lowerText.match(/^many\(1\)$/)) {
    return "one or more";
  }
  
  return "";
}

/**
 * 自然言語形式のリレーションシップを解析する
 * @param text リレーションシップのテキスト
 * @returns リレーションシップタイプ
 */
function parseNaturalLanguageRelationship(text: string): RelationshipType | null {
  const lowerText = text.toLowerCase();
  
  // カーディナリティ情報を取得
  const cardinality = parseNaturalLanguageCardinality(text);
  if (!cardinality) {
    return null;
  }
  
  const { from, to } = cardinality;
  
  // カーディナリティの組み合わせからリレーションシップタイプを決定
  if (from === "exactly one" && to === "exactly one") {
    return RelationshipType.ONE_TO_ONE;
  } else if (from === "exactly one" && to === "zero or more") {
    return RelationshipType.ONE_TO_ZERO_OR_MANY;
  } else if (from === "exactly one" && to === "one or more") {
    return RelationshipType.ONE_TO_MANY;
  } else if (from === "zero or more" && to === "exactly one") {
    return RelationshipType.MANY_TO_ONE;
  } else if (from === "one or more" && to === "exactly one") {
    return RelationshipType.MANY_TO_ONE;
  } else if (from === "zero or more" && to === "zero or more") {
    return RelationshipType.MANY_TO_MANY;
  } else if (from === "one or more" && to === "one or more") {
    return RelationshipType.MANY_TO_MANY;
  } else if (from === "zero or one" && to === "exactly one") {
    return RelationshipType.ZERO_OR_ONE_TO_ONE;
  } else if (from === "zero or one" && to === "zero or more") {
    return RelationshipType.ZERO_OR_ONE_TO_MANY;
  } else if (from === "zero or one" && to === "one or more") {
    return RelationshipType.ZERO_OR_ONE_TO_MANY;
  } else if (from === "exactly one" && to === "zero or one") {
    return RelationshipType.ONE_TO_ZERO_OR_MANY; // 適切なタイプがないため近似
  } else if (from === "zero or one" && to === "zero or one") {
    return RelationshipType.ZERO_OR_MANY_TO_ZERO_OR_MANY;
  }
  
  return null;
}

/**
 * 属性行を解析する
 * @param line 解析対象の行
 * @returns エンティティメンバー情報またはnull
 */
function parseAttributeLine(line: string): EntityMember | null {
  // 属性行のパターン: dataType attributeName [keys] ["comment"]
  // 例: string name
  // 例: string(99) firstName "Only 99 characters are allowed"
  // 例: string registrationNumber PK
  // 例: string carRegistrationNumber PK, FK
  const match = line.match(/^(\S+(?:\(\d+\))?)\s+(\w+)(.*)$/);
  if (!match) {
    return null;
  }

  const [, dataTypeRaw, name, rest] = match;
  const { dataType, length } = parseDataType(dataTypeRaw);
  const { keys, comment } = parseKeysAndComment(rest.trim());

  const member: EntityMember = { name, dataType };
  if (keys && keys.length > 0) {
    member.keys = keys;
  }
  if (comment) {
    member.comment = comment;
  }
  if (length !== undefined) {
    member.length = length;
  }

  return member;
}

/**
 * データ型を解析する
 * @param dataTypeRaw データ型文字列
 * @returns データ型と長さ
 */
function parseDataType(dataTypeRaw: string): { dataType: string; length?: number } {
  // 長さ付きのデータ型をチェック (e.g., string(99))
  const lengthMatch = dataTypeRaw.match(/^(\w+)\((\d+)\)$/);
  if (lengthMatch) {
    return {
      dataType: lengthMatch[1],
      length: parseInt(lengthMatch[2], 10),
    };
  }

  return { dataType: dataTypeRaw };
}

/**
 * キー情報とコメントを解析する
 * @param rest 属性名以降の文字列
 * @returns キー情報とコメント
 */
function parseKeysAndComment(rest: string): { keys?: KeyType[]; comment?: string } {
  if (!rest) {
    return {};
  }

  // コメントを抽出（引用符付き）
  const commentMatch = rest.match(/"([^"]+)"$/);
  const comment = commentMatch ? commentMatch[1] : undefined;
  const keysString = comment
    ? rest.substring(0, rest.lastIndexOf('"')).trim()
    : rest;

  // キー情報を解析
  const keys: KeyType[] = [];
  if (keysString) {
    const keyParts = keysString.split(/[,\s]+/).filter(Boolean);
    for (const keyPart of keyParts) {
      if (keyPart === "PK" || keyPart === "FK" || keyPart === "UK") {
        keys.push(keyPart as KeyType);
      }
    }
  }

  return { keys: keys.length > 0 ? keys : undefined, comment };
}