#!/bin/bash

# -------------------------------

# ScribeFlow + Ollama Zero-Friction Setup (macOS/Linux)

# -------------------------------

# 1️⃣ Install prerequisites if missing

if ! command -v node &>/dev/null; then
echo "Node.js missing. Installing..."
[["$OSTYPE" == "darwin"*]] && brew install node || sudo apt install -y nodejs npm
fi
if ! command -v python3 &>/dev/null; then
echo "Python3 missing. Installing..."
[["$OSTYPE" == "darwin"*]] && brew install python || sudo apt install -y python3 python3-venv python3-pip
fi
if ! command -v git &>/dev/null; then
echo "Git missing. Installing..."
[["$OSTYPE" == "darwin"*]] && brew install git || sudo apt install -y git
fi

# 2️⃣ Install Ollama if missing

if ! command -v ollama &>/dev/null; then
echo "Installing Ollama..."
[["$OSTYPE" == "darwin"*]] && brew install ollama || curl -fsSL https://ollama.com/install.sh | sh
fi

# 3️⃣ Start Ollama and wait until ready

ollama serve &
echo "Waiting for Ollama API..."
while ! curl -s http://localhost:11434/api/tags >/dev/null; do sleep 2; done

# 4️⃣ Clone ScribeFlow repo

git clone <your-repo-url> transcribeapp
cd transcribeapp

# 5️⃣ Setup Python venv & install dependencies

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 6️⃣ Setup backend & frontend

cd backend
npm install
cd ../frontend
npm install

# 7️⃣ Pull Ollama model

ollama pull llama2

# 8️⃣ Start backend and frontend with live logs

cd ../backend
node server.js &
cd ../frontend
npm run dev &

echo "✅ ScribeFlow + Ollama setup complete! Open http://localhost:5173"
