# 1GB Raspberry Pi Earning Setup

A stripped‑down, ultra‑lightweight earning stack designed specifically for **1 GB Raspberry Pi devices**.

## Included Apps (Native Only)

- Honeygain  
- Pawns  
- TraffMonetizer  
- Repocket  

## Why Native Only?

Docker + Netdata + EarnApp + monitoring tools consume **600–700 MB RAM**.  
This repo is optimized to stay under **100 MB total usage**.

## Install

SSH into your Pi and run:
```bash
git clone https://github.com/YOURNAME/1GB-Raspberry-PI-earnin
cd 1GB-Raspberry-PI-earnin
sudo bash install.sh
```

Then edit the `.sh` files inside each folder to add your:

- Email  
- Password  
- Tokens  

## Services

Each app installs as a systemd service:

sudo systemctl status honeygain
sudo systemctl status pawns
sudo systemctl status traff
sudo systemctl status repocket

## RAM Usage

| App | RAM |
|-----|------|
| Honeygain | ~34 MB |
| Pawns | ~13 MB |
| TraffMonetizer | ~10–20 MB |
| Repocket | ~10–20 MB |

Total: **~70–90 MB**

Perfect for a 1 GB Pi.
