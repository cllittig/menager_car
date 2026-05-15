






import { createRequire } from 'module';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);


const ts = require('./backend/node_modules/typescript');

const ROOT = __dirname;
const EXCLUDED_DIRS = new Set(['node_modules', '.next', 'dist', 'build', '.git', 'coverage', '.turbo', 'out']);
const TS_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SQL_EXTS = new Set(['.sql']);
const SH_EXTS = new Set(['.sh', '.bash']);

let totalFiles = 0;
let totalComments = 0;
const modifiedFiles = [];



function stripTSComments(source, filePath) {
  const ext = extname(filePath).toLowerCase();
  const scriptKind = ext === '.tsx' || ext === '.jsx'
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;

  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false, 
    ts.LanguageVariant.JSX,
    source,
  );

  const commentRanges = [];

  let kind;
  while ((kind = scanner.scan()) !== ts.SyntaxKind.EndOfFileToken) {
    if (
      kind === ts.SyntaxKind.SingleLineCommentTrivia ||
      kind === ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      commentRanges.push({
        start: scanner.getTokenStart(),
        end: scanner.getTokenEnd(),
        kind,
      });
    }
  }

  if (commentRanges.length === 0) return { text: source, count: 0 };


  let result = '';
  let pos = 0;

  for (const range of commentRanges) {
    result += source.substring(pos, range.start);

    if (range.kind === ts.SyntaxKind.MultiLineCommentTrivia) {

      const comment = source.substring(range.start, range.end);
      const newlines = (comment.match(/\n/g) || []).length;
      result += '\n'.repeat(newlines);
    }

    pos = range.end;
  }

  result += source.substring(pos);


  result = result.replace(/^[ \t]+$/gm, '');

  return { text: result, count: commentRanges.length };
}



function stripSQLComments(source) {
  let result = '';
  let i = 0;
  let count = 0;
  const len = source.length;

  while (i < len) {
    const ch = source[i];


    if (ch === "'") {
      let j = i + 1;
      while (j < len) {
        if (source[j] === "'" && source[j + 1] === "'") { j += 2; continue; }
        if (source[j] === "'") { j++; break; }
        j++;
      }
      result += source.substring(i, j);
      i = j;
      continue;
    }


    if (ch === '$') {
      const dollarEnd = source.indexOf('$', i + 1);
      if (dollarEnd !== -1) {
        const tag = source.substring(i, dollarEnd + 1);
        const closeTag = source.indexOf(tag, dollarEnd + 1);
        if (closeTag !== -1) {
          result += source.substring(i, closeTag + tag.length);
          i = closeTag + tag.length;
          continue;
        }
      }
    }


    if (ch === '-' && source[i + 1] === '-') {
      let j = i;
      while (j < len && source[j] !== '\n') j++;
      count++;
      i = j; 
      continue;
    }


    if (ch === '/' && source[i + 1] === '*') {
      let j = i + 2;
      let newlines = 0;
      while (j < len) {
        if (source[j] === '\n') newlines++;
        if (source[j] === '*' && source[j + 1] === '/') { j += 2; break; }
        j++;
      }
      result += '\n'.repeat(newlines);
      count++;
      i = j;
      continue;
    }

    result += ch;
    i++;
  }

  return { text: result, count };
}



function stripShellComments(source) {
  const lines = source.split('\n');
  let count = 0;

  const result = lines.map((line, idx) => {

    if (idx === 0 && line.startsWith('#!')) return line;

    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const prev = line[i - 1];

      if (c === "'" && !inDouble) { inSingle = !inSingle; continue; }
      if (c === '"' && !inSingle && prev !== '\\') { inDouble = !inDouble; continue; }

      if (c === '#' && !inSingle && !inDouble) {
        count++;
        return line.substring(0, i).trimEnd();
      }
    }

    return line;
  });

  return { text: result.join('\n'), count };
}



function getAllFiles(dir, files = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return files; }

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry)) continue;

    const fullPath = join(dir, entry);
    let stat;
    try { stat = statSync(fullPath); } catch { continue; }

    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      const ext = extname(entry).toLowerCase();
      if (TS_EXTS.has(ext) || SQL_EXTS.has(ext) || SH_EXTS.has(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}



const files = getAllFiles(ROOT);
console.log(`\nFound ${files.length} source files to process.\n`);

for (const filePath of files) {
  totalFiles++;
  const ext = extname(filePath).toLowerCase();
  const relPath = relative(ROOT, filePath);

  let source;
  try {
    source = readFileSync(filePath, 'utf-8');
  } catch (e) {
    console.error(`  ERROR reading: ${relPath} — ${e.message}`);
    continue;
  }

  let stripped;
  try {
    if (TS_EXTS.has(ext)) {
      stripped = stripTSComments(source, filePath);
    } else if (SQL_EXTS.has(ext)) {
      stripped = stripSQLComments(source);
    } else if (SH_EXTS.has(ext)) {
      stripped = stripShellComments(source);
    } else {
      continue;
    }
  } catch (e) {
    console.error(`  ERROR processing: ${relPath} — ${e.message}`);
    continue;
  }

  if (stripped.count === 0) continue;

  try {
    writeFileSync(filePath, stripped.text, 'utf-8');
    totalComments += stripped.count;
    modifiedFiles.push({ path: relPath, comments: stripped.count });
    console.log(`  [${stripped.count.toString().padStart(3)}] ${relPath}`);
  } catch (e) {
    console.error(`  ERROR writing: ${relPath} — ${e.message}`);
  }
}

console.log('\n' + '─'.repeat(70));
console.log(`Files scanned   : ${totalFiles}`);
console.log(`Files modified  : ${modifiedFiles.length}`);
console.log(`Comments removed: ${totalComments}`);
console.log('─'.repeat(70) + '\n');
