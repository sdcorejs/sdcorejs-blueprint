// Minimal Markdown reader for the Blueprint docs.
// Only reads the structure the site needs: headings (GitHub slugs), fenced code
// blocks with their `<!-- example: … -->` / `<!-- excerpt: … -->` markers, and list items.
import GithubSlugger from 'github-slugger';

const FENCE = /^(```+|~~~+)\s*([\w+-]*)/u;
const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/u;
const MARKER = /^<!--\s*(example|excerpt):\s*(\S+)\s*-->\s*$/u;
const LIST_ITEM = /^[-*]\s+(?:\[[ xX]\]\s+)?(.*)$/u;

/** Plain heading text as GitHub renders it before slugging. */
export function headingPlainText(raw) {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/`([^`]*)`/gu, '$1')
    .replace(/(\*\*|__|\*|_)(.+?)\1/gu, '$2')
    .trim();
}

/**
 * @param {string} text Markdown source
 * @param {string} file repo-relative path, used in messages
 */
export function parseMarkdown(text, file) {
  const lines = text.replace(/\r\n?/gu, '\n').split('\n');
  const slugger = new GithubSlugger();
  const headings = [];
  const blocks = [];
  let fence = null;
  let pendingMarker = null;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (fence) {
      const close = /^(```+|~~~+)\s*$/u.exec(line);
      if (close && close[1][0] === fence.token[0] && close[1].length >= fence.token.length) {
        fence.block.code = lines.slice(fence.start + 1, index).join('\n');
        fence.block.endLine = index + 1;
        blocks.push(fence.block);
        fence = null;
      }
      continue;
    }
    const fenceMatch = FENCE.exec(line);
    if (fenceMatch) {
      fence = {
        token: fenceMatch[1],
        start: index,
        block: {
          line: index + 1,
          lang: fenceMatch[2] || 'text',
          marker: pendingMarker,
          code: '',
        },
      };
      pendingMarker = null;
      continue;
    }
    const marker = MARKER.exec(line.trim());
    if (marker) {
      pendingMarker = { kind: marker[1], path: marker[2], line: index + 1 };
      continue;
    }
    if (line.trim() !== '') pendingMarker = null;
    const heading = HEADING.exec(line);
    if (heading) {
      const plain = headingPlainText(heading[2]);
      headings.push({ level: heading[1].length, text: plain, raw: heading[2], slug: slugger.slug(plain), line: index + 1 });
    }
  }
  if (fence) throw new Error(`${file}: code fence mở ở dòng ${fence.start + 1} không được đóng`);

  // Section bounds: `end` = next heading of any level, `subtreeEnd` = next heading of same or higher level.
  headings.forEach((heading, position) => {
    const next = headings[position + 1];
    heading.end = next ? next.line : lines.length + 1;
    const sibling = headings.slice(position + 1).find(other => other.level <= heading.level);
    heading.subtreeEnd = sibling ? sibling.line : lines.length + 1;
  });
  for (const block of blocks) {
    const owner = [...headings].reverse().find(heading => heading.line < block.line);
    block.heading = owner ? owner.slug : null;
  }
  const counters = new Map();
  for (const block of blocks) {
    const key = block.heading ?? '';
    block.index = counters.get(key) ?? 0;
    counters.set(key, block.index + 1);
  }
  return { file, lines, headings, blocks, text: lines.join('\n') };
}

export function findHeading(doc, slug) {
  return doc.headings.find(heading => heading.slug === slug) ?? null;
}

/** Text of a section including its sub-headings. Without slug: whole document. */
export function sectionText(doc, slug, { subtree = true } = {}) {
  if (!slug) return doc.text;
  const heading = findHeading(doc, slug);
  if (!heading) return null;
  return doc.lines.slice(heading.line - 1, (subtree ? heading.subtreeEnd : heading.end) - 1).join('\n');
}

/** Top-level list items directly under a heading (continuation lines are joined). */
export function sectionListItems(doc, slug) {
  const heading = findHeading(doc, slug);
  if (!heading) return null;
  const items = [];
  let inFence = false;
  for (const line of doc.lines.slice(heading.line, heading.end - 1)) {
    if (FENCE.test(line)) inFence = !inFence;
    if (inFence) continue;
    const item = LIST_ITEM.exec(line);
    if (item) items.push(item[1].trim());
    else if (items.length && /^\s{2,}\S/u.test(line)) items[items.length - 1] += ' ' + line.trim();
  }
  return items;
}

/** Normalise prose for quote comparison: drop Markdown inline syntax and collapse whitespace. */
export function normaliseProse(text) {
  return headingPlainText(String(text))
    .replace(/[`*_]/gu, '')
    .replace(/[“”]/gu, '"')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLowerCase();
}
