# -------------------------------

# ScribeFlow + Ollama Zero-Friction Setup (Windows)

# -------------------------------

# 1️⃣ Install prerequisites if missing

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { winget install OpenJS.NodeJS }
if (-not (Get-Command python -ErrorAction SilentlyContinue)) { winget install Python.Python.3 }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { winget install Git.Git }

# 2️⃣ Install Ollama if missing

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
Write-Output "Please download and install Ollama from https://ollama.com/download"
Read-Host "Press Enter after installing Ollama..."
}

# 3️⃣ Start Ollama and wait until ready

Start-Process powershell -ArgumentList "ollama serve"
Write-Output "Waiting for Ollama API to be ready..."
while (-not (curl -s http://localhost:11434/api/tags)) { Start-Sleep -Seconds 2 }

# 4️⃣ Clone ScribeFlow repo

git clone <your-repo-url> transcribeapp
cd transcribeapp

# 5️⃣ Setup Python venv & install dependencies

python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 6️⃣ Setup backend & frontend

cd backend
npm install
cd ../frontend
npm install

# 7️⃣ Pull Ollama model

ollama pull llama2

# 8️⃣ Start backend and frontend with live logs

Start-Process powershell -ArgumentList "cd backend; node server.js"
Start-Process powershell -ArgumentList "cd frontend; npm run dev"

Write-Output "✅ ScribeFlow + Ollama setup complete! Open http://localhost:5173"
