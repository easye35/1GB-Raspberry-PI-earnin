# Pi Dashboard

Lightweight self-hosted system dashboard for 1 GB Raspberry Pi.
FastAPI backend + pure HTML/CSS/JS frontend. No Docker, no Node.js.

## Quick Start

    cd pi-dashboard/backend
    pip3 install -r requirements.txt
    cd ..
    bash scripts/start.sh

Open http://localhost:8000  or  http://YOUR-PI-IP:8000

## Features
- CPU, Memory, Disk, Temperature with 20-point sparkline history
- Network TX/RX sparklines
- Earnings breakdown panel with SVG donut chart
- Top system processes panel (live, auto-refreshed)
- Auto-refresh: stats 5 s, processes 10 s, earnings 30 s
- Unified Pi/Linux/Windows/Money SVG logo
- Optional systemd service installer

## API Endpoints
  GET /api/stats       CPU, memory, disk, temp, network + history
  GET /api/earnings    Earnings sources + daily/total summary
  GET /api/processes   Top 8 processes by CPU usage
  GET /api/health      Health check ping

## Customise Earnings
Edit the EARNINGS dict in backend/main.py.

## Run as Systemd Service (always-on)
    pip3 install -r backend/requirements.txt
    bash scripts/install.sh
