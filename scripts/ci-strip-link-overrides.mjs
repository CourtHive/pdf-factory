// Remove ONLY `link:` overrides, so CI resolves the PUBLISHED dependency.
//
// CI has no sibling checkout, so `tods-competition-factory: link:../factory` cannot resolve
// there. Stripping it is not merely a workaround: it makes the gate exercise what consumers
// actually install (devDependency 6.37.2, peer ^6.0.0) rather than whatever happens to be in
// the neighbouring working tree.
//
// Deliberately narrower than npm-publish.yml's strip, which deletes the whole `overrides:`
// block. That block also carries SECURITY FLOORS (fast-uri, dompurify) and the TypeScript
// pin; dropping them would quietly weaken the very build being verified. This removes the
// link: lines and nothing else.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

let removed = 0;

const ws = 'pnpm-workspace.yaml';
if (existsSync(ws)) {
  const before = readFileSync(ws, 'utf8');
  const after = before.replace(/^[ \t]+[^\s#][^:\n]*:[ \t]*link:.*\n/gm, '');
  removed += before.split('\n').length - after.split('\n').length;
  writeFileSync(ws, after);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.pnpm?.overrides) {
  for (const [k, v] of Object.entries(pkg.pnpm.overrides)) {
    if (String(v).startsWith('link:')) {
      delete pkg.pnpm.overrides[k];
      removed += 1;
    }
  }
  if (!Object.keys(pkg.pnpm.overrides).length) delete pkg.pnpm.overrides;
  if (pkg.pnpm && !Object.keys(pkg.pnpm).length) delete pkg.pnpm;
  writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
}

// A silent no-op would mean the override moved and CI is quietly testing the wrong thing.
if (removed === 0) {
  console.error('ci-strip-link-overrides: found no link: override to remove — did it move?');
  process.exit(1);
}
console.log(`ci-strip-link-overrides: removed ${removed} link: override(s)`);
