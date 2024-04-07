const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const cron = require('node-cron');
const events = require('events');
const updateEvent = new events.EventEmitter();
require('dotenv').config();

const app = express();
const port = 7628;

// Middleware
app.use(bodyParser.json());

// In-memory data store
const dataStore = {
  reminders: [],
  userClientMap: [{ userId: 12345, targetClientId: "home123" }],
  delayTable: { fridge: 60000, microwave: 60000 },
  sentReminders: []
};


// function isConditional(message) {
//   const conditionalPhrases = ['everytime', 'if', 'once', 'while', 'as soon as', 'and'];
//   return conditionalPhrases.some(phrase => message.toLowerCase().includes(phrase));
// }

function determineReminderType(utilityName, componentName, time) {
  if (utilityName && componentName && (!time || time.trim() === '')) {
    return 'dependent';
  } else if ((!utilityName || utilityName.trim() === '') && (!componentName || componentName.trim() === '') && (time && time.trim() !== '')) {
    return 'non-dependent';
  } else if (utilityName && componentName && time && time.trim() !== '') {
    return 'union';
  } else {
    return 'unknown'; // Default value if none of the conditions match
  }
}


// WebSocket server
const wss = new WebSocket.Server({ noServer: true });
const connectedClients = {};

const PRIMARY_SECRET = "MfEvLs8nM6YJLv8cT4hmz5Cyc92ZXyZu";
const CLIENT_SECRET = "qyPDrj5yxq6rUHbwHbpTR8CXJVRFWRSU";

wss.on('connection', function connection(ws, request) {
  console.log(request, "connection")
  let tempClientId = "temp_" + new Date().getTime();
  connectedClients[tempClientId] = ws;

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    const parsedMessage = JSON.parse(message);

    if (parsedMessage.type === 'init') {
      if ((parsedMessage.role === 'primary' && parsedMessage.secret === PRIMARY_SECRET) ||
        (parsedMessage.role === 'client' && parsedMessage.secret === CLIENT_SECRET)) {
        const clientId = parsedMessage.home_key || 'primary';
        connectedClients[clientId] = ws;
        delete connectedClients[tempClientId];
        ws.send(JSON.stringify({ response: 'success' }));
        console.log(`Authenticated ${parsedMessage.role} with clientId: ${clientId}`);
      } else {
        ws.send(JSON.stringify({ response: 'invalid token' }));
        console.log("Invalid secret key");
        ws.close();
      }
    }
  });

  ws.on('close', function () {
    console.log(`Client disconnected`);
    delete connectedClients[tempClientId];
  });
});

function sendMessageToClient(clientId, action, stickyNote, id) {
  const clientWs = connectedClients[clientId];
  if (clientWs) {
    let message;
    if (action === "add") {
      console.log(id, "id")
      message = {
        action: action,
        id: id,
        msg: {
          //id: stickyNote.id,
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
        msg: {
          id: stickyNote.id
        }
      };
    }
    console.log(JSON.stringify(message), "message TO the device")
    clientWs.send(JSON.stringify(message));
    console.log(`Message sent to client ${clientId}: ${JSON.stringify(message)}`);
  } else {
    console.log(`No client connected with ID: ${clientId}`);
  }
}

function broadcastMessage(message) {
  Object.values(connectedClients).forEach(clientWs => {
    clientWs.send(JSON.stringify(message));
  });
}

app.post('/reminders', (req, res) => {
  const { userId, message, interval, time, utility_name, component_name, condition, display, delay } = req.body;

  // Determine the type of the reminder
  const type = determineReminderType(utility_name, component_name, time);
  console.log(type, "type")
  
  // Format the time
  const timeDateObject = new Date(time);
  const formattedTime = timeDateObject.toISOString().slice(0, 19).replace('T', ' ');

  // Create the reminder object
  const newReminder = {
    id: dataStore.reminders.length + 1,
    userId,
    message,
    interval,
    time: formattedTime,
    type,
    utility_name,
    component_name,
    condition,
    display,
    delay: delay || dataStore.delayTable[utility_name],
    sent: false 
  };

  // Push the new reminder to the data store
  dataStore.reminders.push(newReminder);
  
  // Fetch the latest reminder for the specified userId from the in-memory data store 
  const userClientMap = dataStore.userClientMap.filter(user => user.userId === userId)[0];
  const targetClientId = userClientMap.targetClientId;

  // If the reminder is non-dependent, schedule it to be sent at the specified time
  if (type === 'non-dependent') {
    console.log(timeDateObject, "timeDateObject")
    const cronExpression = `${timeDateObject.getUTCMinutes()} ${timeDateObject.getUTCHours()} * * *`;
    console.log(cronExpression, "cronExpression")
    cron.schedule(cronExpression, () => {
      const stickyNoteUpdate = {
        action: "add",
        id: newReminder.id.toString() + "00",
        stickyNote: {
          title: "Reminder",
          content: newReminder.display,
          notificationSoundID: 1,
          instructions: []
        }
      };

      console.log(stickyNoteUpdate, "stickyNoteUpdate")
      console.log("after stickynode")
      console.log(targetClientId, "targetClientId")
      sendMessageToClient(targetClientId, stickyNoteUpdate.action, stickyNoteUpdate.stickyNote, stickyNoteUpdate.id);
      console.log("sent")
    });
  }

  // Log the creation of the reminder
  console.log('Reminder created:', newReminder.id);

  // Send the response with the details of the newly created reminder
  res.status(201).json({
    id: newReminder.id,
    userId: newReminder.userId,
    message: newReminder.message,
    interval: newReminder.interval,
    time: newReminder.time,
    type: newReminder.type,
    display: newReminder.display,
    delay: newReminder.delay
  });
});


app.post('/oracle-updates', async (req, res) => {
  const { update } = req.body;

  if (!update) {
    return res.status(400).send({ status: 'Missing update' });
  }

  console.log(`Update from Oracle for client`, update);

  // Hardcoded userId for demonstration purposes
  const userId = 12345; // Replace "123" with the actual userId you want to use

  // Fetch the latest reminder for the specified userId from the in-memory data store
  const userClientMap = dataStore.userClientMap.find(user => user.userId === userId);
  if (!userClientMap) {
    return res.status(404).send({ status: 'User not found' });
  }

  const targetClientId = userClientMap.targetClientId;

  // Send the response immediately
  res.status(200).send({ status: 'Update received' });

// Emit an event indicating that a new update has been received
updateEvent.emit('newUpdate', update, targetClientId);
 
});

updateEvent.on('newUpdate', async (update, targetClientId) => {
  const matchingReminders = findMatchingReminders(update);
  console.log(matchingReminders,"matching reminders")
  if (matchingReminders.length > 0) {
    matchingReminders.forEach(async (reminder) => {
      if (reminder.delay) {
        await delayExecution(reminder.delay);
        console.log("delay Elapsed")
        updateEvent.emit('delayElapsed', targetClientId);
      } else {
        //using default delay if the delay is not present
        //await delayExecution(dataStore.delayTable[reminder.utility_name])
        //updateEvent.emit('delayElapsed', targetClientId);
        sendReminderToClient(matchingReminders, targetClientId);
      }
    });
  }

  // Check for each sent reminder if its condition is still met
  dataStore.sentReminders.forEach(sentReminder => {
    const reminder = dataStore.reminders.find(r => r.id === sentReminder.reminderId);
    if (!reminder) return; // Skip if the reminder does not exist in the dataStore

    const isMatch = update.home_utilities.some(home => {
      return home.utilities.some(utility => {
        if (utility.utility_name === reminder.utility_name) {
          return utility.components.some(component => {
            if (component.component_name === reminder.component_name && component.status === reminder.condition) {
              return true;
            }
            return false;
          });
        }
        return false;
      });
    });

    // If the reminder's condition is not met, remove it from the client device
    if (!isMatch) {
      const stickyNoteUpdate = {
        action: "remove",
        id: reminder.id.toString() + "00",
        stickyNote: {
          title: "Reminder",
          content: reminder.display,
          notificationSoundID: 1,
          instructions: []
        }
      };

      sendMessageToClient(sentReminder.clientId, stickyNoteUpdate.action, stickyNoteUpdate.stickyNote, stickyNoteUpdate.id);
      reminder.sent = false;
      dataStore.sentReminders = dataStore.sentReminders.filter(r => r.reminderId !== reminder.id);
    }
  });
});

updateEvent.on('delayElapsed', async (targetClientId) => {
  console.log("inside delay elapsed")
  updateEvent.once('newUpdate', (update) => {
    console.log("inside new update")
    
    const matchingReminders = findMatchingReminders(update);
    
    console.log(matchingReminders,"matching reminders")
    console.log("inside once new update")
    if (matchingReminders.length > 0) {
      matchingReminders.forEach(async (reminder) => {
      sendReminderToClient(reminder, targetClientId);
      })
    }
  });
});


function sendReminderToClient(matchingReminder, targetClientId) {
  const stickyNoteUpdate = {
    action: "add",
    id: matchingReminder.id.toString() + "00",
    stickyNote: {
      title: "Reminder",
      content: matchingReminder.display,
      notificationSoundID: 1,
      instructions: []
    }
  };

  sendMessageToClient(targetClientId, stickyNoteUpdate.action, stickyNoteUpdate.stickyNote, stickyNoteUpdate.id);
  matchingReminder.sent = true;
  dataStore.sentReminders.push({
    reminderId: matchingReminder.id,
    clientId: targetClientId
  });
}

async function delayExecution(millisecs) {
  const delayInMilliseconds = millisecs;
  await new Promise(resolve => setTimeout(resolve, delayInMilliseconds));
  console.log("inside delay execution");
}


function findMatchingReminders(update) {
  return dataStore.reminders.filter(reminder => {
    if (reminder.type === 'dependent'&& !reminder.sent) {
      const isMatch = update.home_utilities.some(home => {
        return home.utilities.some(utility => {
          if (utility.utility_name === reminder.utility_name) {
            return utility.components.some(component => {
              if (component.component_name === reminder.component_name && component.status === reminder.condition) {
                return true;
              }
              return false;
            });
          }
          return false;
        });
      });
      if (isMatch) {
        return true;
      }
    }
    return false;
  });
}

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
