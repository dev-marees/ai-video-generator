#!/bin/bash

# Exit on error
set -e

echo "Starting Video Gen Tamil Application..."

# Function to handle cleanup on exit
cleanup() {
    echo "Shutting down servers..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit
}

trap cleanup EXIT INT TERM

# Start Backend
echo "Setting up and starting Backend..."
cd server
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    # Check if python3 is available, otherwise fallback to python (common on Windows)
    if command -v python3 >/dev/null 2>&1; then
        python3 -m venv .venv
    else
        python -m venv .venv
    fi
fi

# Activate the virtual environment depending on the OS path
if [ -f ".venv/Scripts/activate" ]; then
    # Windows
    source .venv/Scripts/activate
else
    # macOS/Linux
    source .venv/bin/activate
fi
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Setting up and starting Frontend..."
cd client
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo "--------------------------------------------------------"
echo "Application is running!"
echo "Backend: http://localhost:8080"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both servers."
echo "--------------------------------------------------------"

# Wait for both background processes
wait $BACKEND_PID $FRONTEND_PID
