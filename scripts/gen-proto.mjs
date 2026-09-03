// 用 protobufjs-cli 把 proto/ 静态编译为 src/sdk/proto/pomelo.proto.{js,d.ts}。
// 生成物为 ESM static-module（自带 protobufjs 运行时依赖），可供 Vite / vitest 直接 import。
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliRoot = path.join(webRoot, 'node_modules', 'protobufjs-cli');
const protoDir = path.join(webRoot, 'proto');
const outDir = path.join(webRoot, 'src', 'sdk', 'proto');
const outBase = path.join(outDir, 'pomelo.proto');

if (!existsSync(protoDir)) {
  console.error('[proto:gen] 缺少 ' + protoDir + '，请先 npm run proto:sync');
  process.exit(1);
}

function listProtos(dir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listProtos(path.join(dir, entry.name), rel));
    else if (entry.name.endsWith('.proto')) out.push(path.join(dir, entry.name));
  }
  return out.sort();
}

const entries = listProtos(protoDir);
console.log(`[proto:gen] ${entries.length} 个 .proto`);

function run(bin, args) {
  const binPath = path.join(cliRoot, 'bin', bin);
  if (!existsSync(binPath)) {
    console.error(`[proto:gen] 找不到 ${binPath}，请先安装依赖`);
    process.exit(1);
  }
  const r = spawnSync(process.execPath, [binPath, ...args], { encoding: 'utf8' });
  if (r.status !== 0) {
    process.stderr.write(r.stderr || r.stdout || '');
    process.exit(r.status ?? 1);
  }
  return r.stdout;
}

// 1) 静态编译成 ESM 模块（-p 为 include 根，跨包 import 均相对它解析）
run('pbjs', [
  '--target', 'static-module',
  '--wrap', 'es6',
  '--path', protoDir,
  '--out', outBase + '.js',
  ...entries,
]);

// 2) 由 JS 生成 .d.ts（TS 里 import './pomelo.proto.js' 自动命中同名 .d.ts）
run('pbts', ['--out', outBase + '.d.ts', outBase + '.js']);

console.log(`[proto:gen] 完成 -> ${outBase}.js / ${outBase}.d.ts`);
