#!/bin/bash

# Define the port for the WebSocket server
PORT=5009

# Find the process ID (PID) using the specified port
PID=$(lsof -ti :$PORT)

# If a PID is found, kill the process
if [ -n "$PID" ]; then
  echo "Port $PORT is currently in use by PID $PID. Terminating process."
  kill -9 $PID
  # Wait a moment for the port to be released
  sleep 1
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source ./venv/bin/activate

# Start the WebSocket server
echo "Starting WebSocket server on ws://localhost:$PORT..."
python backend/src/websocket_server.py &
