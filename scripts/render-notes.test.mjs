import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderNotes } from './render-notes.mjs';

const note = { slug: 'example', title: '一篇笔记', date: '2024-11-18', description: '描述', tags: ['Kotlin'] };
const listTemplate = '<title>{{TITLE}}</title><main data-count="{{NOTE_COUNT}}">{{NOTE_LIST}}</main>';
const articleTemplate = '<title>{{TITLE}}</title><meta name="description" content="{{DESCRIPTION}}"><link rel="canonical" href="{{CANONICAL}}"><time datetime="{{DATE}}">{{DATE_LABEL}}</time><div>{{TAGS}}</div><ol>{{TOC}}</ol><article>{{ARTICLE_BODY}}</article>';

async function fixture(run, notes = [note]) {
  const root = await mkdtemp(join(tmpdir(), 'notes-render-test-'));
  const out = join(root, 'out');
  const content = join(root, 'content', 'notes');
  const templates = join(root, 'scripts', 'templates');
  await Promise.all([mkdir(out), mkdir(content, { recursive: true }), mkdir(templates, { recursive: true })]);
  await Promise.all([
    writeFile(join(content, 'index.json'), JSON.stringify(notes)),
    writeFile(join(content, 'example.md'), '## 标题\n\n正文。'),
    writeFile(join(templates, 'notes-index.html'), listTemplate),
    writeFile(join(templates, 'note-article.html'), articleTemplate),
  ]);
  try {
    await run({ root, out, content, templates, article: () => readFile(join(out, 'notes', 'example', 'index.html'), 'utf8') });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('renders Markdown formatting and keeps source HTML and unsafe URLs inert', async () => {
  await fixture(async ({ root, out, content, article }) => {
    await writeFile(join(content, 'example.md'), [
      '## 标题', '', '**粗体**、*斜体*、`<script>`。', '',
      '- 第一项', '  - 嵌套项', '', '> 引用', '',
      '```kotlin', 'val html = "<script>alert(1)</script>"', '```', '',
      '| 名称 | 值 |', '| --- | --- |', '| Kotlin | 1 |', '',
      '<script>alert("raw")</script>', '', '<img src=x onerror="alert(1)">', '',
      '[bad](javascript:alert(1)) [data](data:text/html,test) [encoded](javascript&#58;alert(1))', '',
      '![bad image](data:image/svg+xml,bad) [backslash](https:\\evil.test) [relative host](//evil.test)', '',
      '[good](https://example.org/path?q=a&b=c "a\\\"b") [mail](mailto:hello@example.org) [hash](#section-标题) [relative](/notes/)',
    ].join('\n'));
    await renderNotes(out, root);
    const html = await article();
    assert.match(html, /<strong>粗体<\/strong>/);
    assert.match(html, /<em>斜体<\/em>/);
    assert.match(html, /<blockquote>/);
    assert.match(html, /<table>/);
    assert.match(html, /<code class="language-kotlin">/);
    assert.match(html, /&lt;script&gt;alert\(&quot;raw&quot;\)&lt;\/script&gt;/);
    assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
    assert.doesNotMatch(html, /<(?:script|img)\b|href="(?:javascript|data|\/\/)|src="data:/i);
    assert.match(html, /href="https:\/\/example.org\/path\?q=a&amp;b=c"/);
    assert.match(html, /href="mailto:hello@example.org"/);
    assert.match(html, /href="\/notes\/"/);
  });
});

test('escapes metadata and generates unique, stable headings with only h2 in the directory', async () => {
  const escapedNote = { ...note, title: '"<标题>&', description: '"><script>bad</script>', tags: ['<Kotlin>'] };
  await fixture(async ({ root, out, content, article }) => {
    await writeFile(join(content, 'example.md'), '# Same\n\n## Same\n\n### Same\n\n## Same-2\n\n## 协程 *原理* &amp; 实践\n');
    await renderNotes(out, root);
    const html = await article();
    const ids = [...html.matchAll(/<h[1-6] id="([^"]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, 5);
    assert.equal(new Set(ids).size, 5);
    assert.deepEqual(ids.slice(0, 4), ['section-same', 'section-same-2', 'section-same-3', 'section-same-2-2']);
    assert.equal([...html.matchAll(/<li><a href="#/g)].length, 3);
    assert.match(html, /协程 原理 &amp; 实践<\/a>/);
    assert.match(html, /<title>&quot;&lt;标题&gt;&amp;<\/title>/);
    assert.match(html, /content="&quot;&gt;&lt;script&gt;bad&lt;\/script&gt;"/);
    assert.match(html, /<span>&lt;Kotlin&gt;<\/span>/);
    const list = await readFile(join(out, 'notes', 'index.html'), 'utf8');
    assert.match(list, /data-search="&quot;&lt;标题&gt;&amp; /);
    assert.match(list, /href="\/notes\/example\/"/);
    await renderNotes(out, root);
    assert.equal(await article(), html);
  }, [escapedNote]);
});

test('rejects traversal, duplicate slugs, impossible dates, and symbolic article sources', async () => {
  for (const invalid of ['../secret', 'a/b', 'UPPER', 'a--b', '', 5]) {
    await fixture(async ({ root, out }) => {
      await assert.rejects(renderNotes(out, root), /URL slug/);
    }, [{ ...note, slug: invalid }]);
  }
  await fixture(async ({ root, out }) => assert.rejects(renderNotes(out, root), /Duplicate note slug/), [note, note]);
  await fixture(async ({ root, out }) => assert.rejects(renderNotes(out, root), /valid YYYY-MM-DD/), [{ ...note, date: '2024-02-30' }]);
  await fixture(async ({ root, out, content }) => {
    await rm(join(content, 'example.md'));
    await symlink(join(content, 'index.json'), join(content, 'example.md'));
    await assert.rejects(renderNotes(out, root), /regular file, never a symlink/);
  });
});

test('keeps archived sitemap entries and adds each new page once', async () => {
  await fixture(async ({ root, out }) => {
    await writeFile(join(out, 'sitemap.xml'), '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://whyjustus101.github.io/</loc></url><url><loc>https://whyjustus101.github.io/blog/old/</loc><lastmod>2024-01-01</lastmod></url></urlset>');
    await renderNotes(out, root);
    await renderNotes(out, root);
    const sitemap = await readFile(join(out, 'sitemap.xml'), 'utf8');
    assert.match(sitemap, /\/blog\/old\/<\/loc><lastmod>2024-01-01<\/lastmod>/);
    assert.equal([...sitemap.matchAll(/<loc>/g)].length, 4);
    assert.match(sitemap, /<loc>https:\/\/whyjustus101.github.io\/notes\/<\/loc>/);
    assert.match(sitemap, /<loc>https:\/\/whyjustus101.github.io\/notes\/example\/<\/loc>/);
  });
});

test('reports unknown template placeholders instead of publishing them', async () => {
  await fixture(async ({ root, out, templates }) => {
    await writeFile(join(templates, 'notes-index.html'), '{{MISSING_VALUE}}');
    await assert.rejects(renderNotes(out, root), /Unknown notes template placeholder/);
  });
});
