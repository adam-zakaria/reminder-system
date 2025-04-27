const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const cors = require('cors');
const winston = require('winston');
const moment = require('moment-timezone');

// Set up Express app
const app = express();
const port = 7628;

// Enable CORS for all requests
app.use(cors());

// Middleware
app.use(bodyParser.json());

// Configure logger
const connectionLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => moment().tz('America/New_York').format('YYYY-MM-DD HH:mm:ss z')
    }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'connections.log' })
  ]
});

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });
const connectedClients = {};

// Authentication secrets
const PRIMARY_SECRET = "MfEvLs8nM6YJLv8cT4hmz5Cyc92ZXyZu";
const CLIENT_SECRET = "qyPDrj5yxq6rUHbwHbpTR8CXJVRFWRSU";

// WebSocket connection handler
wss.on('connection', function connection(ws, request) {
  console.log("New WebSocket connection");
  connectionLogger.info("New WebSocket connection");
  
  let tempClientId = "temp_" + new Date().getTime();
  
  // Store the initial connection with a temporary ID
  if (!connectedClients[tempClientId]) {
    connectedClients[tempClientId] = [];
  }
  connectedClients[tempClientId].push(ws);

  // Handle incoming messages
  ws.on('message', function incoming(message) {
    console.log('Received message:', message.toString());
    connectionLogger.info(`Received message: ${message.toString()}`);
    
    try {
      const parsedMessage = JSON.parse(message);

      // Handle initialization message
      if (parsedMessage.type === 'init') {
        if ((parsedMessage.role === 'primary' && parsedMessage.secret === PRIMARY_SECRET) ||
            (parsedMessage.role === 'client' && parsedMessage.secret === CLIENT_SECRET)) {
          
          const clientId = parsedMessage.home_key || 'primary';
          
          // Initialize client array if it doesn't exist
          if (!connectedClients[clientId]) {
            connectedClients[clientId] = [];
          }
          
          // Add this connection to the client ID
          connectedClients[clientId].push(ws);
          
          // Remove from temporary ID
          connectedClients[tempClientId] = connectedClients[tempClientId].filter(client => client !== ws);
          if (connectedClients[tempClientId].length === 0) {
            delete connectedClients[tempClientId];
          }
          
          // Send success response
          ws.send(JSON.stringify({ response: 'success' }));
          connectionLogger.info(`Authenticated ${parsedMessage.role} with clientId: ${clientId}`);
          console.log(`Authenticated ${parsedMessage.role} with clientId: ${clientId}`);
          console.log("Currently connected WebSocket clients:", Object.keys(connectedClients));
        } else {
          // Authentication failed
          ws.send(JSON.stringify({ response: 'invalid token' }));
          console.log("Invalid secret key");
          connectionLogger.info("Invalid secret key");
          ws.close();
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      connectionLogger.error(`Error processing message: ${error.message}`);
    }
  });

  // Handle connection close
  ws.on('close', function() {
    console.log('WebSocket connection closed');
    connectionLogger.info('WebSocket connection closed');
    
    // Remove this connection from all client lists
    for (const clientId in connectedClients) {
      connectedClients[clientId] = connectedClients[clientId].filter(client => client !== ws);
      if (connectedClients[clientId].length === 0) {
        delete connectedClients[clientId];
      }
    }
    
    console.log("Currently connected WebSocket clients:", Object.keys(connectedClients));
  });
});

// Function to send a message to a specific client
function sendMessageToClient(clientId, action, stickyNote, id) {
  const clientWsList = connectedClients[clientId];
  console.log("Currently connected WebSocket clients:", Object.keys(connectedClients));
  
  if (clientWsList && clientWsList.length > 0) {
    let message;
    if (action === "add") {
      console.log(id, "id");
      message = {
        action: action,
        id: id,
        lightCategoryId: stickyNote.lightCategoryId,
        msg: {
          title: stickyNote.title,
          content: stickyNote.content,
          notificationSoundID: stickyNote.notificationSoundID,
          instructions: stickyNote.instructions
        }
      };
    } else if (action === "remove") {
      message = {
        action: action,
        id: id,
        lightCategoryId: 0,
        msg: null
      };
    }
    
    const messageString = JSON.stringify(message);
    console.log("Sending message to device:", messageString);
    
    clientWsList.forEach(clientWs => {
      clientWs.send(messageString);
      console.log(`Message sent to client ${clientId}`);
    });
  } else {
    console.log(`No client connected with ID: ${clientId}`);
  }
}

// Endpoint for notifications
app.post('/notify', (req, res) => {
  const { clientId, action, id, stickyNote } = req.body;
  
  if (!clientId) {
    return res.status(400).json({ error: 'clientId is required' });
  }

  try {
    // Check client connection
    const clientWsList = connectedClients[clientId];
    if (!clientWsList || clientWsList.length === 0) {
      return res.status(404).json({ error: `No connected client found for clientId: ${clientId}` });
    }

    // Send message using existing function
    sendMessageToClient(clientId, action, stickyNote, id);
    
    return res.json({ 
      success: true, 
      message: `Notification sent to clientId: ${clientId}`
    });
  } catch (error) {
    console.error('Error in notify:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Create HTTP server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  connectionLogger.info(`Server started on port ${port}`);
});

// Upgrade HTTP connection to WebSocket when requested
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});