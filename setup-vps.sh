#!/bin/bash
# ============================================================
# Setup Script — Sistem Informasi Pesantren Al-Hamid
# VPS: IDCloudHost Ubuntu 24.04
# ============================================================
#
# CARA PAKAI:
# 1. Upload script ini ke VPS
# 2. chmod +x setup-vps.sh
# 3. ./setup-vps.sh
#CCC
# Atau jalankan per bagian secara manual (copy-paste ke terminal)
# ============================================================

set -e  # Stop jika ada error

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   🚀 Setup VPS — Pesantren Al-Hamid             ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ─── STEP 1: Update System ──────────────────────────────
echo "📦 [1/7] Updating system..."
sudo apt update && sudo apt upgrade -y

# ─── STEP 2: Install Node.js 20 LTS ─────────────────────
echo "📦 [2/7] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
echo "   ✅ Node.js $(node -v) installed"
echo "   ✅ npm $(npm -v) installed"

# ─── STEP 3: Install PostgreSQL ──────────────────────────
echo "📦 [3/7] Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
echo "   ✅ PostgreSQL installed and running"

# ─── STEP 4: Install Nginx ──────────────────────────────
echo "📦 [4/7] Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
echo "   ✅ Nginx installed and running"

# ─── STEP 5: Install PM2 ────────────────────────────────
echo "📦 [5/7] Installing PM2..."
sudo npm install -g pm2
echo "   ✅ PM2 installed"

# ─── STEP 6: Install Certbot (SSL) ──────────────────────
echo "📦 [6/7] Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx
echo "   ✅ Certbot installed"

# ─── STEP 7: Install Git (biasanya sudah ada) ───────────
echo "📦 [7/7] Installing Git..."
sudo apt install -y git
echo "   ✅ Git installed"

# ─── Setup Firewall ─────────────────────────────────────
echo "🔒 Setting up firewall (UFW)..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
echo "   ✅ Firewall configured (SSH + HTTP + HTTPS)"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ All dependencies installed!                 ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Node.js : $(node -v)"
echo "npm     : $(npm -v)"
echo "PM2     : $(pm2 -v)"
echo "Nginx   : $(nginx -v 2>&1)"
echo "PostgreSQL: $(psql --version)"
echo ""
echo "👉 Next: Setup database & clone project"
echo ""
