/**
 * Mermaidパーサーユーティリティ関数
 */

/**
 * 文字列から空白文字を除去
 */
export function removeWhitespace(text: string): string {
  return text.replace(/\s+/g, '');
}

/**
 * 文字列の先頭が指定した文字列で始まるかチェック
 */
export function startsWith(text: string, prefix: string): boolean {
  return text.toLowerCase().startsWith(prefix.toLowerCase());
}

/**
 * テキストを行に分割（空行を除去）
 */
export function splitLines(text: string): string[] {
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * YAML Front Matterを除去
 */
export function removeYamlFrontMatter(text: string): string {
  const lines = text.split('\n');
  let inFrontMatter = false;
  let frontMatterEnded = false;
  const resultLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '---') {
      if (!inFrontMatter && !frontMatterEnded) {
        inFrontMatter = true;
        continue;
      } else if (inFrontMatter) {
        inFrontMatter = false;
        frontMatterEnded = true;
        continue;
      }
    }
    
    if (!inFrontMatter) {
      resultLines.push(line);
    }
  }
  
  return resultLines.join('\n');
}

/**
 * Note文を除去
 */
export function removeNotes(text: string): string {
  // 行ごとに処理して、note文を含む行を完全に削除
  const lines = text.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim();
    // note文の行をフィルタリング
    return !trimmedLine.match(/^note\s+"[^"]*"$/) && 
           !trimmedLine.match(/^note\s+for\s+\w+\s+"[^"]*"$/);
  });
  
  return filteredLines.join('\n');
}

/**
 * Mermaid可視性記号を変換
 */
export function parseVisibility(symbol: string): 'public' | 'private' | 'protected' | 'package' {
  switch (symbol) {
    case '+': return 'public';
    case '-': return 'private';
    case '#': return 'protected';
    case '~': return 'package';
    default: return 'public';
  }
}

/**
 * メソッドかプロパティかを判定（括弧の有無で判定）
 */
export function getMemberType(memberText: string): 'method' | 'property' {
  return memberText.includes('(') ? 'method' : 'property';
}

/**
 * ジェネリック型を変換 "List~int~" -> "List<int>"
 * ネストされた型もサポート: "List~List~int~~" -> "List<List<int>>"
 */
export function convertGenericType(type: string): string {
  let result = type;
  
  // ネストレベルを判定（~の数をカウント）
  const tildeCount = (type.match(/~/g) || []).length;
  
  // 最も内側から順に変換
  // 例: List~List~int~~ → List~List<int> → List<List<int>>
  for (let level = Math.floor(tildeCount / 2); level > 0; level--) {
    // 現在のレベルに応じた正規表現を作成
    
    if (level === 1) {
      // 最も単純なケース（後ろに追加の~がない）
      result = result.replace(/~([^~]+)~(?!~)/g, '<$1>');
    } else {
      // ネストされたケース（複数の~で終わる）
      const tildes = '~'.repeat(level);
      const regex = new RegExp(`~([^~]+)${tildes}`, 'g');
      result = result.replace(regex, (match, content) => {
        // 終端の~を一つ減らして<>に変換
        return '<' + content + '>' + '~'.repeat(level - 1);
      });
    }
  }
  
  return result;
}

/**
 * ジェネリック型を抽出 "Square~Shape~" -> { name: "Square", genericType: "Shape" }
 */
export function extractGenericType(classNameWithGeneric: string): { name: string; genericType?: string } {
  const match = classNameWithGeneric.match(/^([A-Za-z_][A-Za-z0-9_]*)~([^~]+)~$/);
  if (match) {
    return {
      name: match[1],
      genericType: match[2]
    };
  }
  return { name: classNameWithGeneric };
}