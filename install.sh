#!/bin/bash

echo "=== 1GB Pi Earning Setup ==="

sudo apt update
sudo apt install -y curl wget unzip

echo "Installing Honeygain..."
sudo mkdir -p /opt/honeygain
sudo wget -qO /opt/honeygain/honeygain https://download.honeygain.com/arm/honeygain
sudo chmod +x /opt/honeygain/honeygain

sudo tee /etc/systemd/system/honeygain.service >/dev/null <<EOF
[Unit]
Description=Honeygain Client
After=network.target

[Service]
ExecStart=/opt/honeygain/honeygain -tou-accept -email YOUR_EMAIL -pass YOUR_PASS -device Pi1GB
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable honeygain


echo "Installing Pawns..."
sudo mkdir -p /opt/pawns
sudo wget -qO /opt/pawns/pawns-cli https://pawns.com/download/linux/arm64/pawns-cli
sudo chmod +x /opt/pawns/pawns-cli

sudo tee /etc/systemd/system/pawns.service >/dev/null <<EOF
[Unit]
Description=Pawns Client
After=network.target

[Service]
ExecStart=/opt/pawns/pawns-cli --email=YOUR_EMAIL --password=YOUR_PASS --device-name=Pi1GB --accept-tos
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable pawns


echo "Installing TraffMonetizer..."
sudo mkdir -p /opt/traff
sudo wget -qO /opt/traff/traff https://traffmonetizer.com/download/cli/arm64
sudo chmod +x /opt/traff/traff

sudo tee /etc/systemd/system/traff.service >/dev/null <<EOF
[Unit]
Description=TraffMonetizer Client
After=network.target

[Service]
ExecStart=/opt/traff/traff start accept --token YOUR_TOKEN
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable traff


echo "Installing Repocket..."
sudo mkdir -p /opt/repocket
sudo wget -qO /opt/repocket/repocket https://static.repocket.co/cli/repocket-cli-linux-arm64
sudo chmod +x /opt/repocket/repocket

sudo tee /etc/systemd/system/repocket.service >/dev/null <<EOF
[Unit]
Description=Repocket Client
After=network.target

[Service]
ExecStart=/opt/repocket/repocket --email YOUR_EMAIL --password YOUR_PASS
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable repocket


echo "Starting all services..."
sudo systemctl daemon-reload
sudo systemctl start honeygain
sudo systemctl start pawns
sudo systemctl start traff
sudo systemctl start repocket

echo "=== Install Complete ==="
echo "Edit install.sh to add your real emails/passwords/tokens."
