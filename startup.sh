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
    python3 -m venv .venv
fi
source .venv/bin/activate
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
