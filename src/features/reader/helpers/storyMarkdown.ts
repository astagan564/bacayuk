export type StoryMarkdownBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; level: 1 | 2 | 3; content: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] };

export type StoryInlineToken = {
  type: 'text' | 'bold' | 'italic' | 'code';
  content: string;
};

export function normalizeStoryMarkdown(content: string): string {
  return content
    .replace(/(^|\s)([-*+])\s+(?=\*\*[^*]+:\*\*)/g, '\n$2 ')
    .replace(/(^|\s)(\d+[.)])\s+(?=\*\*[^*]+:\*\*)/g, '\n$2 ');
}

export function parseStoryInlineMarkdown(content: string): StoryInlineToken[] {
  return content
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((chunk) => {
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return { type: 'bold', content: chunk.slice(2, -2) };
      }
      if (chunk.startsWith('*') && chunk.endsWith('*')) {
        return { type: 'italic', content: chunk.slice(1, -1) };
      }
      if (chunk.startsWith('`') && chunk.endsWith('`')) {
        return { type: 'code', content: chunk.slice(1, -1) };
      }
      return { type: 'text', content: chunk };
    });
}

export function parseStoryMarkdown(content: string): StoryMarkdownBlock[] {
  const lines = normalizeStoryMarkdown(content).replace(/\r\n/g, '\n').split('\n');
  const blocks: StoryMarkdownBlock[] = [];
  let paragraph: string[] = [];
  let activeList: Extract<StoryMarkdownBlock, { type: 'unordered-list' | 'ordered-list' }> | null = null;

  const flushParagraph = (): void => {
    const text = paragraph.join(' ').trim();
    if (text) blocks.push({ type: 'paragraph', content: text });
    paragraph = [];
  };

  const flushList = (): void => {
    if (activeList?.items.length) blocks.push(activeList);
    activeList = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+?)\s*#*$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        content: heading[2],
      });
      return;
    }

    const bullet = trimmed.match(/^[-*+]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      if (activeList?.type !== 'unordered-list') {
        flushList();
        activeList = { type: 'unordered-list', items: [] };
      }
      activeList.items.push(bullet[1]);
      return;
    }

    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (activeList?.type !== 'ordered-list') {
        flushList();
        activeList = { type: 'ordered-list', items: [] };
      }
      activeList.items.push(ordered[1]);
      return;
    }

    flushList();
    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();
  return blocks;
}
