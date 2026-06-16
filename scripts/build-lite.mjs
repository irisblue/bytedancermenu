#!/usr/bin/env node
// 从现有 data/menu.json 重新生成精简版 data/menu.lite.json，并内嵌进 index.html。
// 不需要飞书 session，可随时本地运行：npm run build:lite
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeLiteOutputs } from "./lib-lite.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dataDir = resolve(root, "data");
const indexPath = resolve(root, "index.html");
const noEmbed = process.argv.includes("--no-embed");

const data = JSON.parse(readFileSync(resolve(dataDir, "menu.json"), "utf8"));
const { lite, litePath } = writeLiteOutputs(data, { dataDir, indexPath, embed: !noEmbed });
const dishes = lite.menus.reduce((sum, menu) => sum + menu.items.length, 0);
console.log(`Wrote ${lite.menus.length} menus / ${dishes} dishes to ${litePath}${noEmbed ? "" : " (embedded into index.html)"}`);
