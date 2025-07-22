import asyncio
import websockets

connected_clients = set()

async def handler(websocket):
    # Add new client to the set of connected clients
    connected_clients.add(websocket)
    print(f"Client connected. Total clients: {len(connected_clients)}")
    
    try:
        # Listen for messages from the client
        async for message in websocket:
            print(f"Received message: {message}")
            
            # Broadcast the message to all other clients
            for client in connected_clients:
                if client != websocket:
                    await client.send(message)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        # Remove client from the set when they disconnect
        connected_clients.remove(websocket)
        print(f"Client disconnected. Total clients: {len(connected_clients)}")

async def main():
    async with websockets.serve(handler, "localhost", 5009):
        print("WebSocket server started on ws://localhost:5009")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
