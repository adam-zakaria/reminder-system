const WebSocket = require('ws');
const winston = require('winston');

// Logging for WebSocket connections
const connectionLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [new winston.transports.File({ filename: 'connections.log' })]
});

// In-memory store for connected clients
const connectedClients = {};

// Handle WebSocket connection and client authentication
function handleWebSocketConnection(wss) {
  wss.on('connection', (ws, request) => {
    let tempClientId = 'temp_' + new Date().getTime();
    connectedClients[tempClientId] = ws;
    connectionLogger.info(`Client connected: ${tempClientId}`);

    ws.on('message', (message) => {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === 'init') {
        // Authentication logic
        const clientId = parsedMessage.home_key || 'primary';
        if (!connectedClients[clientId]) connectedClients[clientId] = [];
        connectedClients[clientId].push(ws);
        delete connectedClients[tempClientId];
      }
    });

    ws.on('close', () => {
      connectionLogger.info(`Client disconnected: ${tempClientId}`);
      delete connectedClients[tempClientId];
    });
  });
}

// Send a message to a specific client
function sendMessageToClient(clientId, message) {
  const clientWsList = connectedClients[clientId];
  if (clientWsList && clientWsList.length > 0) {
    clientWsList.forEach(clientWs => clientWs.send(JSON.stringify(message)));
  }
}

module.exports = { handleWebSocketConnection, sendMessageToClient };
