// node scripts/outline.mjs angular-portal/project-structure/routes.md
// In ra heading (kèm anchor dùng trong page-map/nội dung) và code block (index trong mục, marker, số dòng).
import { loadDocs } from './lib/model.mjs';

const docs = loadDocs();
const files = process.argv.slice(2);
if (!files.length) {
  console.log([...docs.keys()].join('\n'));
  process.exit(0);
}
for (const file of files) {
  const doc = docs.get(file);
  if (!doc) { console.error(`Không có ${file}. Các file: \n${[...docs.keys()].join('\n')}`); process.exit(1); }
  console.log(`# ${file}`);
  for (const heading of doc.headings) {
    console.log(`${'  '.repeat(heading.level - 1)}L${heading.line} ${file}#${heading.slug}`);
    for (const block of doc.blocks.filter(item => item.heading === heading.slug)) {
      const marker = block.marker ? ` ${block.marker.kind}: ${block.marker.path}` : '';
      console.log(`${'  '.repeat(heading.level)}  [block index ${block.index}] L${block.line} ${block.lang} ${block.code.split('\n').length} dòng${marker}`);
    }
  }
}
