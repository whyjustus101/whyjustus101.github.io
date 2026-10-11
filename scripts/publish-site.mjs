#!/usr/bin/env node
import { cp, mkdtemp, readdir, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const remote = 'https://github.com/whyjustus101/whyjustus101.github.io.git';
const branch = 'gh-pages';
const archive = '4f8f0932b4b577ab6570b6f4764d66d8c856b690';
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const identity = { name: 'whyjustus101', email: '116079361+whyjustus101@users.noreply.github.com' };
const env = {
  ...process.env,
  GIT_TERMINAL_PROMPT: '0',
  GIT_AUTHOR_NAME: identity.name,
  GIT_AUTHOR_EMAIL: identity.email,
  GIT_COMMITTER_NAME: identity.name,
  GIT_COMMITTER_EMAIL: identity.email,
};
let temporary;

function run(command, args, cwd = repo) {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr.trim() || `${command} failed (${result.status})`);
  return result.stdout.trim();
}

function git(args, cwd) {
  return run('git', ['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential', ...args], cwd);
}

async function publish() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log('Usage: node scripts/publish-site.mjs --dry-run | --publish\nTarget: whyjustus101/whyjustus101.github.io, gh-pages');
    return;
  }
  if (args.length !== 1 || !['--dry-run', '--publish'].includes(args[0])) throw new Error('Choose --dry-run to prepare and inspect, or --publish to commit and push.');
  run('gh', ['--version']);
  const sourceBranch = git(['branch', '--show-current']);
  if (!sourceBranch || sourceBranch === branch) throw new Error('Run from a source branch, not gh-pages or a detached HEAD.');

  temporary = await realpath(await mkdtemp(join(tmpdir(), 'whyjustus101-pages-')));
  const checkout = join(temporary, 'checkout');
  const legacy = join(temporary, 'legacy');
  const output = join(temporary, 'build');
  git(['clone', '--quiet', '--depth', '1', '--single-branch', '--branch', branch, remote, checkout]);
  git(['fetch', '--quiet', '--depth', '1', 'origin', archive], checkout);
  git(['worktree', 'add', '--quiet', '--detach', legacy, archive], checkout);
  console.log(run(process.execPath, [join(repo, 'scripts/build-site.mjs'), '--legacy', legacy, '--out', output]));

  // Only this freshly created temporary checkout is ever cleared.
  if (await realpath(checkout) !== checkout || git(['rev-parse', '--show-toplevel'], checkout) !== checkout || git(['branch', '--show-current'], checkout) !== branch || git(['remote', 'get-url', 'origin'], checkout) !== remote) {
    throw new Error('Temporary checkout did not match the fixed publication target.');
  }
  for (const name of await readdir(checkout)) {
    if (name !== '.git') await rm(join(checkout, name), { recursive: true, force: true });
  }
  await cp(output, checkout, { recursive: true, filter: path => !['.git', '.site-build-output'].includes(basename(path)) });
  git(['add', '--all'], checkout);
  const changed = git(['diff', '--cached', '--name-only'], checkout);
  console.log(changed ? git(['diff', '--cached', '--shortstat'], checkout) : 'No published files changed.');
  if (args[0] === '--dry-run') {
    console.log(`Dry run only: no commit or push.\nReview directory: ${checkout}\nRun git diff --cached there to inspect the prepared changes.`);
    return;
  }
  if (changed) {
    git(['-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Publish independent ocean site'], checkout);
    git(['push', 'origin', `HEAD:refs/heads/${branch}`], checkout);
    console.log('Published: https://whyjustus101.github.io/ (Pages may take a moment to update).');
  }
  await rm(temporary, { recursive: true, force: true });
}

publish().catch(error => {
  console.error(`Publish failed: ${error.message}${temporary ? `\nTemporary files retained: ${temporary}` : ''}`);
  process.exitCode = 1;
});
