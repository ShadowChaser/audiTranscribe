#!/bin/bash

# -------------------------------

# 1️⃣ Install prerequisites if missing

# -------------------------------

sudo apt update

# Node.js

if ! command -v node &>/dev/null; then
echo "Node.js not found. Installing..."
sudo apt install -y nodejs npm
fi

# Python3

if ! command -v python3 &>/dev/null; then
echo "Python3 not found. Installing..."
sudo apt install -y python3 python3-venv python3-pip
fi

# Git

if ! command -v git &>/dev/null; then
echo "Git not found. Installing..."
sudo apt install -y git
fi

# -------------------------------

# 2️⃣ Install Ollama

# -------------------------------

if ! command -v ollama &>/dev/null; then
curl -fsSL https://ollama.com/install.sh | sh
fi
sudo systemctl enable ollama
sudo systemctl start ollama

# -------------------------------

# 3️⃣ Clone ScribeFlow Repo

# -------------------------------

git clone <your-repo-url> transcribeapp
cd transcribeapp

# -------------------------------

# 4️⃣ Setup Python venv & dependencies

# -------------------------------

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# -------------------------------

# 5️⃣ Setup Backend & Frontend

# -------------------------------

cd backend
npm install
cd ../frontend
npm install

# -------------------------------

# 6️⃣ Pull Ollama model

# -------------------------------

ollama pull llama2

# -------------------------------

# 7️⃣ Start Servers

# -------------------------------

# Backend

cd ../backend
node server.js &

# Frontend

cd ../frontend
npm run dev &

echo "✅ ScribeFlow is running! Open http://localhost:5173 in your browser."
