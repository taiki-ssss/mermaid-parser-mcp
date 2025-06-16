import { z } from 'zod';

/**
 * クラス図Zodスキーマ定義
 */

export const VisibilitySchema = z.enum(['public', 'private', 'protected', 'package']);
export const MemberTypeSchema = z.enum(['property', 'method']);
export const RelationshipTypeSchema = z.enum([
  'inheritance',
  'composition', 
  'aggregation',
  'association',
  'dependency',
  'realization',
  'link_solid',
  'link_dashed'
]);

export const MethodParameterSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional()
});

export const ClassMemberSchema = z.object({
  name: z.string().min(1),
  type: MemberTypeSchema,
  visibility: VisibilitySchema,
  dataType: z.string().optional(),
  isStatic: z.boolean().optional(),
  isAbstract: z.boolean().optional(),
  parameters: z.array(MethodParameterSchema).optional(),
  returnType: z.string().optional()
});

export const ClassDefinitionSchema = z.object({
  name: z.string().min(1),
  label: z.string().optional(),
  annotations: z.array(z.string()).optional(),
  members: z.array(ClassMemberSchema),
  genericType: z.string().optional()
});

export const RelationshipSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  type: RelationshipTypeSchema,
  label: z.string().optional(),
  multiplicity: z.object({
    from: z.string().optional(),
    to: z.string().optional()
  }).optional()
});

export const NamespaceSchema = z.object({
  name: z.string().min(1),
  classes: z.array(z.string().min(1))
});

export const ClassDiagramResultSchema = z.object({
  classes: z.array(ClassDefinitionSchema),
  relationships: z.array(RelationshipSchema),
  namespaces: z.array(NamespaceSchema).optional()
});

export const MermaidSourceSchema = z.string().min(1).max(100000);