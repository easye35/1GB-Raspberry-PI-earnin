#!/bin/bash
# Install Pi Dashboard as a systemd service (no Docker)
set -e
SERVICE=pi-dashboard
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
UVICORN=$(which uvicorn 2>/dev/null || echo "/usr/local/bin/uvicorn")
USR=$(whoami)
echo "Installing systemd service: $SERVICE"
sudo tee /etc/systemd/system/${SERVICE}.service > /dev/null <<EOF
[Unit]
Description=Pi Dashboard
After=network.target

[Service]
Type=simple
User=${USR}
WorkingDirectory=${PROJECT_DIR}/backend
ExecStart=${UVICORN} main:app --host 0.0.0.0 --port 8000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE
sudo systemctl restart $SERVICE
echo "Done. Dashboard running at http://localhost:8000"
sudo systemctl status $SERVICE --no-pager
