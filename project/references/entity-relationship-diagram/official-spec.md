# Mermaid ER図 公式仕様まとめ

## 1. リレーション記法仕様

### 1.1 カーディナリティ記号（完全なリスト）

| 左側記号 | 右側記号 | 意味 | 別名（エイリアス） |
|:-------:|:-------:|:-----|:------------------|
| `|o` | `o|` | 0または1（Zero or one） | `one or zero`, `zero or one` |
| `||` | `||` | 正確に1（Exactly one） | `only one`, `1` |
| `}o` | `o{` | 0以上（Zero or more） | `zero or more`, `zero or many`, `many(0)`, `0+`, `many` |
| `}|` | `|{` | 1以上（One or more） | `one or more`, `one or many`, `many(1)`, `1+` |

### 1.2 識別タイプ（線のスタイル）

| 記号 | 意味 | 別名 |
|:----:|:-----|:-----|
| `--` | 識別関係（実線） | `to` |
| `..` | 非識別関係（破線） | `optionally to` |

### 1.3 リレーション定義の完全な構文

```
<first-entity> <cardinality><identification><cardinality> <second-entity> : <relationship-label>
```

例：
```
CUSTOMER ||--o{ ORDER : places
```
- `CUSTOMER`: 第1エンティティ
- `||`: CUSTOMERのカーディナリティ（正確に1）
- `--`: 識別タイプ（識別関係、実線）
- `o{`: ORDERのカーディナリティ（0以上）
- `ORDER`: 第2エンティティ
- `places`: リレーションラベル

## 2. エンティティ定義の詳細な文法

### 2.1 基本構文

```
EntityName {
    type attributeName
    type attributeName KEY
    type attributeName KEY, KEY "comment"
}
```

### 2.2 エンティティ名のルール

- 空白を含む場合は二重引用符で囲む
- Unicode文字をサポート
- Markdownフォーマットをサポート
- エイリアスを角括弧で定義可能：`p[Person]`

## 3. 属性定義のデータ型一覧

### 3.1 データ型の規則

- 英字で始まる必要がある
- 数字、ハイフン、アンダースコア、括弧、角括弧を含むことができる
- 暗黙的な有効なデータ型のセットは存在しない（任意の文字列が許可される）

### 3.2 サポートされるデータ型の例

- 基本型：`string`, `int`, `float`, `boolean`, `date`
- 長さ制約付き：`string(99)`, `varchar(5)`, `character(20)`
- 配列型：`string[]`, `int[]`
- カスタム型：`timestamp with time zone`, `public.year`, `numeric(4,2)`
- ジェネリック型：`type~T~`

## 4. キー定義の種類と記法

### 4.1 サポートされるキータイプ

| キー | 意味 |
|:---:|:-----|
| `PK` | プライマリキー（Primary Key） |
| `FK` | 外部キー（Foreign Key） |
| `UK` | ユニークキー（Unique Key） |

### 4.2 キー定義の構文

- 単一キー：`string id PK`
- 複数キー：`string carRegistrationNumber PK, FK`
- 代替構文：属性名の前に`*`を付けることでPKを示すことも可能

### 4.3 コメント

- 属性の最後に二重引用符で囲んで追加
- 例：`string driversLicense PK "The license #"`

## 5. エラーケースや制約事項

### 5.1 リレーション定義の制約

- リレーション文の一部（`first-entity`以外）が指定された場合、すべての部分が必須
- `<relationship>`, `<second-entity>`, `<relationship-label>`はすべて必要

### 5.2 属性コメントの制約

- コメント内に二重引用符を含めることはできない

### 5.3 キー定義の制約

- キー定義（`PK`, `FK`, `UK`）ではMarkdownフォーマットとUnicodeはサポートされない

## 6. 特殊機能

### 6.1 エンティティエイリアス

```
p[Person] {
    string firstName
}
```

### 6.2 ダイアグラムの方向指定

```
erDiagram
    direction TB
```

サポートされる方向：
- `TB`：上から下（Top to Bottom）
- `BT`：下から上（Bottom to Top）
- `LR`：左から右（Left to Right）
- `RL`：右から左（Right to Left）

### 6.3 関連エンティティ

- リレーションのみで定義されるエンティティ（例：`NAMED-DRIVER`）
- 多対多の関係を解決するための中間エンティティとして使用

## 7. その他の注意事項

- `MD_PARENT`カーディナリティタイプが`erDiagram.jison`に存在するが、公式ドキュメントでは説明されていない
- リレーションラベルはUnicodeとMarkdownフォーマットをサポート
- エンティティは複数のブロックで定義可能