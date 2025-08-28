# -------------------------------

# 1️⃣ Install prerequisites if missing

# -------------------------------

# Node.js

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
Write-Output "Node.js not found. Installing..."
winget install OpenJS.NodeJS
}

# Python

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
Write-Output "Python not found. Installing..."
winget install Python.Python.3
}

# Git

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
Write-Output "Git not found. Installing..."
winget install Git.Git
}

# -------------------------------

# 2️⃣ Install Ollama

# -------------------------------

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
Write-Output "Installing Ollama..."
Start-Process "https://ollama.com/download" -UseNewEnvironment
Read-Host "Press Enter after installing Ollama manually..."
}

# Start Ollama server

Start-Process powershell -ArgumentList "ollama serve"

# -------------------------------

# 3️⃣ Clone ScribeFlow Repo

# -------------------------------

git clone <your-repo-url> transcribeapp
cd transcribeapp

# -------------------------------

# 4️⃣ Setup Python venv & dependencies

# -------------------------------

python -m venv venv
.\venv\Scripts\Activate.ps1
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

Start-Process powershell -ArgumentList "cd backend; node server.js"

# Frontend

Start-Process powershell -ArgumentList "cd frontend; npm run dev"

Write-Output "✅ ScribeFlow is running! Open http://localhost:5173 in your browser."
