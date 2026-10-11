import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Marked } from './vendor/marked.mjs';

const origin = 'https://whyjustus101.github.io';

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function safeUrl(value, image = false) {
  const url = String(value || '').trim();
  // Control characters, backslashes, and character references must not hide a scheme.
  if (!url || /[\u0000-\u001f\u007f\\]/u.test(url) || /&(?:#\d+;?|#x[\da-f]+;?|[a-z]+;)/i.test(url)) return null;
  if (/^(?:https?:\/\/|mailto:)/i.test(url)) {
    try {
      const parsed = new URL(url);
      return ['https:', 'http:', ...(image ? [] : ['mailto:'])].includes(parsed.protocol) ? parsed.href : null;
    } catch {
      return null;
    }
  }
  if (url.startsWith('//') || /^[^/?#]*:/u.test(url)) return null;
  try {
    return new URL(url, origin).origin === origin ? url : null;
  } catch {
    return null;
  }
}

function plainText(tokens) {
  return tokens.map(token => token.tokens ? plainText(token.tokens) : token.type === 'br' ? ' ' : token.text || '').join('');
}

// Markdown text can already contain character references. Keep those references
// readable while still escaping literal HTML, including inline HTML tokens.
const escapeMarkdownText = value => escape(value).replace(/&amp;((?:#\d+|#x[\da-f]+|[a-z][a-z\d]+);)/gi, '&$1');

function renderMarkdown(source) {
  const ids = new Set();
  const contents = [];
  const parser = new Marked({
    gfm: true,
    async: false,
    renderer: {
      html({ text }) {
        return escape(text);
      },
      heading({ tokens, depth }) {
        const title = plainText(tokens);
        const slug = title.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'heading';
        const base = `section-${slug}`;
        let id = base;
        let suffix = 2;
        while (ids.has(id)) id = `${base}-${suffix++}`;
        ids.add(id);
        if (depth === 2) contents.push(`<li><a href="#${escape(id)}">${escapeMarkdownText(title)}</a></li>`);
        return `<h${depth} id="${escape(id)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const label = this.parser.parseInline(tokens);
        const url = safeUrl(href);
        if (!url) return label;
        const external = /^https?:\/\//i.test(url) && new URL(url).origin !== origin;
        return `<a href="${escape(url)}"${title ? ` title="${escape(title)}"` : ''}${external ? ' rel="noopener noreferrer"' : ''}>${label}</a>`;
      },
      image({ href, title, text }) {
        const url = safeUrl(href, true);
        if (!url) return escape(text);
        return `<img src="${escape(url)}" alt="${escape(text)}"${title ? ` title="${escape(title)}"` : ''} loading="lazy" decoding="async">`;
      },
    },
  });
  return { body: parser.parse(source), toc: contents.join('\n') };
}

function validateNotes(notes) {
  if (!Array.isArray(notes)) throw new Error('content/notes/index.json must be an array.');
  const slugs = new Set();
  for (const note of notes) {
    if (!note || typeof note !== 'object' || typeof note.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(note.slug) || note.slug.length > 100) {
      throw new Error('Every note needs a lowercase URL slug containing only letters, digits, and single hyphens.');
    }
    if (slugs.has(note.slug)) throw new Error(`Duplicate note slug: ${note.slug}`);
    slugs.add(note.slug);
    for (const key of ['title', 'description']) {
      if (typeof note[key] !== 'string' || !note[key].trim()) throw new Error(`Note ${note.slug} needs a nonempty ${key}.`);
    }
    if (typeof note.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(note.date) || Number.isNaN(Date.parse(note.date)) || new Date(note.date).toISOString().slice(0, 10) !== note.date) {
      throw new Error(`Note ${note.slug} needs a valid YYYY-MM-DD date.`);
    }
    if (!Array.isArray(note.tags) || note.tags.some(tag => typeof tag !== 'string' || !tag.trim())) {
      throw new Error(`Note ${note.slug} tags must be an array of nonempty strings.`);
    }
  }
  return [...notes].sort((first, second) => second.date.localeCompare(first.date) || first.slug.localeCompare(second.slug));
}

function fillTemplate(template, values) {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (placeholder, key) => {
    if (!Object.hasOwn(values, key)) throw new Error(`Unknown notes template placeholder: ${placeholder}`);
    return values[key];
  });
}

const dateLabel = date => `${date.slice(0, 4)} / ${date.slice(5, 7)}.${date.slice(8, 10)}`;
const tagsHtml = tags => tags.map(tag => `<span>${escape(tag)}</span>`).join('');

function noteList(notes) {
  return notes.map(note => `<a class="note-list-item" href="/notes/${note.slug}/" data-note data-search="${escape([note.title, note.description, ...note.tags].join(' '))}">
  <time class="note-list-date" datetime="${escape(note.date)}">${dateLabel(note.date)}</time>
  <div class="note-list-content"><div class="note-list-tags">${tagsHtml(note.tags)}</div><h2>${escape(note.title)}</h2><p>${escape(note.description)}</p></div>
  <span class="note-list-arrow" aria-hidden="true">→</span>
</a>`).join('\n');
}

function decodeXml(value) {
  return value.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, reference => {
    const named = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
    if (named[reference]) return named[reference];
    const number = Number.parseInt(reference.slice(reference[2].toLowerCase() === 'x' ? 3 : 2, -1), reference[2].toLowerCase() === 'x' ? 16 : 10);
    return Number.isInteger(number) && number <= 0x10ffff ? String.fromCodePoint(number) : reference;
  });
}

async function updateSitemap(out, notes) {
  const path = join(out, 'sitemap.xml');
  let sitemap;
  try {
    sitemap = await readFile(path, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n';
  }
  if (!/<urlset(?:\s[^>]*)?>/.test(sitemap) || !/<\/urlset\s*>/.test(sitemap)) {
    throw new Error('Existing sitemap.xml must contain a URL set.');
  }
  const existing = new Set([...sitemap.matchAll(/<loc>\s*([^<]*)\s*<\/loc>/g)].map(match => decodeXml(match[1].trim())));
  const urls = [`${origin}/`, `${origin}/notes/`, ...notes.map(note => `${origin}/notes/${note.slug}/`)];
  const additions = urls.filter(url => !existing.has(url)).map(url => `  <url><loc>${escape(url)}</loc></url>\n`).join('');
  await writeFile(path, sitemap.replace(/<\/urlset\s*>/, `${additions}</urlset>`));
}

export async function renderNotes(out, repo) {
  const content = join(repo, 'content', 'notes');
  const templates = join(repo, 'scripts', 'templates');
  const [metadata, listTemplate, articleTemplate] = await Promise.all([
    readFile(join(content, 'index.json'), 'utf8'),
    readFile(join(templates, 'notes-index.html'), 'utf8'),
    readFile(join(templates, 'note-article.html'), 'utf8'),
  ]);
  const notes = validateNotes(JSON.parse(metadata));
  const defaults = {
    TITLE: '笔记', DESCRIPTION: '关于代码、原理与实践的学习笔记。', CANONICAL: `${origin}/notes/`,
    DATE: '', DATE_LABEL: '', TAGS: '', ARTICLE_BODY: '', TOC: '', NOTE_LIST: noteList(notes), NOTE_COUNT: String(notes.length),
  };
  await mkdir(join(out, 'notes'), { recursive: true });
  await writeFile(join(out, 'notes', 'index.html'), fillTemplate(listTemplate, defaults));
  for (const note of notes) {
    const source = join(content, `${note.slug}.md`);
    if (!(await lstat(source)).isFile()) throw new Error(`Note source must be a regular file, never a symlink: ${note.slug}`);
    const { body, toc } = renderMarkdown(await readFile(source, 'utf8'));
    const article = fillTemplate(articleTemplate, {
      ...defaults, TITLE: escape(note.title), DESCRIPTION: escape(note.description), CANONICAL: `${origin}/notes/${note.slug}/`,
      DATE: escape(note.date), DATE_LABEL: dateLabel(note.date), TAGS: tagsHtml(note.tags), ARTICLE_BODY: body, TOC: toc,
    });
    await mkdir(join(out, 'notes', note.slug), { recursive: true });
    await writeFile(join(out, 'notes', note.slug, 'index.html'), article);
  }
  await updateSitemap(out, notes);
  return { count: notes.length };
}
