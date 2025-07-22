#!/bin/bash

# --- WebSocket Backend Server (Port 8765) ---
BACKEND_PORT=5009
echo "Checking backend port $BACKEND_PORT..."
BACKEND_PID=$(lsof -ti :$BACKEND_PORT)

if [ -n "$BACKEND_PID" ]; then
  echo "Backend port $BACKEND_PORT is in use by PID $BACKEND_PID. Terminating process."
  kill -9 $BACKEND_PID
  sleep 1
fi

echo "Activating Python virtual environment..."
source ./venv/bin/activate

echo "Starting WebSocket backend server on ws://localhost:$BACKEND_PORT..."
python backend/src/websocket_server.py &
# Capture the PID of the last background process
BACKEND_SERVER_PID=$!
echo "Backend server started with PID $BACKEND_SERVER_PID."

# --- Frontend Development Server (Port 5173) ---
FRONTEND_PORT=5008
echo "Checking frontend port $FRONTEND_PORT..."
FRONTEND_PID=$(lsof -ti :$FRONTEND_PORT)

if [ -n "$FRONTEND_PID" ]; then
  echo "Frontend port $FRONTEND_PORT is in use by PID $FRONTEND_PID. Terminating process."
  kill -9 $FRONTEND_PID
  sleep 1
fi

echo "Starting frontend development server on http://localhost:$FRONTEND_PORT..."
(cd frontend && npm run dev -- --port $FRONTEND_PORT) &
# Capture the PID of the last background process
FRONTEND_SERVER_PID=$!
echo "Frontend server started with PID $FRONTEND_SERVER_PID."

echo -e "
--- Servers are starting up ---"
echo "Backend WebSocket: ws://localhost:$BACKEND_PORT"
echo "Frontend Editor:   http://localhost:$FRONTEND_PORT"
echo "Press Ctrl+C to stop both servers."

# Function to clean up background processes on exit
cleanup() {
    echo -e "
--- Shutting down servers ---"
    kill $BACKEND_SERVER_PID
    kill $FRONTEND_SERVER_PID
    echo "Servers stopped."
    exit 0
}

# Trap Ctrl+C and call the cleanup function
trap cleanup SIGINT

# Wait for background jobs to finish.
# This allows the script to keep running and the trap to work.
wait
