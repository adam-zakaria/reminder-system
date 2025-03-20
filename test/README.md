# Time based reminder
The ws connection between node and iOS is not resilient - if an error happens, it disconnects, or at least, something gets messed up with the state so that the client is not registered as connected:

1|node_backend  | Currently connected WebSocket clients: []
1|node_backend  | No client connected with ID: ep6

Weirdly, the iOS app still indicates that it's connected.

Rebuilding the app fixes this.