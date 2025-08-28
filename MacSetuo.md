#!/bin/bash

# -------------------------------

# 1️⃣ Install prerequisites if missing

# -------------------------------

# Node.js

if ! command -v node &>/dev/null; then
echo "Node.js not found. Installing..."
brew install node
fi

# Python

if ! command -v python3 &>/dev/null; then
echo "Python3 not found. Installing..."
brew install python
fi

# Git

if ! command -v git &>/dev/null; then
echo "Git not found. Installing..."
brew install git
fi

# -------------------------------

# 2️⃣ Install Ollama

# -------------------------------

if ! command -v ollama &>/dev/null; then
echo "Installing Ollama..."
brew install ollama
fi

# Start Ollama server

ollama serve &

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
