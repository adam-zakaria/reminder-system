# iOS Device and Python Server WebSocket Communication

This document outlines the process by which an iOS device establishes a WebSocket connection with a Python server, authenticates, exchanges messages, and finally disconnects. The communication involves two main phases: the initial connection setup via HTTP and subsequent message exchange over WebSocket.

## Connection Setup and Authentication

1. **Initial Connection**:
   - The iOS device initiates the connection by sending an HTTP GET request to the Python server with headers indicating an upgrade to WebSocket.
   - The server responds with an HTTP 101 Switching Protocols status code, indicating that the connection will be upgraded to WebSocket.

2. **WebSocket Connection Established**:
   - Following the protocol upgrade, a WebSocket connection is established, allowing for full-duplex communication between the iOS device and the Python server.

3. **Authentication**:
   - The iOS device sends a JSON message over the WebSocket connection containing its `role`, a `secret` for authentication, and optionally a `home_key`.
   - The server validates the provided `secret` and responds with a JSON message indicating `"response": "success"` if the authentication is successful.

## Message Exchange

1. **Sending Messages**:
   - Once authenticated, the iOS device can send messages to the server. For example, it can send a JSON message with an `"action": "broadcast"` and a `message` payload to be broadcasted to all connected clients.

2. **Broadcasting Messages**:
   - Upon receiving a broadcast request, the Python server broadcasts the message to all connected clients, including the original sender.

## Disconnection

1. **Close Connection**:
   - The iOS device can initiate the disconnection by sending a WebSocket Close Frame.
   - The server acknowledges the disconnection by sending back a Close Frame, effectively closing the WebSocket connection.

## Diagrams

### Basic Communication Flow

```
[iOS Device] <---- WebSocket Connection ----> [Python Server]
     |                                                |
     |--- (1) Connect ------------------------------->|
     |                                                |
     |<-- (2) Acknowledge Connection -----------------|
     |                                                |
     |--- (3) Authenticate (send secret & role) ----->|
     |                                                |
     |<-- (4) Authentication Success -----------------|
     |                                                |
     |--- (5) Send Message (e.g., broadcast) -------->|
     |                                                |
     |<-- (6) Broadcast Message to Clients -----------|
     |                                                |
     |--- (7) Close Connection ---------------------->|
     |                                                |
     |<-- (8) Acknowledge Disconnection --------------|


### Detailed Connection Setup

[iOS Device] ---(HTTP GET / Upgrade: websocket)---> [Python Server]
| <------------------ (HTTP 101 Switching Protocols) ----------------> |
| <------------------ (WebSocket Connection Established) ------------> |
| |
| ---(WebSocket / JSON: {role, secret, home_key})--------------------> |
| <------------------ (WebSocket / JSON: {response: "success"}) ------ |
| |
| ---(WebSocket / JSON: {action: "broadcast", message: "Hello"}) ----> |
| <------------------ (WebSocket / Broadcast to Clients) ------------- |
| |
| ---(WebSocket / Close Frame) --------------------------------------> |
| <------------------ (WebSocket / Close Frame) ---------------------- |


This explanation and the accompanying diagrams provide a clear overview of the process by which an iOS device communicates with a Python server using WebSocket, from the initial connection and authentication to message exchange and disconnection.