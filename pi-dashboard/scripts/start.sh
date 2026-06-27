#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
echo "========================================"
echo "  Pi Dashboard — Starting"
echo "========================================"
if ! command -v python3 &>/dev/null; then
  echo "[ERROR] python3 not found."
  echo "  Install: sudo apt install python3 python3-pip"
  exit 1
fi
cd "$PROJECT_DIR/backend"
if ! python3 -c "import fastapi" 2>/dev/null; then
  echo "[INFO] Installing dependencies..."
  pip3 install -r requirements.txt --quiet
fi
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo "[INFO] Open: http://localhost:8000  or  http://${IP}:8000"
echo "[INFO] Ctrl+C to stop"
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
