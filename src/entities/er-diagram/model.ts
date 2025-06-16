/**
 * ER図のエンティティモデル定義
 */

/**
 * キーのタイプ
 */
export type KeyType = "PK" | "FK" | "UK";

/**
 * エンティティのメンバー（属性）を表す型
 */
export interface EntityMember {
  /** 属性名 */
  name: string;
  /** データ型 */
  dataType: string;
  /** キー情報のリスト */
  keys?: KeyType[];
  /** コメント */
  comment?: string;
  /** 長さ制限 */
  length?: number;
}

/**
 * エンティティ（テーブル）を表す型
 */
export interface Entity {
  /** エンティティ名 */
  name: string;
  /** メンバー（属性）のリスト */
  members?: EntityMember[];
}

/**
 * 属性を表す型
 */
export interface Attribute {
  /** 属性名 */
  name: string;
  /** データ型 */
  type: string;
  /** プライマリキーかどうか */
  isPrimaryKey?: boolean;
  /** 外部キーかどうか */
  isForeignKey?: boolean;
}

/**
 * リレーションシップを表す型
 */
export interface Relationship {
  /** リレーションシップ元のエンティティ名 */
  from: string;
  /** リレーションシップ先のエンティティ名 */
  to: string;
  /** リレーションシップのタイプ */
  type: RelationshipType;
  /** リレーションシップのラベル（オプション） */
  label?: string;
  /** カーディナリティ情報（オプション） */
  cardinality?: {
    from: string;
    to: string;
  };
}

/**
 * リレーションシップのタイプ
 * Mermaid記法に基づく
 */
export enum RelationshipType {
  /** 1対1 (||--||) */
  ONE_TO_ONE = "ONE_TO_ONE",
  /** 1対多 (||--o{) */
  ONE_TO_MANY = "ONE_TO_MANY",
  /** 多対1 (}o--||) */
  MANY_TO_ONE = "MANY_TO_ONE",
  /** 多対多 (}o--o{) */
  MANY_TO_MANY = "MANY_TO_MANY",
  /** 0または1対1 (|o--||) */
  ZERO_OR_ONE_TO_ONE = "ZERO_OR_ONE_TO_ONE",
  /** 0または1対多 (|o--o{) */
  ZERO_OR_ONE_TO_MANY = "ZERO_OR_ONE_TO_MANY",
  /** 1対0または多 (||--o|) */
  ONE_TO_ZERO_OR_MANY = "ONE_TO_ZERO_OR_MANY",
  /** 0または多対0または多 (|o--o|) */
  ZERO_OR_MANY_TO_ZERO_OR_MANY = "ZERO_OR_MANY_TO_ZERO_OR_MANY",
}

/**
 * ER図の解析結果を表す型
 */
export interface ERDiagramResult {
  /** エンティティのリスト */
  entities: Entity[];
  /** リレーションシップのリスト */
  relationships: Relationship[];
}

/**
 * 解析エラーを表す型
 */
export interface ParseError {
  /** エラーメッセージ */
  message: string;
  /** エラーが発生した行番号（オプション） */
  line?: number;
  /** エラーの詳細情報（オプション） */
  details?: string;
}