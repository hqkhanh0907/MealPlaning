#!/usr/bin/env node
/**
 * rename-style-2025.mjs
 *
 * Codemod Style 2016 → Style 2025 cho file Angular:
 *   foo.component.ts   -> foo.ts          + class FooComponent -> Foo
 *   foo.component.html -> foo.html
 *   foo.component.scss -> foo.scss
 *   foo.component.spec.ts -> foo.spec.ts
 *   bar.service.ts     -> bar.ts          + class BarService   -> Bar
 *   bar.service.spec.ts-> bar.spec.ts
 *   baz.guard.ts       -> baz-guard.ts    (giữ class theo functional guard)
 *
 * Pattern:
 *   --filter <substring>   : chỉ xử lý file path chứa substring (default: tất cả)
 *   --apply                : thực sự rename (default: dry-run)
 *   --no-class-rename      : chỉ rename file, không đổi class (an toàn cho legacy)
 *
 * Strategy:
 *   1. Dùng ts-morph load tsconfig.app.json để có Project có refs.
 *   2. Với mỗi sourceFile match suffix:
 *      a. Compute new path.
 *      b. Nếu là .component.ts/.service.ts: đổi class declaration name.
 *      c. moveImmediatelySync(newPath) — ts-morph tự update mọi import.
 *      d. Update templateUrl/styleUrl trong @Component decorator (vì .html/.scss cũng đổi tên).
 *      e. Rename .html/.scss/.spec.ts đi kèm bằng git mv.
 *   3. Save project.
 *
 * Note: KHÔNG xử lý .page.ts — Style 2025 vẫn cho phép suffix domain như .page.
 */

import { Project, SyntaxKind } from 'ts-morph';
import path from 'node:path';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const NO_CLASS_RENAME = args.includes('--no-class-rename');
const filterIdx = args.indexOf('--filter');
const FILTER = filterIdx >= 0 ? args[filterIdx + 1] : null;

function log(...m) { console.log(...m); }
function gitMv(from, to) {
  if (!APPLY) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  execSync(`git mv "${from}" "${to}"`, { cwd: ROOT, stdio: 'pipe' });
}
function exists(p) { return fs.existsSync(p); }

// ----- 1. Build project from tsconfig -----
const project = new Project({
  tsConfigFilePath: path.join(ROOT, 'tsconfig.app.json'),
  skipAddingFilesFromTsConfig: false,
});
// Also add specs
project.addSourceFilesAtPaths('src/**/*.spec.ts');

// ----- 2. Collect rename plans -----
/** @type {{ tsOld:string, tsNew:string, kind:'component'|'service'|'guard', classOld?:string, classNew?:string, htmlOld?:string, htmlNew?:string, scssOld?:string, scssNew?:string, specOld?:string, specNew?:string }[]} */
const plans = [];

const sourceFiles = project.getSourceFiles();

for (const sf of sourceFiles) {
  const fp = sf.getFilePath();
  if (FILTER && !fp.includes(FILTER)) continue;
  const rel = path.relative(ROOT, fp);
  if (!rel.startsWith('src/app/')) continue;

  let kind = null;
  let baseRegex = null;
  if (fp.endsWith('.component.ts') && !fp.endsWith('.spec.ts')) {
    kind = 'component';
    baseRegex = /\.component\.ts$/;
  } else if (fp.endsWith('.service.ts') && !fp.endsWith('.spec.ts')) {
    kind = 'service';
    baseRegex = /\.service\.ts$/;
  } else if (fp.endsWith('.guard.ts') && !fp.endsWith('.spec.ts')) {
    kind = 'guard';
    baseRegex = /\.guard\.ts$/;
  } else {
    continue;
  }

  const tsNew = fp.replace(baseRegex,
    kind === 'guard' ? '-guard.ts' : '.ts');

  const plan = { tsOld: fp, tsNew, kind };

  // companions
  if (kind === 'component') {
    const htmlOld = fp.replace(/\.component\.ts$/, '.component.html');
    const scssOld = fp.replace(/\.component\.ts$/, '.component.scss');
    if (exists(htmlOld)) {
      plan.htmlOld = htmlOld;
      plan.htmlNew = htmlOld.replace(/\.component\.html$/, '.html');
    }
    if (exists(scssOld)) {
      plan.scssOld = scssOld;
      plan.scssNew = scssOld.replace(/\.component\.scss$/, '.scss');
    }
  }
  const specOld = fp.replace(/\.ts$/, '.spec.ts');
  if (exists(specOld) && specOld !== fp) {
    plan.specOld = specOld;
    plan.specNew = specOld
      .replace(/\.component\.spec\.ts$/, '.spec.ts')
      .replace(/\.service\.spec\.ts$/, '.spec.ts')
      .replace(/\.guard\.spec\.ts$/, '-guard.spec.ts');
  }

  // class rename
  if (!NO_CLASS_RENAME && (kind === 'component' || kind === 'service')) {
    const cls = sf.getClasses().find(c => c.isExported());
    if (cls) {
      const old = cls.getName();
      if (kind === 'component' && old?.endsWith('Component')) {
        plan.classOld = old;
        plan.classNew = old.slice(0, -'Component'.length);
      } else if (kind === 'service' && old?.endsWith('Service')) {
        plan.classOld = old;
        plan.classNew = old.slice(0, -'Service'.length);
      }
    }
  }

  plans.push(plan);
}

// ----- 3. Print plan -----
log(`\nPlan: ${plans.length} file(s) to rename. APPLY=${APPLY}\n`);
for (const p of plans) {
  log(`[${p.kind}] ${path.relative(ROOT, p.tsOld)}`);
  log(`         -> ${path.relative(ROOT, p.tsNew)}`);
  if (p.classOld) log(`     class ${p.classOld} -> ${p.classNew}`);
  if (p.htmlOld) log(`     html  ${path.basename(p.htmlOld)} -> ${path.basename(p.htmlNew)}`);
  if (p.scssOld) log(`     scss  ${path.basename(p.scssOld)} -> ${path.basename(p.scssNew)}`);
  if (p.specOld) log(`     spec  ${path.basename(p.specOld)} -> ${path.basename(p.specNew)}`);
}
if (!APPLY) {
  log(`\n(dry-run) — pass --apply to execute.`);
  process.exit(0);
}

// ----- 4. Execute -----
log(`\nExecuting...`);

for (const p of plans) {
  const sf = project.getSourceFile(p.tsOld);
  if (!sf) { log(`  SKIP missing in project: ${p.tsOld}`); continue; }

  // 4a. update templateUrl / styleUrl in component decorator
  if (p.kind === 'component') {
    const cls = sf.getClasses().find(c => c.isExported());
    const dec = cls?.getDecorator('Component');
    if (dec) {
      const arg = dec.getArguments()[0];
      if (arg && arg.getKind() === SyntaxKind.ObjectLiteralExpression) {
        for (const prop of arg.getProperties()) {
          if (prop.getKind() !== SyntaxKind.PropertyAssignment) continue;
          const name = prop.getName();
          const init = prop.getInitializer();
          if (!init) continue;
          const txt = init.getText();
          if (name === 'templateUrl' && p.htmlOld) {
            const newRef = txt.replace(/\.component\.html/, '.html');
            init.replaceWithText(newRef);
          } else if (name === 'styleUrl' && p.scssOld) {
            const newRef = txt.replace(/\.component\.scss/, '.scss');
            init.replaceWithText(newRef);
          } else if (name === 'styleUrls' && p.scssOld) {
            init.replaceWithText(txt.replace(/\.component\.scss/g, '.scss'));
          }
        }
      }
    }
  }

  // 4b. rename class (ts-morph propagates references across project)
  if (p.classOld && p.classNew) {
    const cls = sf.getClasses().find(c => c.getName() === p.classOld);
    if (cls) {
      cls.rename(p.classNew);
    }
  }
}

// 4c. save text changes BEFORE moving files (so on-disk content has new refs)
project.saveSync();

// 4d. git mv companions first (html/scss/spec) — these have NO TS refs except templateUrl which we updated
for (const p of plans) {
  if (p.htmlOld) gitMv(p.htmlOld, p.htmlNew);
  if (p.scssOld) gitMv(p.scssOld, p.scssNew);
  if (p.specOld) gitMv(p.specOld, p.specNew);
}

// 4e. move TS files using git mv (ts-morph already updated import paths in memory; we need disk in sync)
// Strategy: write new file content via project.saveSync done; now physically rename via git mv.
// But ts-morph saved using OLD path. We need to: copy content to new path, git rm old path.
// Simplest: re-read content, write to new path, git rm old.
for (const p of plans) {
  if (!exists(p.tsOld)) continue;
  fs.mkdirSync(path.dirname(p.tsNew), { recursive: true });
  // Use git mv to preserve history
  execSync(`git mv "${p.tsOld}" "${p.tsNew}"`, { cwd: ROOT, stdio: 'pipe' });
}

// 4f. Now update import paths in ALL ts files that reference old paths.
// ts-morph updates imports by module specifier resolution. After the file moves on disk,
// we re-load a fresh project and let ts-morph fix references via getImportStringLiteralByModuleSpecifier.
// Simpler: do a regex pass over src/**/*.ts replacing import specifiers.

const tsFiles = execSync(`find src -name '*.ts' -not -name '*.d.ts'`, { cwd: ROOT, encoding: 'utf8' })
  .trim().split('\n').map(f => path.join(ROOT, f));

const replacements = [];
for (const p of plans) {
  // import specifier base (without extension)
  const oldBase = path.basename(p.tsOld, '.ts');           // foo.component | bar.service | baz.guard
  const newBase = path.basename(p.tsNew, '.ts');           // foo            | bar          | baz-guard
  if (oldBase === newBase) continue;
  replacements.push({ oldBase, newBase });
}

for (const file of tsFiles) {
  if (!exists(file)) continue;
  let txt = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const { oldBase, newBase } of replacements) {
    // match in import specifier strings: from '...path/oldBase' or from "...path/oldBase"
    const re = new RegExp(`(['"])([^'"]*\\/)?${oldBase.replace(/\./g, '\\.')}(['"])`, 'g');
    const next = txt.replace(re, (m, q1, prefix = '', q2) => {
      changed = true;
      return `${q1}${prefix}${newBase}${q2}`;
    });
    txt = next;
  }
  if (changed) fs.writeFileSync(file, txt);
}

log(`\nDone. ${plans.length} TS file(s) renamed. Run lint+test+build to verify.`);
