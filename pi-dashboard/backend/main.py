"""Pi Dashboard - FastAPI Backend (no Docker)"""
import time, random
from collections import deque
from datetime import datetime
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

app = FastAPI(title="Pi Dashboard", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

HISTORY_LEN = 20
history = {
    "cpu":    deque([0]*HISTORY_LEN, maxlen=HISTORY_LEN),
    "memory": deque([0]*HISTORY_LEN, maxlen=HISTORY_LEN),
    "disk":   deque([0]*HISTORY_LEN, maxlen=HISTORY_LEN),
    "temp":   deque([0]*HISTORY_LEN, maxlen=HISTORY_LEN),
    "net_tx": deque([0]*HISTORY_LEN, maxlen=HISTORY_LEN),
    "net_rx": deque([0]*HISTORY_LEN, maxlen=HISTORY_LEN),
}
_prev_net = {"bytes_sent": 0, "bytes_recv": 0, "ts": time.time()}

EARNINGS = {
    "pi_mining":    {"label": "Pi Mining",      "daily": 1.24,  "total": 412.80,  "currency": "PI",  "color": "#f97316"},
    "linux_vps":    {"label": "Linux VPS",       "daily": 3.50,  "total": 1050.00, "currency": "USD", "color": "#22c55e"},
    "windows_task": {"label": "Windows Tasks",   "daily": 2.10,  "total": 630.00,  "currency": "USD", "color": "#3b82f6"},
    "staking":      {"label": "Staking Rewards", "daily": 0.85,  "total": 255.00,  "currency": "USD", "color": "#a855f7"},
}

# ── helpers ────────────────────────────────────────────────────
def _cpu():
    return psutil.cpu_percent(interval=None) if HAS_PSUTIL else random.uniform(10, 80)

def _memory():
    return psutil.virtual_memory().percent if HAS_PSUTIL else random.uniform(30, 75)

def _disk():
    return psutil.disk_usage("/").percent if HAS_PSUTIL else random.uniform(20, 90)

def _temp():
    try:
        with open("/sys/class/thermal/thermal_zone0/temp") as f:
            return round(int(f.read().strip()) / 1000, 1)
    except Exception:
        pass
    if HAS_PSUTIL:
        try:
            temps = psutil.sensors_temperatures()
            for key in ("cpu_thermal", "coretemp", "acpitz"):
                if key in temps and temps[key]:
                    return round(temps[key][0].current, 1)
        except Exception:
            pass
    return round(random.uniform(38, 68), 1)

def _network():
    global _prev_net
    if HAS_PSUTIL:
        net = psutil.net_io_counters()
        now = time.time()
        dt  = max(now - _prev_net["ts"], 0.001)
        tx  = (net.bytes_sent - _prev_net["bytes_sent"]) / dt / 1024
        rx  = (net.bytes_recv - _prev_net["bytes_recv"]) / dt / 1024
        _prev_net = {"bytes_sent": net.bytes_sent, "bytes_recv": net.bytes_recv, "ts": now}
        return max(tx, 0), max(rx, 0)
    return random.uniform(0, 500), random.uniform(0, 500)

def _uptime():
    if HAS_PSUTIL:
        secs = int(time.time() - psutil.boot_time())
    else:
        secs = int(time.time() % 86400 + 3600)
    h, rem  = divmod(secs, 3600)
    m, s    = divmod(rem, 60)
    days    = h // 24; h = h % 24
    return f"{days}d {h}h {m}m" if days else f"{h}h {m}m {s}s"

def _processes():
    """Return top 8 processes sorted by CPU usage."""
    if not HAS_PSUTIL:
        # demo data when psutil unavailable
        demo = [
            ("python3",    "1234", 12.4, 4.2),
            ("uvicorn",    "1235",  8.1, 2.1),
            ("bash",       "1100",  2.3, 0.4),
            ("sshd",       " 890",  1.8, 0.3),
            ("systemd",    "   1",  0.9, 1.8),
            ("cron",       " 420",  0.4, 0.1),
            ("nginx",      " 501",  0.2, 0.5),
            ("rsyslogd",   " 312",  0.1, 0.2),
        ]
        return [{"name": n, "pid": p, "cpu": c, "mem": m} for n, p, c, m in demo]
    procs = []
    for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
        try:
            procs.append({
                "name": proc.info["name"],
                "pid":  str(proc.info["pid"]),
                "cpu":  round(proc.info["cpu_percent"] or 0, 1),
                "mem":  round(proc.info["memory_percent"] or 0, 1),
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    procs.sort(key=lambda x: x["cpu"], reverse=True)
    return procs[:8]

# ── endpoints ─────────────────────────────────────────────────
@app.get("/api/stats")
def get_stats():
    cpu  = _cpu();  mem  = _memory()
    disk = _disk(); temp = _temp()
    tx, rx = _network()
    history["cpu"].append(round(cpu, 1))
    history["memory"].append(round(mem, 1))
    history["disk"].append(round(disk, 1))
    history["temp"].append(round(temp, 1))
    history["net_tx"].append(round(tx, 1))
    history["net_rx"].append(round(rx, 1))
    return {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "uptime":  _uptime(),
        "cpu":     {"value": round(cpu, 1),  "history": list(history["cpu"])},
        "memory":  {"value": round(mem, 1),  "history": list(history["memory"])},
        "disk":    {"value": round(disk, 1), "history": list(history["disk"])},
        "temp":    {"value": round(temp, 1), "history": list(history["temp"])},
        "network": {
            "tx_kbps": round(tx, 1), "rx_kbps": round(rx, 1),
            "tx_history": list(history["net_tx"]),
            "rx_history": list(history["net_rx"]),
        },
        "psutil_available": HAS_PSUTIL,
    }

@app.get("/api/earnings")
def get_earnings():
    return {
        "sources": EARNINGS,
        "summary": {
            "total_daily_usd":  round(sum(e["daily"] for e in EARNINGS.values()), 2),
            "total_earned_usd": round(sum(e["total"] for e in EARNINGS.values()), 2),
        }
    }

@app.get("/api/processes")
def get_processes():
    procs = _processes()
    return {
        "processes": procs,
        "total": len(procs),
        "psutil_available": HAS_PSUTIL,
    }

@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat() + "Z"}

app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
