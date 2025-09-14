#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR" && pwd)"

# macOS Terminal.app で別ウィンドウ(もしくはタブ)を開いて実行
osascript <<OSA
tell application "Terminal"
  activate

  -- Rails (composeをフォアグラウンドで起動してログを表示)
  set railsWin to do script "cd $ROOT_DIR && (docker compose version >/dev/null 2>&1 && docker compose -f docker-compose.yml up) || (docker-compose -f docker-compose.yml up)"
  delay 0.3

  -- Next.js
  set webWin to do script ""
  do script "cd $ROOT_DIR/web && npm run dev" in webWin
  delay 0.3

  -- voice-agent-server
  set voiceWin to do script ""
  do script "cd $ROOT_DIR/voice-agent-server && npm run dev" in voiceWin
end tell
OSA

echo "Terminal を3つ起動しました。"

