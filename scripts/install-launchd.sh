#!/usr/bin/env bash
# 安装 macOS launchd 定时任务：每天 09:00–11:30 每 15 分钟跑一次抓取，
# 配合 --skip-if-fresh —— 菜单齐了当天就不再打 API。
# launchd 的优势：机器休眠错过时间点后会在唤醒时自动补跑，不依赖常驻进程。
#
#   bash scripts/install-launchd.sh           # 安装并加载
#   bash scripts/install-launchd.sh --uninstall
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$(command -v node || true)"
LABEL="com.lunchmenu.refresh"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG_DIR="$ROOT/data/logs"

if [ "${1:-}" = "--uninstall" ]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Uninstalled $LABEL"
  exit 0
fi

if [ -z "$NODE" ]; then
  echo "找不到 node，请确认已安装并在 PATH 中。" >&2
  exit 1
fi

mkdir -p "$LOG_DIR" "$(dirname "$PLIST")"

# 生成 09:00–11:30 每 15 分钟的时间点
intervals=""
for h in 9 10 11; do
  for m in 0 15 30 45; do
    if [ "$h" -eq 11 ] && [ "$m" -gt 30 ]; then continue; fi
    intervals="$intervals
      <dict><key>Hour</key><integer>$h</integer><key>Minute</key><integer>$m</integer></dict>"
  done
done

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE</string>
    <string>$ROOT/scripts/fetch-bytecanteen.mjs</string>
    <string>--skip-if-fresh</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$ROOT</string>
  <key>StartCalendarInterval</key>
  <array>$intervals
  </array>
  <key>StandardOutPath</key>
  <string>$LOG_DIR/refresh.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/refresh.err.log</string>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
EOF

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "Loaded $LABEL"
echo "  时间点：每天 09:00–11:30 每 15 分钟"
echo "  日志：  $LOG_DIR/refresh.log"
echo "  卸载：  bash scripts/install-launchd.sh --uninstall"
