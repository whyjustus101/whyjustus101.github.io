#!/usr/bin/env node
import { cp, lstat, mkdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderNotes } from './render-notes.mjs';

const repo = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const markerName = '.site-build-output';
const marker = `static-home-build-v1:${createHash('sha256').update(repo).digest('hex')}\n`;

function contains(parent, child) {
  const difference = relative(parent, child);
  return difference === '' || (!isAbsolute(difference) && difference !== '..' && !difference.startsWith(`..${sep}`));
}

function overlaps(first, second) {
  return contains(first, second) || contains(second, first);
}

async function inspect(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

// Resolve existing parent symlinks even when the output directory does not exist.
async function canonical(path) {
  if (await inspect(path)) return realpath(path);
  return join(await canonical(dirname(path)), basename(path));
}

async function requireFile(path) {
  if (!(await inspect(path))?.isFile()) throw new Error(`Required file is missing or is not a regular file: ${path}`);
}

async function build() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log('Usage: node scripts/build-site.mjs [--legacy <published-snapshot>] [--out <directory>]\nDefault: build site/ and content/notes/ into <repository>/dist');
    return;
  }
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!['--legacy', '--out'].includes(key) || !value || value.startsWith('--') || options[key]) {
      throw new Error('Options: --legacy <published-snapshot>, --out <directory>. Use --help for usage.');
    }
    options[key] = value;
  }
  const site = await realpath(join(repo, 'site'));
  const legacy = options['--legacy'] ? await realpath(resolve(options['--legacy'])) : null;
  if (legacy) {
    if (!(await stat(legacy)).isDirectory()) throw new Error('--legacy must be a directory.');
    if (overlaps(site, legacy) || contains(legacy, repo)) throw new Error('Legacy input must be separate from the site source and must not contain the repository.');
    await requireFile(join(legacy, 'index.html'));
  }
  await Promise.all(['index.html', 'material.css', 'styles.css', 'main.js', 'ocean.js', 'particles.js'].map(name => requireFile(join(site, name))));
  if (!(await inspect(join(site, 'assets')))?.isDirectory()) throw new Error('Required site/assets directory is missing.');
  await Promise.all(['ocean-hd-poster.webp', 'ocean-hd-poster-mobile.webp', 'ocean-dome-1080p.mp4', 'ocean-dome-720p.mp4'].map(name => requireFile(join(site, 'assets', name))));

  const requestedOut = resolve(options['--out'] || join(repo, 'dist'));
  const existing = await inspect(requestedOut);
  if (existing && (!existing.isDirectory() || existing.isSymbolicLink())) throw new Error('Output must be a regular directory, never a file or symlink.');
  const out = await canonical(requestedOut);
  const home = await realpath(homedir());
  if (out === parse(out).root || contains(out, home) || contains(out, repo) || overlaps(out, site) || (legacy && overlaps(out, legacy)) || basename(out).startsWith('.')) {
    throw new Error('Unsafe output path: choose a separate build directory such as dist.');
  }
  const outputMarker = join(out, markerName);
  if (existing) {
    const markerInfo = await inspect(outputMarker);
    if (!markerInfo?.isFile() || await readFile(outputMarker, 'utf8') !== marker) {
      throw new Error(`Refusing to clear an unrecognized directory: ${out}. Choose a new output path.`);
    }
    await rm(out, { recursive: true });
  }
  await mkdir(out, { recursive: true });
  // Mark before copying so a failed build can be retried safely.
  await writeFile(outputMarker, marker);
  const copyOptions = excludeDocs => ({
    recursive: true,
    force: true,
    filter: async source => {
      const name = basename(source);
      if (name === '.git' || name === markerName || (excludeDocs && name === 'ASSETS.md')) return false;
      if ((await lstat(source)).isSymbolicLink()) throw new Error(`Source symlinks are not supported: ${source}`);
      return true;
    },
  });
  if (legacy) await cp(legacy, out, copyOptions(false));
  await cp(site, out, copyOptions(true));
  const notes = await renderNotes(out, repo);
  const homeTemplate = await readFile(join(site, 'index.html'), 'utf8');
  if (homeTemplate.split('{{RECENT_ARTICLES}}').length !== 2) throw new Error('Homepage needs exactly one {{RECENT_ARTICLES}} placeholder.');
  await writeFile(join(out, 'index.html'), homeTemplate.replace('{{RECENT_ARTICLES}}', () => notes.recentArticles));
  await writeFile(join(out, '.nojekyll'), '');
  console.log(`Built ${out}\nSource: site/ and ${notes.count} note(s)${legacy ? `\nPreserved archive: ${legacy}` : ''}`);
}

build().catch(error => {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
});
