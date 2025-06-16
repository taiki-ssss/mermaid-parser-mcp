/**
 * クラス図エンティティモデル
 */

export type Visibility = 'public' | 'private' | 'protected' | 'package';
export type MemberType = 'property' | 'method';
export type RelationshipType = 
  | 'inheritance' 
  | 'composition' 
  | 'aggregation' 
  | 'association' 
  | 'dependency' 
  | 'realization' 
  | 'link_solid' 
  | 'link_dashed';

export interface MethodParameter {
  name: string;
  type?: string;
}

export interface ClassMember {
  name: string;
  type: MemberType;
  visibility: Visibility;
  dataType?: string;
  isStatic?: boolean;
  isAbstract?: boolean;
  parameters?: MethodParameter[];  // メソッドのパラメータ
  returnType?: string;             // メソッドの戻り値型
}

export interface ClassDefinition {
  name: string;
  label?: string;
  annotations?: string[];
  members: ClassMember[];
  genericType?: string;  // ジェネリック型パラメータ
}

export interface Relationship {
  from: string;
  to: string;
  type: RelationshipType;
  label?: string;
  multiplicity?: {
    from?: string;
    to?: string;
  };
}

export interface Namespace {
  name: string;
  classes: string[];
}

export interface ClassDiagramResult {
  classes: ClassDefinition[];
  relationships: Relationship[];
  namespaces?: Namespace[];
}