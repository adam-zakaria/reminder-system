const stateLogger = require('../loggers/stateLogger');  // Assuming logger is already set up
const { db } = require('../models');
const { sendMessageToClient } = require('./websocketService');

const clientState = {};  // In-memory store for client states

// Initialize the state for a new client
function initializeClientState(clientId) {
  if (!clientState[clientId]) {
    clientState[clientId] = {
      state: 'Idle',
      lastPowerDecreaseTime: null,
      reheatCount: 0,
      powerCycleDetected: false
    };
  }
}

// The state machine function that processes updates and detects activities
function stateMachine(update, clientId) {
  initializeClientState(clientId);
  const stateData = clientState[clientId];

  switch (stateData.state) {
    case 'Idle':
      if (update.component_name === 'doorStatus' && update.value === 1) {
        stateData.state = 'Door Opened';
      }
      break;
    case 'Door Opened':
      if (update.component_name === 'doorStatus' && update.value === 0) {
        stateData.state = 'Door Closed Before Reheating';
      }
      break;
    case 'Power Increase':
      if (update.component_name === 'power' && update.value < 500) {
        stateData.state = 'Reheated';
        stateData.reheatCount++;
        stateData.lastPowerDecreaseTime = new Date();
      }
      break;
    // Add more cases as per your state transitions
  }

  stateLogger.info(`Client ${clientId} is now in state: ${stateData.state}`);
  return stateData;
}

// Handle sending reminders based on state detection
async function handleDetection(clientId, update) {
  const reminders = await db.reminders.findAll({ where: { type: 'stateful-activity' } });
  reminders.forEach(reminder => sendMessageToClient(clientId, reminder));
}

module.exports = { stateMachine, handleDetection };
