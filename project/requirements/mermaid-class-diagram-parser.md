# Mermaidクラス図JSONパーサー 要件定義書

## 1. 概要

### 1.1 目的
Mermaidクラスダイアグラムのテキスト記法を構造化されたJSONデータに変換するMCPサーバーツールを提供する。

### 1.2 適用範囲  
- Mermaidクラス図記法の全機能をサポート
- MCPプロトコルによるクライアント-サーバー通信
- Feature-Sliced Design(FSD)アーキテクチャに準拠

## 2. 機能要件

### 2.1 主要機能
**MCPツール名**: `class_diagram`

**機能概要**: MermaidクラスダイアグラムテキストをJSONオブジェクトにパースする

### 2.2 入力仕様

#### 2.2.1 パラメータ
- **名前**: `mermaidSource`
- **型**: `string`
- **必須**: Yes
- **説明**: Mermaidクラス図記法で記述されたテキスト

#### 2.2.2 入力制約
- `classDiagram`で開始する有効なMermaid記法
- 最大サイズ: 100KB
- UTF-8エンコーディング

### 2.3 出力仕様

```typescript
interface ClassDiagramResult {
  // パース対象のクラス一覧
  classes: Array<{
    name: string;                    // クラス名
    label?: string;                  // 表示ラベル（["label"]形式）
    annotations?: string[];          // アノテーション（<<Interface>>等）
    members: Array<{
      name: string;                  // メンバー名
      type: 'property' | 'method';   // プロパティ or メソッド
      visibility: 'public' | 'private' | 'protected' | 'package'; // 可視性
      dataType?: string;             // データ型
      isStatic?: boolean;            // 静的メンバーフラグ
      isAbstract?: boolean;          // 抽象メソッドフラグ
    }>;
  }>;
  
  // クラス間の関係性一覧
  relationships: Array<{
    from: string;                    // 関係元クラス名
    to: string;                      // 関係先クラス名
    type: 'inheritance' | 'composition' | 'aggregation' | 'association' | 
          'dependency' | 'realization' | 'link_solid' | 'link_dashed'; // 関係性種別
    label?: string;                  // 関係性ラベル
    multiplicity?: {                 // 多重度
      from?: string;                 // 関係元の多重度
      to?: string;                   // 関係先の多重度
    };
  }>;
  
  // 名前空間（グループ化）
  namespaces?: Array<{
    name: string;                    // 名前空間名
    classes: string[];               // 含まれるクラス名一覧
  }>;
}
```

### 2.4 対応Mermaid記法

#### 2.4.1 クラス定義
- `class ClassName` 形式
- 関係性による暗黙的定義
- クラスラベル `["Label"]` 形式

#### 2.4.2 メンバー定義
- コロン記法: `ClassName : +String property`
- 波括弧記法: `class ClassName { +String property }`
- 可視性記号: `+`(public), `-`(private), `#`(protected), `~`(package)
- 分類子: `*`(Abstract), `$`(Static)
- ジェネリック型: `List~int~` 形式

#### 2.4.3 関係性
| 記号 | 関係性 |
|------|--------|
| `<\|--` | 継承 |
| `*--` | コンポジション |
| `o--` | 集約 |
| `-->` | 関連 |
| `--` | リンク(実線) |
| `..>` | 依存 |
| `..\|>` | 実現 |
| `..` | リンク(破線) |

#### 2.4.4 その他要素
- アノテーション: `<<Interface>>`, `<<Abstract>>`
- 名前空間: `namespace` キーワード
- 多重度: `"1"`, `"*"`, `"0..1"` 等
- 関係性ラベル: `: label` 形式

## 3. 非機能要件

### 3.1 性能要件
- パース処理時間: 100KB以下で1秒以内
- メモリ使用量: 最大50MB

### 3.2 信頼性要件
- エラーハンドリング: neverthrowライブラリによる堅牢な処理
- 入力バリデーション: Zodスキーマによる厳密な検証

### 3.3 保守性要件
- テストカバレッジ: 100%維持
- FSDアーキテクチャ準拠
- TypeScript型安全性

## 4. テストケース

### 4.1 正常系テストケース
1. **基本クラス定義**: プロパティ・メソッド含むクラス1つ
2. **継承関係**: 親クラス-子クラスの継承
3. **全関係性**: 8種類の関係性すべて
4. **多重度**: 数値・範囲指定の多重度
5. **アノテーション**: Interface・Abstract等
6. **名前空間**: クラスのグループ化
7. **ジェネリック型**: 型パラメータ付きクラス
8. **複合ケース**: 上記要素の組み合わせ

### 4.2 異常系テストケース
1. **構文エラー**: 不正なMermaid記法
2. **参照エラー**: 存在しないクラス参照
3. **循環参照**: クラス間の循環継承
4. **型エラー**: 無効な型定義
5. **サイズ超過**: 100KB制限超過

### 4.3 境界値テストケース
1. **最小構成**: クラス1つのみ
2. **サイズ境界**: 100KB制限付近
3. **特殊文字**: Unicode・エスケープ文字
4. **極端な長さ**: 長大なクラス名・メンバー名

## 5. 制約事項

### 5.1 技術制約
- TypeScript 5.8.3使用
- @modelcontextprotocol/sdk 1.12.1準拠
- Node.js環境での動作

### 5.2 機能制約
- Mermaidクラス図のみサポート（他図表は対象外）
- テキスト形式のみ対応（画像形式は対象外）
- リアルタイム編集支援機能は含まない

### 5.3 運用制約
- MCPクライアントからの呼び出しのみ
- スタンドアロン実行は非対応

## 6. 実装アーキテクチャ

### 6.1 FSD層構成
- **app**: MCPサーバーエントリーポイント
- **features/server**: パーサーツール定義
- **entities**: クラス図データモデル
- **shared/lib**: パーサーコア機能・バリデーション

### 6.2 主要コンポーネント
- パーサーエンジン: Mermaidテキスト解析
- スキーマバリデーター: 入出力検証
- エラーハンドラー: 例外処理・ログ記録
- テストスイート: 包括的テストケース