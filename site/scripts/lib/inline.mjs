// Inline Markdown → HTML for short texts (content fields, list items, paragraphs). Always escapes HTML.
export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;');
}

/**
 * @param {string} text
 * @param {(href: string) => string | null} [resolveLink] maps a Markdown link target to a URL; null drops the link
 */
export function renderInline(text, resolveLink = href => href) {
  const source = String(text ?? '');
  const parts = [];
  // Split out code spans first so their content is never interpreted.
  const pattern = /(`+)([\s\S]*?[^`])\1(?!`)/gu;
  let last = 0;
  for (const match of source.matchAll(pattern)) {
    parts.push({ kind: 'text', value: source.slice(last, match.index) });
    parts.push({ kind: 'code', value: match[2].trim() });
    last = match.index + match[0].length;
  }
  parts.push({ kind: 'text', value: source.slice(last) });
  return parts.map(part => part.kind === 'code' ? `<code>${escapeHtml(part.value)}</code>` : renderText(part.value, resolveLink)).join('');
}

function renderText(text, resolveLink) {
  let html = escapeHtml(text);
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/gu, (_, label, href) => {
    const target = resolveLink(href.replace(/&amp;/gu, '&'));
    return target ? `<a href="${escapeHtml(target)}">${label}</a>` : label;
  });
  html = html.replace(/\*\*([^*]+)\*\*/gu, '<strong>$1</strong>');
  return html;
}
