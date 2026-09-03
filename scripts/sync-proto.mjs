// 从 pomelo 仓把 .proto 源镜像到本仓 proto/。
// 源目录可用环境变量 POMELO_PROTO_SRC 覆盖；不存在时跳过（保留本地已有副本）。
import { existsSync, cpSync, rmSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.resolve(process.env.POMELO_PROTO_SRC ?? '../pomelo/pomelo-common/src/main/proto');
const dst = path.join(webRoot, 'proto');

if (!existsSync(src)) {
  console.warn(`[proto:sync] 未找到源 ${src}（可用 POMELO_PROTO_SRC 指定），跳过同步，保留本地 proto/`);
  process.exit(0);
}

rmSync(dst, { recursive: true, force: true });
cpSync(src, dst, { recursive: true });
const count = readdirSync(dst, { recursive: true }).filter((f) => String(f).endsWith('.proto')).length;
console.log(`[proto:sync] ${src} -> ${dst}（${count} 个 .proto）`);
