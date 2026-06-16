#!/usr/bin/env node
// 菜单刷新看护进程（无 launchd/cron 时的兜底）。
// 每天到点开始抓取，若失败/覆盖不全则每隔 retry-interval 分钟重试，
// 直到成功或过了 retry-until 截止时间，然后排到次日。
//
// 用法：
//   node scripts/watch-menu.mjs --schedule=09:00 --retry-interval=15 --retry-until=11:30
//   node scripts/watch-menu.mjs --run-now --once     # 立即跑一轮（含重试）后退出
//
// 注：更稳的做法是用系统级调度，见 scripts/install-launchd.sh（macOS launchd），
// 它在机器休眠错过时间点后会自动补跑，不依赖本进程常驻。
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const scheduleArg = process.argv.find((arg) => arg.startsWith("--schedule="));
const intervalArg = process.argv.find((arg) => arg.startsWith("--retry-interval="));
const untilArg = process.argv.find((arg) => arg.startsWith("--retry-until="));
const runNow = process.argv.includes("--run-now");
const once = process.argv.includes("--once");

const schedule = (scheduleArg?.split("=")[1] || "09:00")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const retryIntervalMs = Math.max(1, Number(intervalArg?.split("=")[1] || 15)) * 60 * 1000;
const retryUntil = untilArg?.split("=")[1] || "11:30";

main();

async function main() {
  if (runNow || once) await runCycle();
  if (once) return;
  scheduleNextRun();
}

// 一轮抓取：成功即止，否则按间隔重试到截止时间。
async function runCycle() {
  const date = today();
  let attempt = 0;
  while (true) {
    attempt += 1;
    if (runOnce(date, attempt)) return;
    if (pastDeadline(retryUntil)) {
      console.error(`[${stamp()}] 到达截止时间 ${retryUntil}，今日放弃，等待次日。`);
      return;
    }
    console.warn(`[${stamp()}] 第 ${attempt} 次失败，${retryIntervalMs / 60000} 分钟后重试。`);
    await sleep(retryIntervalMs);
  }
}

function runOnce(date, attempt) {
  console.log(`[${stamp()}] refreshing ${date} (attempt ${attempt})`);
  const result = spawnSync(
    process.execPath,
    ["scripts/fetch-bytecanteen.mjs", date, "--skip-if-fresh"],
    { cwd: root, stdio: "inherit" }
  );
  if (result.status === 0) {
    console.log(`[${stamp()}] refresh ok`);
    return true;
  }
  console.error(`[${stamp()}] refresh failed with exit code ${result.status}`);
  return false;
}

function scheduleNextRun() {
  const next = nextScheduledDate();
  const delay = next.getTime() - Date.now();
  console.log(`Next refresh at ${next.toLocaleString("zh-CN", { hour12: false })}`);
  setTimeout(async () => {
    await runCycle();
    scheduleNextRun();
  }, delay);
}

function nextScheduledDate() {
  const now = new Date();
  const candidates = schedule.map((time) => {
    const [hour, minute] = time.split(":").map(Number);
    const date = new Date(now);
    date.setHours(hour, minute, 0, 0);
    if (date <= now) date.setDate(date.getDate() + 1);
    return date;
  });
  return candidates.sort((a, b) => a - b)[0];
}

function pastDeadline(hhmm) {
  const [hour, minute] = hhmm.split(":").map(Number);
  const deadline = new Date();
  deadline.setHours(hour, minute, 0, 0);
  return Date.now() > deadline.getTime();
}

function today() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
}

function stamp() {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
