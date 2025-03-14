const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const cron = require('node-cron');
const events = require('events');
const updateEvent = new events.EventEmitter();
const cors = require('cors');
require('dotenv').config();
const OpenAI = require('openai');
const { db } = require('./models');
const { v4: uuidv4 } = require('uuid');
const { _reminderPrompt } = require('./prompt');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult, check } = require('express-validator');
const winston = require('winston');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const openai = new OpenAI(process.env.OPENAI_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET

const app = express();
const port = 7628 //6541 //7628 //6541 //7628;

// Enable CORS for all requests
app.use(cors());


// Middleware
app.use(bodyParser.json());

// Initialize the database and insert default record
//createDatabase();

// In-memory data store
const dataStore = {
  reminders: [],
  userClientMap: [{ userId: 12345, targetClientId: "home123" }],
  delayTable: { fridge: 60000, microwave: 60000 },
  sentReminders: []
};

const lightCategoriesOptions = [
  { id: 1, value: 'urgent', label: 'Urgent - Requires immediate attention', color: '#FF0000' },
  { id: 2, value: 'important', label: 'Important - Needs to be done soon', color: '#FFA500' },
  { id: 3, value: 'routine', label: 'Routine - Regular task', color: '#008000' }
];

const sessions = {};

// Global state object to maintain the state for each client
const clientState = {};
let lastPowerComponentTime = null; // Variable to track the last power component timestamp

// function isConditional(message) {
//   const conditionalPhrases = ['everytime', 'if', 'once', 'while', 'as soon as', 'and'];
//   return conditionalPhrases.some(phrase => message.toLowerCase().includes(phrase));
// }

// // Create an Assistant
// async function createAssistant() {
//   const assistant = await openai.beta.assistants.create({
//     name: "Chat Assistant",
//     instructions: "You are a helpful chat assistant.",
//     tools: [],
//     model: "gpt-3.5-turbo"
//   });
//   return assistant;
// }

// // Create a Thread
// async function createThread() {
//   const thread = await openai.beta.threads.create();
//   return thread;
// }

// // Add a Message to the Thread
// async function addMessage(threadId, role, content) {
//   const message = await openai.beta.threads.messages.create(threadId, {
//     role: role,
//     content: content
//   });
//   return message;
// }

// // Run the Assistant on the Thread
// async function runAssistant(threadId, assistantId) {
//   const run = openai.beta.threads.runs.stream(threadId, {
//     assistant_id: assistantId
//   });

//   let response = '';
//   run.on('textCreated', (text) => response += text)
//      .on('textDelta', (delta) => response += delta.value);

//   return new Promise((resolve) => {
//     run.on('end', () => resolve(response));
//   });
// }

// API endpoint to handle chat messages
// app.post('/chat', async (req, res) => {
//   const { message, sessionId } = req.body;

//   if (!message) {
//     return res.status(400).json({ error: 'Message is required' });
//   }

//   const currentSessionId = sessionId || uuidv4();

//   if (!sessions[currentSessionId]) {
//     sessions[currentSessionId] = { threadId: null, assistantId: null, messages: [] };
//   }

//   const session = sessions[currentSessionId];

//   try {
//     if (!session.assistantId) {
//       const assistant = await createAssistant();
//       session.assistantId = assistant.id;
//     }

//     if (!session.threadId) {
//       const thread = await createThread();
//       session.threadId = thread.id;
//     }

//     await addMessage(session.threadId, 'user', message);
//     session.messages.push({ role: 'user', content: message });

//     const responseMessage = await runAssistant(session.threadId, session.assistantId);
//     session.messages.push({ role: 'assistant', content: responseMessage });


//     res.json({ sessionId: currentSessionId, response: responseMessage });
//   } catch (error) {
//     console.error('Error with OpenAI API:', error);
//     res.status(500).json({ error: 'Failed to generate response from OpenAI' });
//   }
// });

// Function to store conversation in an Excel file
function storeConversationInExcel(sessionId, userId, username, role, content, timestamp) {
  const filePath = path.join(__dirname, 'conversations.xlsx');
  let workbook;
  let worksheet;

  // Check if the Excel file exists
  if (fs.existsSync(filePath)) {
    workbook = xlsx.readFile(filePath);
    worksheet = workbook.Sheets['Conversations'];
  } else {
    // Create a new workbook and worksheet if the file doesn't exist
    workbook = xlsx.utils.book_new();
    worksheet = xlsx.utils.aoa_to_sheet([['Session ID', 'User ID', 'Username', 'Role', 'Content', 'Timestamp']]);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Conversations');
  }

  // Add the new message to the worksheet
  const newRow = [sessionId, userId, username, role, content, timestamp];
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  rows.push(newRow);
  worksheet = xlsx.utils.aoa_to_sheet(rows);
  workbook.Sheets['Conversations'] = worksheet;

  // Write the updated workbook back to the file
  xlsx.writeFile(workbook, filePath);
}

const connectionLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => moment().tz('America/New_York').format('YYYY-MM-DD HH:mm:ss z') // Eastern Time Zone
    }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'connections.log' })
  ]
});

// Middleware to authenticate and attach user to request
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.users.findByPk(decoded.userId);
    console.log(user, "user")
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Error authenticating user:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
};

function determineReminderType(utilityName, components, time, activity) {
  components = components || [];
  if (activity && activity.trim() !== '') {
    return 'activity-based';
  } else if (utilityName && components.length > 1) {
    return 'stateful-activity';
  } else if (utilityName && components.length === 1 && (!time || time.trim() === '')) {
    return 'dependent';
  } else if ((!utilityName || utilityName.trim() === '') && components.length === 0 && (time && time.trim() !== '')) {
    return 'non-dependent';
  } else if (utilityName && components.length > 0 && time && time.trim() !== '') {
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

const checkSuperuser = (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);

  db.users.findByPk(decoded.userId)
    .then(user => {
      if (user.role !== 'superuser') {
        console.log("=============", user)
        return res.status(403).json({ error: 'Access denied' });
      }
      next();
    })
    .catch(error => {
      console.error('Error checking user role:', error);
      res.status(500).json({ error: 'Failed to check user role' });
    });
};

//multiple client handling with same homekey

wss.on('connection', function connection(ws, request) {
  console.log(request, "connection");
  connectionLogger.info(`${request}, connection`);
  let tempClientId = "temp_" + new Date().getTime();
  connectedClients[tempClientId] = ws;

  logConnectedClients();

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    connectionLogger.info(`received: ${message}`);
    const parsedMessage = JSON.parse(message);

    if (parsedMessage.type === 'init') {
      if ((parsedMessage.role === 'primary' && parsedMessage.secret === PRIMARY_SECRET) ||
        (parsedMessage.role === 'client' && parsedMessage.secret === CLIENT_SECRET)) {
        const clientId = parsedMessage.home_key || 'primary';
        
        if (!connectedClients[clientId]) {
          connectedClients[clientId] = [];
        }
        connectedClients[clientId].push(ws);
        delete connectedClients[tempClientId];
        
        ws.send(JSON.stringify({ response: 'success' }));
        connectionLogger.info(`Authenticated ${parsedMessage.role} with clientId: ${clientId}`);
        console.log(`Authenticated ${parsedMessage.role} with clientId: ${clientId}`);
        logConnectedClients();
      } else {
        ws.send(JSON.stringify({ response: 'invalid token' }));
        console.log("Invalid secret key");
        connectionLogger.info("Invalid secret key");
        ws.close();
      }
    }
  });

  ws.on('close', function () {
    console.log(`Client disconnected`);
    connectionLogger.info(`Client disconnected: ${tempClientId}`);
    
    // Find and remove the ws from connectedClients
    for (const clientId in connectedClients) {
      if (Array.isArray(connectedClients[clientId])) {
        const index = connectedClients[clientId].indexOf(ws);
        if (index !== -1) {
          connectedClients[clientId].splice(index, 1);
          if (connectedClients[clientId].length === 0) {
            delete connectedClients[clientId];
          }
          break;
        }
      } else if (connectedClients[clientId] === ws) {
        delete connectedClients[clientId];
        break;
      }
    }

    logConnectedClients();
  });
});

function logConnectedClients() {
  const clientInfo = Object.keys(connectedClients).reduce((info, clientId) => {
    const clients = connectedClients[clientId];
    if (Array.isArray(clients)) {
      info[clientId] = clients.length;
    } else {
      info[clientId] = 1;
    }
    return info;
  }, {});

  const totalClients = Object.values(clientInfo).reduce((sum, count) => sum + count, 0);
  console.log(`Total connected clients: ${totalClients}`);
  connectionLogger.info(`Total connected clients: ${totalClients}`);
  console.log(`Client details: ${JSON.stringify(clientInfo)}`);
  connectionLogger.info(`Client details: ${JSON.stringify(clientInfo)}`);
}


//single client handling with same home key

// wss.on('connection', function connection(ws, request) {
//   console.log(request, "connection")
//   connectionLogger.info(`${request}, connection`);
//   let tempClientId = "temp_" + new Date().getTime();
//   connectedClients[tempClientId] = ws;

//   ws.on('message', function incoming(message) {
//     console.log('received: %s', message);
//     connectionLogger.info(`received: ${message}`);
//     const parsedMessage = JSON.parse(message);

//     if (parsedMessage.type === 'init') {
//       if ((parsedMessage.role === 'primary' && parsedMessage.secret === PRIMARY_SECRET) ||
//         (parsedMessage.role === 'client' && parsedMessage.secret === CLIENT_SECRET)) {
//         const clientId = parsedMessage.home_key || 'primary';
//         connectedClients[clientId] = ws;
//         delete connectedClients[tempClientId];
//         ws.send(JSON.stringify({ response: 'success' }));
//         connectionLogger.info(`Authenticated ${parsedMessage.role} with clientId: ${clientId}`);
//         console.log(`Authenticated ${parsedMessage.role} with clientId: ${clientId}`);
//       } else {
//         ws.send(JSON.stringify({ response: 'invalid token' }));
//         console.log("Invalid secret key");
//         connectionLogger.info("Invalid secret key");
//         ws.close();
//       }
//     }
//   });

//   ws.on('close', function () {
//     console.log(`Client disconnected`);
//     connectionLogger.info(`Client disconnected: ${tempClientId}`);
//     delete connectedClients[tempClientId];
//   });
// });


//handling multiple client with same home key
function sendMessageToClient(clientId, action, stickyNote, id) {
  const clientWsList = connectedClients[clientId];
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
    console.log(messageString, "message TO the device");
    
    clientWsList.forEach(clientWs => {
      clientWs.send(messageString);
      console.log(`Message sent to client ${clientId}: ${messageString}`);
    });

  } else {
    console.log(`No client connected with ID: ${clientId}`);
  }
}


//send note to single client with home key
// function sendMessageToClient(clientId, action, stickyNote, id) {
//   const clientWs = connectedClients[clientId];
//   if (clientWs) {
//     let message;
//     if (action === "add") {
//       console.log(id, "id")
//       message = {
//         action: action,
//         id: id,
//         lightCategoryId: stickyNote.lightCategoryId,
//         msg: {
//           //id: stickyNote.id,
//           title: stickyNote.title,
//           content: stickyNote.content,
//           notificationSoundID: stickyNote.notificationSoundID,
//           instructions: stickyNote.instructions
//         }
//       };
//     } else if (action === "remove") {
//       message = {
//         action: action,
//         id: id,
//         lightCategoryId: 0,
//         msg: null
//       };
//     }
//     console.log(JSON.stringify(message), "message TO the device")
//     clientWs.send(JSON.stringify(message));
//     console.log(`Message sent to client ${clientId}: ${JSON.stringify(message)}`);
//   } else {
//     console.log(`No client connected with ID: ${clientId}`);
//   }
// }

function broadcastMessage(message) {
  Object.values(connectedClients).forEach(clientWs => {
    clientWs.send(JSON.stringify(message));
  });
}
// GET /reminders
app.get('/reminders', authenticate, async (req, res) => {
  try {
    const { user } = req;
    let reminders;

    if (user.role === 'superuser') {
      try {
        reminders = await db.reminders.findAll({
          include: [
            {
              model: db.users,
              as: 'creator',
              attributes: ['username', 'email']
            },
            {
              model: db.users,
              as: 'sharedWith',
              attributes: ['id', 'username', 'email']
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching all reminders for superuser:', error);
        return res.status(500).json({ error: 'Failed to fetch reminders' });
      }
    } else {
      try {
        const createdReminders = await db.reminders.findAll({
          where: { createdBy: user.id },
          include: [
            {
              model: db.users,
              as: 'sharedWith',
              attributes: ['id', 'username', 'email']
            }
          ]
        });

        const sharedReminders = await db.reminders.findAll({
          where: { userId: user.id },
          include: [
            {
              model: db.users,
              as: 'creator',
              attributes: ['id', 'username', 'email']
            }
          ]
        });

        //console.log(sharedReminders,"shared reminders")

        reminders = [...createdReminders, ...sharedReminders];
      } catch (error) {
        console.error('Error fetching created or shared reminders for user:', error);
        return res.status(500).json({ error: 'Failed to fetch reminders' });
      }
    }

    if (!reminders || reminders.length === 0) {
      return res.status(404).json({ error: 'No reminders found' });
    }

    res.json(reminders);
  } catch (error) {
    console.error('Error in /reminders route:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});


app.post('/oracle-updates', async (req, res) => {
  const update = req.body;
  //console.log(req.body,"body")
  if (!update) {
    return res.status(400).send({ status: 'Missing update' });
  }

  console.log(update,"update")
  console.log(`Update from Oracle for client`, update.update);

  // // Hardcoded userId for demonstration purposes
  // const userId = "137ce759-00af-42d8-9210-c3f784afbb80";

  // // Fetch the latest reminder for the specified userId from the database
  // const userClientMap = await db.userClientMap.findOne({ where: { userId: userId } });
  // if (!userClientMap) {
  //   return res.status(404).send({ status: 'User not found' });
  // }

  //const targetClientId = userClientMap.targetClientId;

  //const targetClientId = "activity" in update.update ? update.update["house_id"] : update.update["home_utilities"][0]["house_id"]
  
  //testing purpose
  const targetClientId = "ep6"

  // Send the response immediately
  res.status(200).send({ status: 'Update received' });

  updateEvent.emit('processUpdate', update);

  // Emit events to handle the update
  if ("activity" in update.update) {
    updateEvent.emit('handleActivityReminders', update.update, targetClientId);
  } else if (update.update) {
    updateEvent.emit('newUpdate', update.update, targetClientId);
  }
});

/**
 * Execute the Python state machine with the provided input data.
 * @param {Object} inputData - The data to pass to the Python state machine.
 * @returns {Promise<Object>} - The updated blackboard from the state machine.
 */
function executePythonStateMachine(inputData) {
  return new Promise((resolve, reject) => {
    const inputDataStr = JSON.stringify(inputData);
    const pythonFilePath = 'generated_state_machine.py';  // Path to the dynamically generated Python file

    const command = `python3 ${pythonFilePath}`;
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(`Error executing Python script: ${error.message}`);
      }
      if (stderr) {
        console.error(`Python script stderr: ${stderr}`);
      }
      resolve(JSON.parse(stdout));  // Parse the output from Python
    });

    // Pass input data to the Python script via stdin
    process.stdin.write(inputDataStr);
    process.stdin.end();
  });
}

/**
 * Extract sensor data from the update payload.
 * @param {Object} update - The update payload.
 * @returns {Object} - Extracted sensor data.
 */
function extractSensorData(update) {
  const homeUtility = update.home_utilities[0];
  const utility = homeUtility.utilities[0];
  const component = utility.components[0];

  return {
    component_name: component.component_name,
    value: component.value,
    utility_name: utility.utility_name
  };
}

/**
 * Extract activity data from the update payload.
 * @param {Object} update - The update payload.
 * @returns {Object} - Extracted activity data.
 */
function extractActivityData(update) {
  return {
    activity: update.activity,
    status: update.activity_status,
    house_id: update.house_id
  };
}

/**
 * Generic function to handle the execution of the state machine based on sensor or activity data.
 * @param {Object} sensorData - The sensor data (if available).
 * @param {Object} activityData - The activity data (if available).
 * @param {Object} res - The HTTP response object.
 */
async function handleStateMachineExecution(sensorData, activityData, res) {
  const stateMachineInput = {
    sensor_data: sensorData || {},  // Default to an empty object if no sensor data
    activity_data: activityData || {},  // Default to an empty object if no activity data
    blackboard: {}  // Initialize with an empty blackboard (can be persisted later)
  };

  try {
    const result = await executePythonStateMachine(stateMachineInput);
    console.log('Updated blackboard from Python state machine:', result.blackboard);
    res.status(200).send({ status: 'Update processed successfully', blackboard: result.blackboard });
  } catch (error) {
    console.error('Error while executing the Python state machine:', error);
    res.status(500).send({ status: 'Error processing update', error: error.message });
  }
}

// Separate function to process and extract sensor data
function processSensorData(update) {
  const homeUtilities = update.update.home_utilities || [];

  homeUtilities.forEach((homeUtility) => {
    const houseId = homeUtility.house_id;

    // Iterate over the utilities to get component data
    homeUtility.utilities.forEach((utility) => {
      const components = utility.components || [];

      components.forEach((component) => {
        const componentName = component.component_name;
        const componentValue = component.value;
        const componentTime = component.time;

        console.log(`Extracted data: House ID: ${houseId}, Component: ${componentName}, Value: ${componentValue}, Time: ${componentTime}`);

        // Return the extracted data so it can be used by the event listener
        return { houseId, componentName, componentValue, componentTime };
      });
    });
  });
}

// Event listener for processing updates and triggering the state machine
updateEvent.on('processUpdate', async (update) => {
  console.log('Processing update:', update);

  const sensorData = update.update.home_utilities[0].utilities[0].components[0];  // Adjust based on the actual structure of your data
  const activityData = update.update.activity || 'idle';  // Default to idle if no activity

  // Prepare the input data for the state machine
  const stateMachineInput = {
    sensor_data: {
      component_name: sensorData.component_name,
      value: sensorData.value
    },
    activity_data: { activity: activityData },
    blackboard: {}  // Initialize with an empty blackboard (you can also load a persisted blackboard from a database)
  };

  try {
    // Trigger the Python state machine with the input data
    const result = await executePythonStateMachine(stateMachineInput);

    console.log('Updated blackboard from Python state machine:', result.blackboard);

    // You can now persist the updated blackboard or send the response back to the client
  } catch (error) {
    console.error('Error while executing the Python state machine:', error);
  }
});


app.post('/smart-text', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).send({ status: 'Missing text' });
  }

  console.log(`Received smart text: ${text}`);

  // Use OpenAI here
  const prompt = `Create a JSON structure based on the given text. Ensure the structure includes the necessary fields to represent the information provided. This is an sample example for reference {
    "userId": 12345,
    "message": "EVERYTIME IF Microwave door is open for more than 3 seconds SHOW Close the Microwave Door",
    "display": "Close the Microwave Door",
    "interval": "Everytime",
    "time": null,
    "delay": 3000,
    "utility_name": "Microwave",
    "component_name": "Door",
    "condition": "Open"
} also the time should be null if not mentioned, don't get confused between time and delay they both are different things example for time : {
  "userId": 12345,
  "message": "NEXT TIME 7pm on Wednesday SHOW Happy Birthday Sujendra",
  "display": "Happy Birthday Sujendra",
  "interval": "Next Time",
  "time": "2024-03-30T19:00:00.000Z",
  "utility_name": null,
  "component_name": null,
  "condition": null
} there can be reminders with no utility, component, delay, and condition like this one and also check for the 
time try to find it in the text itself otherwise try to add relevant time as in if it tomorrow input it for tomorrow's date with reference to the current date ${new Date()}, time format : 2024-03-30T19:00:00.000Z {
  "userId": 12345,
  "message": "NEXT TIME 7pm on Wednesday SHOW Happy Birthday Sujendra",
  "display": "Happy Birthday Sujendra",
  "interval": "Next Time",
  "time": "2024-03-30T19:00:00.000Z",
  "utility_name": null,
  "component_name": null,
  "condition": null
} there can be which you can't parse for those just say cannot understand as a response

  : ${text}`;
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 150,
    response_format: { type: "json_object" }
  });

  console.log('Response from OpenAI:', completion);

  // Extract the JSON object from the response
  const jsonResponse = completion.choices[0].message.content.trim();

  // Log the extracted JSON object for debugging
  console.log('Extracted JSON:', jsonResponse);

  try {
    // Parse the extracted JSON object
    const jsonData = JSON.parse(jsonResponse);

    // Log the parsed JSON data
    console.log('Parsed JSON:', jsonData);

    // Send the response immediately
    res.status(200).send({ status: 'Text processed', data: jsonData });
  } catch (error) {
    // Handle any parsing errors
    console.error('Error parsing JSON:', error);
    res.status(500).send({ status: 'Error processing text' });
  }
});

updateEvent.on('newUpdate', async (update, targetClientId) => {
  let updates = [];
  update.home_utilities.forEach(home => {
    home.utilities.forEach(utility => {
      if (utility.group === 'microwave') {
        utility.components.forEach(component => {
          updates.push({
            component_name: component.component_name,
            value: parseInt(component.value),
            time: component.time
          });
        });
      }
    });
  });

  for (const singleUpdate of updates) {
    stateLogger.info(`${singleUpdate} single update`);
    if (singleUpdate.component_name === 'power') logTimeDifference(singleUpdate);
    
    const activityDetected = stateMachine(singleUpdate, targetClientId);
    
    if (activityDetected) {
      console.log(`Food left in microwave after reheating detected for client ${targetClientId}`);
      await handleDetection(targetClientId, update);
    } else if (activityDetected === false && singleUpdate.component_name === 'doorStatus' && singleUpdate.value === 1) {
      stateLogger.info(`Door opened, removing reminders for client ${targetClientId}`);
      await removeReminders(targetClientId);
    }
  }

  const matchingReminders = await findMatchingReminders(update);
  console.log(matchingReminders, "matching reminders");
  if (matchingReminders.length > 0) {
    matchingReminders.forEach(async (reminder) => {
      if (reminder.delay) {
        await delayExecution(reminder.delay);
        console.log("delay Elapsed");
        updateEvent.emit('delayElapsed', targetClientId);
      } else {
        if (reminder.interval === 'once' && reminder.sent) {
          console.log(`Reminder already sent once, skipping for client ${targetClientId}`);
          return;
        }
        sendReminderToClient(matchingReminders, targetClientId);
        if (reminder.interval === 'once') {
          await Reminder.update({ sent: true }, { where: { id: reminder.id } });
        }
      }
    });
  }

  const sentReminders = await db.sentReminders.findAll();

  sentReminders.forEach(async (sentReminder) => {
    const reminder = await db.reminders.findOne({ where: { id: sentReminder.reminderId } });
    if (!reminder) return;

    const isMatch = update.home_utilities.some(home => {
      return home.utilities.some(utility => {
        if (utility.utility_name === reminder.utility_name) {
          return utility.components.some(component => {
            return component.component_name === reminder.component_name && component.status === reminder.condition;
          });
        }
        return false;
      });
    });

    if (reminder.type !== "stateful-activity" && !isMatch && reminder.disappearOnCondition) {
      const stickyNoteUpdate = {
        action: "remove",
        id: reminder.id.toString() + "00",
        stickyNote: {
          title: reminder.display,
          content : "",
          //content: reminder.display,
          notificationSoundID: 1007,
          instructions: []
        }
      };

      sendMessageToClient(sentReminder.clientId, stickyNoteUpdate.action, stickyNoteUpdate.stickyNote, stickyNoteUpdate.id);
      reminder.sent = false;

      await Reminder.update({ sent: false }, { where: { id: reminder.id } });
      await db.sentReminders.destroy({ where: { reminderId: reminder.id } });
    }
  });
});
updateEvent.on('handleActivityReminders', async (update, targetClientId) => {
  activityLogger.info(`Handling activity reminders event ${update.activity} ${update.activity_status} targetClient ${targetClientId}`); // Added logging statement
  
  const reminders = await db.reminders.findAll({
    where: {
      type: 'activity-based',
      sent: false
    }
  });

  activityLogger.info('Fetched activity-based reminders', { reminders }); // Added logging statement

  const matchingReminders = reminders.filter(reminder => {
    activityLogger.info(`Checking reminder: ${reminder.activity} against update activity: ${update.activity}`); // Added logging statement
    return update.activity && update.activity === reminder.activity;
  });

  activityLogger.info('Matching reminders', { matchingReminders }); // Added logging statement

  const processReminder = async (reminder, updateTimestamp) => {
    const cronTime = reminder.triggerTime
      ? new Date(new Date(updateTimestamp).getTime() + reminder.triggerTime * 1000)
      : null;

    if (cronTime) {
      scheduleReminder(cronTime, reminder, targetClientId);
    } else {
      if (reminder.interval === 'once' && reminder.sent) {
        activityLogger.info(`Reminder already sent once, skipping for client ${targetClientId}`); // Added logging statement
        return;
      }
      sendReminderToClient(reminder, targetClientId);
      activityLogger.info('Sent reminder to client', { reminder, targetClientId }); // Added logging statement
      if (reminder.interval === 'once') {
        await db.reminders.update({ sent: true }, { where: { id: reminder.id } });
        activityLogger.info('Updated reminder as sent', { reminderId: reminder.id }); // Added logging statement
      }
    }
  };

  if (matchingReminders.length > 0) {
    for (const reminder of matchingReminders) {
      const { triggerType } = reminder;
      const updateTimestamp = update.timestamp;

      if (update.activity_status === 'begin' && triggerType === 'begin') {
        await processReminder(reminder, updateTimestamp);
      } else if (update.activity_status === 'end' && triggerType === 'end') {
        await processReminder(reminder, updateTimestamp);
      }
    }
  }

  const sentReminders = await db.sentReminders.findAll();

  for (const sentReminder of sentReminders) {
    const reminder = await db.reminders.findOne({ where: { id: sentReminder.reminderId } });
    if (!reminder) continue;

    const isMatch = update.activity && update.activity === reminder.activity;

    if (!isMatch && reminder.disappearOnCondition) {
      const stickyNoteUpdate = {
        action: "remove",
        id: `${reminder.id}00`,
        stickyNote: {
          title: "Reminder",
          content: reminder.display,
          notificationSoundID: 1,
          instructions: []
        }
      };

      sendMessageToClient(sentReminder.clientId, stickyNoteUpdate.action, stickyNoteUpdate.stickyNote, stickyNoteUpdate.id);
      reminder.sent = false;

      await db.reminders.update({ sent: false }, { where: { id: reminder.id } });
      await db.sentReminders.destroy({ where: { reminderId: reminder.id } });

      activityLogger.info('Removed sticky note and updated reminder', { reminder, sentReminder }); // Added logging statement
    }
  }
});

updateEvent.on('delayElapsed', async (targetClientId) => {
  console.log("inside delay elapsed")
  updateEvent.once('newUpdate', async (update) => {
    console.log("inside new update")

    const matchingReminders = await findMatchingReminders(update);

    console.log(matchingReminders, "matching reminders")
    console.log("inside once new update")
    if (matchingReminders.length > 0) {
      matchingReminders.forEach(async (reminder) => {
        sendReminderToClient(reminder, targetClientId);
      })
    }
  });
});



async function sendReminderToClient(matchingReminder, targetClientId) {
  console.log(matchingReminder, "matchingReminder ")
  const stickyNoteUpdate = {
    action: "add",
    id: matchingReminder.id.toString() + "00",
    stickyNote: {
      title: matchingReminder.display,
      content: "",
      //content: matchingReminder.display,
      notificationSoundID: 1,
      instructions: [],
      lightCategoryId: matchingReminder.lightCategoryId
    }
  };

  sendMessageToClient(targetClientId, stickyNoteUpdate.action, stickyNoteUpdate.stickyNote, stickyNoteUpdate.id);
  matchingReminder.sent = true;
  await db.sentReminders.create({
    reminderId: matchingReminder.id,
    clientId: targetClientId
  });
}

async function delayExecution(millisecs) {
  const delayInMilliseconds = millisecs;
  await new Promise(resolve => setTimeout(resolve, delayInMilliseconds));
  console.log("inside delay execution");
}

function scheduleReminder(cronTime, reminder, targetClientId) {
  const cronExpression = `${cronTime.getSeconds()} ${cronTime.getMinutes()} ${cronTime.getHours()} ${cronTime.getDate()} ${cronTime.getMonth() + 1} *`;

  cron.schedule(cronExpression, () => {
    sendReminderToClient(reminder, targetClientId);
  }, {
    scheduled: true,
    timezone: "America/New_York"
  });
}

async function findMatchingReminders(update) {
  const reminders = await db.reminders.findAll({
    where: {
      type: 'dependent',
      sent: false
    }
  });

  console.log(reminders, "reminders")

  return reminders.filter(reminder => {
    const utilityMatch = update.home_utilities?.some(home => {
      return home.utilities.some(utility => {
        if (utility.utility_name === reminder.utility_name) {
          return utility.components.some(component => {
            return component.component_name === reminder.component_name && component.status === reminder.condition;
          });
        }
      });
    });

    const activityMatch = update.activity && update.activity === reminder.activity;

    return utilityMatch || activityMatch;
  });
}

async function findMatchingRemindersForMicrowave(update) {
  const reminders = await db.reminders.findAll({
    where: {
      type: 'stateful-activity',
      sent: false,
      utility_name: 'Microwave'  // Filter for Microwave-specific reminders
    }
  });

  return reminders.filter(reminder => {
    return update.home_utilities.some(home => {
      return home.utilities.some(utility => {
        // Ensure the utility is in the 'microwave' group
        return utility.group === 'microwave';
      });
    });
  });
}


const validate = (reminder) => {
  const invalid = [];
  const { userId, message, interval, display, time, utility_name, component_name, condition, delay, activity, triggerTime, triggerType, type, lightCategoryId } = reminder;

  if (!userId) invalid.push('userId');
  if (!message) invalid.push('message');
  if (!interval) invalid.push('interval');
  if (!display) invalid.push('display');
  if (!lightCategoryId) invalid.push('lightCategoryId');

  if (type === 'General') {
    if (!time) invalid.push('time');
    if (utility_name || component_name || condition || delay || activity || triggerTime || triggerType) {
      invalid.push('utility_name', 'component_name', 'condition', 'delay', 'activity', 'triggerTime', 'triggerType');
    }
  } else if (type === 'Utility') {
    if (!utility_name) invalid.push('utility_name');
    if (!component_name) invalid.push('component_name');
    if (!condition) invalid.push('condition');
    if (!delay) invalid.push('delay');
    if (time || activity || triggerTime || triggerType) {
      invalid.push('time', 'activity', 'triggerTime', 'triggerType');
    }
  } else if (type === 'Activity') {
    if (!activity) invalid.push('activity');
    if (!triggerTime) invalid.push('triggerTime');
    if (!triggerType) invalid.push('triggerType');
    if (time || utility_name || component_name || condition || delay) {
      invalid.push('time', 'utility_name', 'component_name', 'condition', 'delay');
    }
  }

  return invalid;
};

// app.post('/chat', authenticate, async (req, res) => {
//   const { message, sessionId } = req.body;
//   const userId = req.user.id;

//   if (!message) {
//     return res.status(400).json({ error: 'Message is required' });
//   }

//   const currentSessionId = sessionId || uuidv4();

//   try {
//     // Step 1: Find or create a chat thread for the current session
//     let thread = await db.chatThreads.findOne({ where: { id: currentSessionId } });
//     if (!thread) {
//       const newThread = {
//         id: currentSessionId,
//         userId,
//         messages: [],
//         timestamp: new Date().toISOString(),
//         sessionId: currentSessionId,
//       };
//       thread = await db.chatThreads.create(newThread);
//     }

//     // Step 2: Save the user's message to the database
//     const newMessage = {
//       id: uuidv4(),
//       role: 'user',
//       content: message,
//       sessionId: currentSessionId,
//       threadId: currentSessionId,
//       userId,
//       timestamp: new Date().toISOString(),
//     };
//     const savedMessage = await db.chatMessages.create(newMessage);

//     // Step 3: Update the thread with the new message
//     thread.messages.push(savedMessage);
//     await thread.save();

//     // Step 4: Generate the assistant's response using OpenAI
//     const prompt = _reminderPrompt;
//     const messagesForAI = [...prompt, ...thread.messages];
//     console.log(messagesForAI, "Message for ai");
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o",
//       messages: messagesForAI,
//       response_format: { type: "json_object" },
//       temperature: 1,
//       max_tokens: 2600,
//       top_p: 0.7,
//       frequency_penalty: 0,
//       presence_penalty: 0,
//     });
//     let responseMessage = completion.choices[0].message.content;
//     console.log(responseMessage, "response message")

//     // Step 5: Ensure the response contains 'assistant' and 'response' keys
//     let jsonResponse = JSON.parse(responseMessage);
//     if (!jsonResponse.hasOwnProperty('assistant')) {
//       jsonResponse['assistant'] = 'There has been an issue on our side, please try again later.';
//     }
//     if (!jsonResponse.hasOwnProperty('response')) {
//       jsonResponse['response'] = {};
//     }

//     // Step 6: Add the hasResponse flag based on reminder validation
//     const invalidFields = validate(jsonResponse.response);
//     jsonResponse.hasResponse = invalidFields.length === 0;

//     // Step 7: Save the assistant's response to the database
//     const assistantMessage = {
//       id: uuidv4(),
//       role: 'assistant',
//       content: JSON.stringify(jsonResponse),
//       sessionId: currentSessionId,
//       threadId: currentSessionId,
//       userId,
//       timestamp: new Date().toISOString(),
//     };
//     await db.chatMessages.create(assistantMessage);

//     // Step 8: Update the thread with the assistant's message
//     thread.messages.push(assistantMessage);
//     await thread.save();

//     res.status(200).json({ sessionId: currentSessionId, response: jsonResponse });
//   } catch (error) {
//     console.error('Error with OpenAI API:', error);
//     res.status(500).json({ error: 'Failed to generate response from OpenAI' });
//   }
// });

app.post('/chat', authenticate, async (req, res) => {
  const { message, sessionId } = req.body;
  const userId = req.user.id;
  const username = req.user.username;

  chatLogger.info('Received a chat request', { userId, username, message });

  if (!message) {
    chatLogger.warn('Message is missing in the request', { userId, username });
    return res.status(400).json({ error: 'Message is required' });
  }

  const currentSessionId = sessionId || uuidv4();

  try {
    let thread = await db.chatThreads.findOne({ where: { id: currentSessionId }, include: db.chatMessages });

    let formattedThreadMessages = [];

    if (thread) {
      formattedThreadMessages = thread.messages.map(msg => ({
        role: msg.role,
        content: [{ text: msg.content, type: "text" }]
      }));
    } else {
      const newThread = {
        id: currentSessionId,
        userId,
        messages: [],
        timestamp: new Date().toISOString(),
        sessionId: currentSessionId,
      };
      thread = await db.chatThreads.create(newThread);
      chatLogger.info('Created a new chat thread', { currentSessionId, userId });
    }

    const newMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      sessionId: currentSessionId,
      threadId: currentSessionId,
      userId,
      timestamp: new Date().toISOString(),
    };
    const savedMessage = await db.chatMessages.create(newMessage);

    thread.messages.push(savedMessage);
    await thread.save();

    formattedThreadMessages.push({
      role: 'user',
      content: [{ text: message, type: "text" }]
    });

    // Store the user message in the Excel file
    storeConversationInExcel(currentSessionId, userId, username, 'user', message, newMessage.timestamp);

    const prompt = _reminderPrompt;
    const messagesForAI = [...prompt, ...formattedThreadMessages];

    chatLogger.info('Messages sent to AI', { currentSessionId, userId, messagesForAI });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: messagesForAI,
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 2000,
      top_p: 0.7,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    let responseMessage = completion.choices[0].message.content;
    chatLogger.info('Received response from AI', { responseMessage });

    let jsonResponse = JSON.parse(responseMessage);
    if (!jsonResponse.hasOwnProperty('assistant')) {
      jsonResponse['assistant'] = 'There has been an issue on our side, please try again later.';
      chatLogger.error('AI response missing assistant field', { jsonResponse });
    }
    if (!jsonResponse.hasOwnProperty('response') || Object.keys(jsonResponse.response).length === 0) {
      jsonResponse['response'] = {};
    } else {
      if (jsonResponse.response.message) {
        jsonResponse.response.message = jsonResponse.response.message.replace(/\b(me|user|you)\b/gi, username);
      }
    }

    const invalidFields = validate(jsonResponse.response);
    jsonResponse.hasResponse = invalidFields.length === 0;

    const assistantMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: JSON.stringify(jsonResponse),
      sessionId: currentSessionId,
      threadId: currentSessionId,
      userId,
      timestamp: new Date().toISOString(),
    };
    await db.chatMessages.create(assistantMessage);

    thread.messages.push(assistantMessage);
    await thread.save();

    // Store the AI response in the Excel file
    storeConversationInExcel(currentSessionId, userId, username, 'assistant', assistantMessage.content, assistantMessage.timestamp);

    res.status(200).json({ sessionId: currentSessionId, response: jsonResponse });
  } catch (error) {
    chatLogger.error('Error with OpenAI API', { error });
    res.status(500).json({ error: 'Failed to generate response from OpenAI' });
  }
});

app.get('/chat/:threadId', async (req, res) => {
  const { threadId } = req.params;

  try {
    // Find the thread by its ID
    const thread = await db.chatThreads.findOne({
      where: { id: threadId },
      include: [
        {
          model: db.chatMessages,
          attributes: ['id', 'role', 'content', 'timestamp'],
          order: [['timestamp', 'ASC']], // Order messages by timestamp
        },
      ],
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Extract the messages from the thread
    const messages = thread.chatMessages.map(message => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
    }));

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
});


const ASSISTANT_ID = "asst_2wGBPPxKjK0Nn0RsGqCDzNlF";

app.post('/ask-assistant', async (req, res) => {
  const { userMessage, threadId } = req.body;

  try {
    // Step 1: Check if a thread ID is provided, if not create a new thread
    let thread;
    if (threadId) {
      thread = threadId;
    } else {
      const response = await openai.beta.threads.create();
      thread = response.id;
      console.log(thread, "thread")
    }

    // Step 2: Add the User Message to the Thread
    await openai.beta.threads.messages.create(
      thread,
      {
        role: "user",
        content: userMessage
      });

    // Step 3: Create a Run
    const response = await openai.beta.threads.runs.create(
      thread,
      {
        assistant_id: ASSISTANT_ID,
      });
    let run = response.id;

    // Step 4: Poll the Run Status
    console.log(run, "run")
    while (run.status === "queued" || run.status === "in_progress") {
      console.log(run, "run...")
      run = await openai.beta.threads.runs.retrieve(
        thread,
        {
          run_id: run,
        });
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 5: Retrieve Messages from the Thread
    const messages = await openai.beta.threads.messages.list(thread);

    console.log(messages, "messages")
    // Find the assistant's response message
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
    console.log(assistantMessage, "assistant Message")
    res.json({ response: assistantMessage.content[0].text.value, threadId: thread });
  } catch (error) {
    console.log(error, "error")
    res.status(500).json({ error: error.message });
  }
});

app.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if the role is valid
  if (role && !['user', 'superuser'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    // Check if username already exists
    const existingUsername = await db.users.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if email already exists
    const existingEmail = await db.users.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Only allow superusers to create other superusers
    if (role === 'superuser') {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Authorization token is required to create a superuser' });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const requestingUser = await db.users.findByPk(decoded.userId);

        if (!requestingUser || requestingUser.role !== 'superuser') {
          return res.status(403).json({ error: 'Only superusers can create other superusers' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Invalid authorization token' });
      }
    }

    const user = await db.users.create({ username, email, password, role: role || 'user' });
    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }

})


// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await db.users.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token, role: user.role, username: user.username });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/reminders', authenticate, async (req, res) => {
  console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>inside reminders")
  const { message, interval, time, utility_name, component_name, condition, display, delay, disappearOnCondition, activity, triggerTime, triggerType, lightCategoryId } = req.body;
  const userId = req.user.id;
  // Determine the type of the reminder
  const type = determineReminderType(utility_name, component_name, time, activity);
  console.log(time, "time...")
  // Format the time
  let formattedTime = null;
  if (time) {
    console.log(time, "time...")
    const timeDateObject = new Date(time);
    formattedTime = timeDateObject.toISOString().slice(0, 19).replace('T', ' ');
    console.log(formattedTime, "formatted time")
  }

  // Create the reminder object without setting the id field
  const newReminder = {
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
    sent: false,
    disappearOnCondition,
    activity,
    triggerTime,
    triggerType,
    lightCategoryId
  };

  try {
    // Save the new reminder to the database
    console.log("saving reminder", newReminder)
    const savedReminder = await db.reminders.create(newReminder);

    // Fetch the latest user-client mapping for the specified userId
    const userClientMap = await db.userClientMap.findOne({ where: { userId: userId } });
    if (!userClientMap) {
      return res.status(404).send({ status: 'User target device not found' });
    }

    const targetClientId = userClientMap.targetClientId;

    // If the reminder is non-dependent, schedule it to be sent at the specified time
    if (type === 'non-dependent') {
      const timeDateObject = new Date(time);
      const cronExpression = `${timeDateObject.getMinutes()} ${timeDateObject.getHours()} * * *`;  // ✅ Local time

      console.log("cronExpression:")
      console.log(cronExpression)
      cron.schedule(cronExpression, () => {
        console.log("Cron job triggered at", new Date().toISOString());
        const stickyNoteUpdate = {
          action: "add",
          id: savedReminder.id.toString() + "00",
          lightCategoryId: savedReminder.lightCategoryId,
          stickyNote: {
            title: "Reminder",
            content: newReminder.display,
            notificationSoundID: 1,
            instructions: []
          }
        };

        sendMessageToClient(targetClientId, stickyNoteUpdate.action, stickyNoteUpdate.stickyNote, stickyNoteUpdate.id);
      });
    }

    // Log the creation of the reminder
    console.log('Reminder created:', savedReminder.id);

    // Send the response with the details of the newly created reminder
    res.status(201).json(savedReminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).send({ status: 'Error creating reminder', error: error.message });
  }
});


// app.get('/reminders', authenticate, checkSuperuser, async (req, res) => {
//   try {
//     const { user } = req;
//     let reminders;

//     if (user.role === 'superuser') {
//       reminders = await db.reminders.findAll();
//     } else {
//       const ownReminders = await db.reminders.findAll({ where: { userId: user.id } });
//       const sharedReminders = await db.reminderShare.findAll({
//         where: { sharedWithUserId: user.id },
//         include: [{ model: db.reminders }]
//       });

//       reminders = [
//         ...ownReminders,
//         ...sharedReminders.map(share => share.reminder)
//       ];
//     }

//     if (!reminders || reminders.length === 0) {
//       return res.status(404).json({ error: 'No reminders found' });
//     }

//     res.json(reminders);
//   } catch (error) {
//     console.error('Error fetching reminders:', error);
//     if (error.name === 'SequelizeValidationError') {
//       return res.status(400).json({ error: 'Invalid input data' });
//     } else if (error.name === 'SequelizeDatabaseError') {
//       return res.status(500).json({ error: 'Database error' });
//     } else {
//       return res.status(500).json({ error: 'Failed to fetch reminders' });
//     }
//   }
// });

// API endpoint to get a reminder by its ID
app.get('/reminders/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const reminder = await db.reminders.findOne({ where: { id, userId: req.user.id } });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json(reminder);
  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({ error: 'Failed to fetch reminder' });
  }
});

app.put('/reminders/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { userId, message, interval, time, utility_name, component_name, condition, display, delay, disappearOnCondition, activity, triggerTime, triggerType, lightCategoryId } = req.body;

  try {
    const reminder = await db.reminders.findOne({ where: { id, userId } });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    reminder.message = message || reminder.message;
    reminder.interval = interval || reminder.interval;
    reminder.time = time || reminder.time;
    reminder.utility_name = utility_name || reminder.utility_name;
    reminder.component_name = component_name || reminder.component_name;
    reminder.condition = condition || reminder.condition;
    reminder.display = display || reminder.display;
    reminder.delay = delay || reminder.delay;
    reminder.disappearOnCondition = disappearOnCondition !== undefined ? disappearOnCondition : reminder.disappearOnCondition;
    reminder.activity = activity || reminder.activity;
    reminder.triggerTime = triggerTime || reminder.triggerTime;
    reminder.triggerType = triggerType || reminder.triggerType;
    reminder.lightCategoryId = lightCategoryId || reminder.lightCategoryId;

    await reminder.save();
    res.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});


app.delete('/reminders/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const reminder = await db.reminders.findOne({ where: { id } });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    await reminder.destroy();
    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});


app.get('/activities', async (req, res) => {
  try {
    const activities = await db.activityType.ActivityTypes.findAll();
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});


app.get('/api/users', async (req, res) => {
  try {
    const users = await db.users.findAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/userClientMappings', async (req, res) => {
  const { userId, targetClientId } = req.body;

  try {
    // Check if the userId and targetClientId are provided
    if (!userId || !targetClientId) {
      return res.status(400).json({ error: 'userId and targetClientId are required' });
    }

    // Check if the user exists
    const user = await db.users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create the user-client mapping
    const mapping = await db.userClientMap.create({ userId, targetClientId });

    res.status(201).json(mapping);
  } catch (error) {
    console.error('Error creating user-client mapping:', error);
    res.status(500).json({ error: 'Failed to create user-client mapping' });
  }
});

app.post('/api/reminderMappings', authenticate, checkSuperuser, async (req, res) => {
  try {
    const { reminderId, userId } = req.body;
    const mapping = await db.reminderUserMapping.create({ reminderId, userId });
    res.status(201).send(mapping);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.get('/api/reminderMappings', authenticate, checkSuperuser, async (req, res) => {
  try {
    const mappings = await db.reminderUserMapping.findAll();
    res.status(200).send(mappings);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.get('/api/reminderMappings/:id', authenticate, checkSuperuser, async (req, res) => {
  try {
    const id = req.params.id;
    const mapping = await db.reminderUserMapping.findByPk(id);
    if (mapping) {
      res.status(200).send(mapping);
    } else {
      res.status(404).send({ message: `Cannot find ReminderUserMapping with id=${id}` });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.put('/api/reminderMappings/:id', authenticate, checkSuperuser, async (req, res) => {
  try {
    const id = req.params.id;
    const [updated] = await db.reminderUserMapping.update(req.body, {
      where: { id: id }
    });
    if (updated) {
      const updatedMapping = await db.reminderUserMapping.findByPk(id);
      res.status(200).send(updatedMapping);
    } else {
      res.status(404).send({ message: `Cannot update ReminderUserMapping with id=${id}` });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.delete('/api/reminderMappings/:id', authenticate, checkSuperuser, async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await db.reminderUserMapping.destroy({
      where: { id: id }
    });
    if (deleted) {
      res.status(200).send({ message: `ReminderUserMapping with id=${id} deleted` });
    } else {
      res.status(404).send({ message: `Cannot delete ReminderUserMapping with id=${id}` });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// GET /api/users
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.users.findAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const newUser = await db.users.create({
      username,
      email,
      password, // The model will hash this automatically
      role
    });

    const userWithoutPassword = { ...newUser.get(), password: undefined };
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// PUT /api/users/:id
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, password } = req.body;

    const updateData = { username, email, role };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const [updated] = await db.users.update(updateData, { where: { id } });

    if (updated) {
      const updatedUser = await db.users.findByPk(id);
      const userWithoutPassword = { ...updatedUser.get(), password: undefined };
      res.json(userWithoutPassword);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
});

// DELETE /api/users/:id
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.users.destroy({ where: { id } });
    if (deleted) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.post('/api/share-reminder', authenticate, checkSuperuser, async (req, res) => {
  const { reminderId, userIds } = req.body;
  try {
    const shareMappings = userIds.map(userId => ({
      reminderId,
      sharedWithUserId: userId
    }));

    await db.reminderUserMapping.bulkCreate(shareMappings, { ignoreDuplicates: true });
    res.json({ message: 'Reminder shared successfully' });
  } catch (error) {
    console.error('Error sharing reminder:', error);
    res.status(500).json({ error: 'Failed to share reminder' });
  }
});


app.get('/api/shared-reminders',authenticate, async (req, res) => {
  try {
    const sharedReminders = await db.reminderShare.findAll({
      where: { sharedWithUserId: req.user.id },
      include: [{
        model: db.reminders,
        include: [{
          model: db.users,
          attributes: ['username', 'email']
        }]
      }]
    });
    res.json(sharedReminders.map(share => ({
      ...share.reminder.toJSON(),
      sharedBy: share.reminder.user
    })));
  } catch (error) {
    console.error('Error fetching shared reminders:', error);
    res.status(500).json({ error: 'Failed to fetch shared reminders' });
  }
});

// Get reminders shared with the current user
app.delete('/api/unshare-reminder/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const reminder = await db.reminders.findByPk(id);
    if (!reminder || reminder.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to unshare this reminder' });
    }

    await db.reminderShare.destroy({
      where: {
        reminderId: id,
        sharedWithUserId: userId
      }
    });
    res.json({ message: 'Reminder unshared successfully' });
  } catch (error) {
    console.error('Error unsharing reminder:', error);
    res.status(500).json({ error: 'Failed to unshare reminder' });
  }
});

// Create a new reminder
app.post('/api/reminderLibrary', authenticate, checkSuperuser, async (req, res) => {
  try {
    const { text } = req.body;
    const reminder = await db.reminderLibrary.create({ text });
    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reminders
app.get('/api/reminderLibrary', authenticate, async (req, res) => {
  try {
    const reminders = await db.reminderLibrary.findAll();
    res.status(200).json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a reminder
app.put('/api/reminderLibrary/:id', authenticate, checkSuperuser, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const reminder = await db.reminderLibrary.findByPk(id);
    if (reminder) {
      reminder.text = text;
      await reminder.save();
      res.status(200).json(reminder);
    } else {
      res.status(404).json({ error: 'Reminder not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a reminder
app.delete('/api/reminderLibrary/:id', authenticate, checkSuperuser, async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await db.reminderLibrary.findByPk(id);
    if (reminder) {
      await reminder.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Reminder not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// (async () => {
//   try {
//     const assistant = await openai.beta.assistants.create({
//       name: "Reminder Creator",
//       instructions: `You are a text to json extractor. 
//       Ensure the structure includes the necessary fields to represent the information provided. 
//       Edge cases/Instructions:
//       time field can be null if the user has not provided only if there is utility and component present.
//       time should be given as timestamp for example in this format : YYYY-MM-DDTHH:MM:SS.SSSZ
//       delay field specifies the seconds, it can be null : example : 3000
//       Prompt the user asking for the specific missing information in a user friendly way
//       Utility, component, delay and condition field can be null if the user has provided time
//       Prompt the user with a userfriendly message saying you cannot do it, or you didn't understand when asked for anything other than a reminder
//       Add relevant time as in if it tomorrow input it for tomorrow's date with reference to the current date


//       sample example :
//       UserInput : everytime if Microwave door is open for more than 3 seconds show close the Microwave Door
//       System response : {
//           "userId": 12345,
//           "message": "EVERYTIME IF Microwave door is open for more than 3 seconds SHOW Close the Microwave Door",
//           "display": "Close the Microwave Door",
//           "interval": "Everytime",
//           "time": null,
//           "delay": 3000,
//           "utility_name": "Microwave",
//           "component_name": "Door",
//           "condition": "Open"
//       }, 
//       User input : next time 7pm on Wednesday show Happy Birthday Sujendra
//       System response :
//       {

//         "userId": 12345,
//         "message": "NEXT TIME 7pm on Wednesday SHOW Happy Birthday Sujendra",
//         "display": "Happy Birthday Sujendra",
//         "interval": "Next Time",
//         "time": "2024-03-30T19:00:00.000Z",
//         "delay": null,
//         "utility_name": null,
//         "component_name": null,
//         "condition": null
//       }, 
//       User input : next time 7pm on Wednesday show Happy Birthday Sujendra
//       System response :
//       {
//         "userId": 12345,
//         "message": "NEXT TIME 7pm on Wednesday SHOW Happy Birthday Sujendra",
//         "display": "Happy Birthday Sujendra",
//         "interval": "Next Time",
//         "time": "2024-03-30T19:00:00.000Z",
//         "utility_name": null,
//         "component_name": null,
//         "condition": null
//       } `,
//       model: "gpt-3.5-turbo"
//     });

//     // Display the assistant details as JSON
//     console.log(JSON.stringify(assistant, null, 2));
//   } catch (error) {
//     console.error("Error creating assistant:", error);
//   }
// })();

app.post('/api/userClientMappings', async (req, res) => {
  const { userId, targetClientId } = req.body;

  // Validate input
  if (!userId || !targetClientId) {
    return res.status(400).json({ error: 'userId and targetClientId are required' });
  }

  try {
    // Check if the user exists
    const user = await db.users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the target client exists
    const targetClient = await db.users.findByPk(targetClientId);
    if (!targetClient) {
      return res.status(404).json({ error: 'Target client not found' });
    }

    // Insert the user-client mapping
    const userClientMapping = await db.userClientMap.create({
      userId,
      targetClientId
    });

    res.status(201).json(userClientMapping);
  } catch (error) {
    console.error('Error creating user-client mapping:', error);
    res.status(500).json({ error: 'Failed to create user-client mapping' });
  }
});

app.get('/api/light-categories', (req, res) => {
  res.json(lightCategoriesOptions);
});

const stateLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => moment().tz('America/New_York').format('YYYY-MM-DD HH:mm:ss z') // Eastern Time Zone
    }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'state_machine.log' })
  ]
});

const activityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => moment().tz('America/New_York').format('YYYY-MM-DD HH:mm:ss z') // Eastern Time Zone
    }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'activity-based-reminders.log' })
  ]
});

const chatLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: () => moment().tz('America/New_York').format('YYYY-MM-DD HH:mm:ss z')  }), // Eastern Time Zone
    winston.format.json() // Log in JSON format for easier parsing
  ),
  transports: [
    new winston.transports.File({ filename: 'chat.log' }) // Log to chat.log
  ],
});

function logTimeDifference(update) {
  if (lastPowerComponentTime) {
    const timeDiff = new Date(update.time) - new Date(lastPowerComponentTime);
    stateLogger.info(`${update} Time difference between the current and the previous power component: ${timeDiff} ms`);
  }

  if (update.component_name === 'power') {
    lastPowerComponentTime = update.time;
  }
} 


function initializeClientState(clientId) {
  if (!clientState[clientId]) {
    stateLogger.info(` ~ clientState ${clientState}`)
    clientState[clientId] = {
      state: 'Idle',
      detected: false,
      lastPowerDecreaseTime: null,
      reheatCount: 0,
      lastUpdateTime: new Date(),
      sentReminders: new Set(),  // Track sent reminders to avoid duplicates
      powerCycleDetected: false
    };
  }
}

function stateMachine(update, clientId) {
  stateLogger.info(`~ clientId ${clientId}`)
  initializeClientState(clientId);

  const stateData = clientState[clientId];
  const { state, lastPowerDecreaseTime, reheatCount, powerCycleDetected } = stateData;

  stateLogger.info(`Processing update for client ${clientId}: ${JSON.stringify(update)}`);
  stateLogger.info(`Current state: ${state}, Reheat Count: ${reheatCount}`);

  switch (state) {
    case 'Idle':
      if (update.component_name === 'doorStatus' && update.value === 1) {
        stateData.state = 'Door Opened';
        stateLogger.info('State changed to Door Opened');
      }
      break;

    case 'Door Opened':
      if (update.component_name === 'doorStatus' && update.value === 0) {
        stateData.state = 'Door Closed Before Reheating';
        stateLogger.info('State changed to Door Closed Before Reheating');
      }
      break;

    case 'Door Closed Before Reheating':
      if (update.component_name === 'power' && update.value > 500) {
        stateData.state = 'Power Increase';
        stateLogger.info('State changed to Power Increase');
      }
      break;

    case 'Power Increase':
      if (update.component_name === 'power' && update.value < 500) {
        stateData.state = 'Reheated';
        stateData.reheatCount += 1;
        stateLogger.info(`State changed to Reheated, Reheat Count: ${stateData.reheatCount}`);
        stateData.lastPowerDecreaseTime = new Date();
        stateData.powerCycleDetected = true;
      }
      break;

    case 'Reheated':
      if (update.component_name === 'doorStatus' && update.value === 1) {
        stateData.state = 'Idle';  // Reset if the door is opened after reheating
        stateData.lastPowerDecreaseTime = null;
        stateData.reheatCount = 0;
        stateData.powerCycleDetected = false;
        stateLogger.info('State reset to Idle and reheat count reset');
        return false;  // Indicate that the reminder should be removed
      } else if (lastPowerDecreaseTime && (new Date() - new Date(lastPowerDecreaseTime)) > 2000) { // 2 seconds
        if (stateData.reheatCount > 1 || stateData.powerCycleDetected) {  // Detect for multiple reheats or power cycle
          stateLogger.info('Detection occurred');
          stateData.detected = true;
          stateData.state = 'Idle';  // Reset state after detection
          stateData.powerCycleDetected = false;  // Reset power cycle detection
          return true;  // Indicate that a detection has occurred
        }
      }
      break;

    default:
      stateLogger.info(`Unhandled state: ${state}`);
      break;
  }

  stateData.lastUpdateTime = new Date();
  return stateData.detected;
}
async function removeReminders(clientId) {
  const sentReminders = await db.sentReminders.findAll({ where: { clientId } });

  for (const sentReminder of sentReminders) {
    const reminder = await db.reminders.findOne({ where: { id: sentReminder.reminderId } });
    stateLogger.info(`${reminder}`)
    if (!reminder) continue; // Skip if the reminder does not exist in the dataStore

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

    sendMessageToClient(clientId, stickyNoteUpdate.action, stickyNoteUpdate.stickyNote, stickyNoteUpdate.id);
    reminder.sent = false;

    // Update the 'sent' status of the reminder in the database
    await db.reminders.update({ sent: false }, { where: { id: reminder.id } });
    // Remove the sent reminder from the database
    await db.sentReminders.destroy({ where: { reminderId: reminder.id, clientId } });
  }
}

// Periodically check for detection condition and send reminders if necessary
setInterval(async () => {
  for (const clientId in clientState) {
    const stateData = clientState[clientId];
    if (stateData.state === 'Reheated' && stateData.lastPowerDecreaseTime) {
      //if ((new Date() - stateData.lastPowerDecreaseTime) > 1000) { // 2 seconds
        //if (stateData.reheatCount > 1 || stateData.powerCycleDetected) {  // Detect for multiple reheats or power cycle
          stateLogger.info(`Periodic check detection occurred for client ${clientId}`);
          await handleDetection(clientId, { home_utilities: [{ utilities: [{ group: 'microwave', components: [] }] }] });
       // }
      //}
    }
  }
}, 1000); // Check every second

async function handleDetection(clientId, update) {
  const stateData = clientState[clientId];
  const reminders = await findMatchingRemindersForMicrowave(update);
  stateLogger.info(`inside handle detection`)
  if (reminders.length > 0) {
    for (const reminder of reminders) {
      //if (!stateData.sentReminders.has(reminder.id)) {
        await sendReminderToClient(reminder, clientId);
        stateData.sentReminders.add(reminder.id);
        stateLogger.info(`Reminder sent and state reset to Idle for client ${clientId}`);
      //}
    }
  }

  // Reset state after sending reminder
  stateData.state = 'Idle';
  stateData.detected = false;
  stateData.lastPowerDecreaseTime = null;
  stateData.reheatCount = 0;
  stateData.powerCycleDetected = false;
}

app.put('/reset-reminders', async (req, res) => {
  try {
    await db.reminders.update({ sent: false }, {
      where: {
        id: [33, 11]
      }
    });

    res.status(200).send('Reminders updated successfully.');
  } catch (error) {
    console.error('Error updating reminders:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/healthcheck', (req,res)=>{
  res.status(200)
})

// // Add this endpoint to your Express app
// app.post('/notify', async (req, res) => {
//   const { clientId, message } = req.body;
//   console.log(req.body, clientId, message,">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>inside notify")
//   // Validate input
//   if (!clientId || !message) {
//     return res.status(400).json({ error: 'clientId and message are required' });
//   }

//   // Find the WebSocket connections for the clientId
//   const clients = connectedClients[clientId];

//   if (!clients || (Array.isArray(clients) && clients.length === 0)) {
//     return res.status(404).json({ error: `No connected client found for clientId: ${clientId}` });
//   }

//   // Send the message to all connected clients for this clientId
//   try {
//     if (Array.isArray(clients)) {
//       clients.forEach((ws) => {
//         if (ws.readyState === WebSocket.OPEN) {
//           ws.send(JSON.stringify({ type: 'notification', message }));
//         }
//       });
//     } else if (clients.readyState === WebSocket.OPEN) {
//       clients.send(JSON.stringify({ type: 'notification', message }));
//     }

//     return res.json({ success: true, message: `Notification sent to clientId: ${clientId}` });
//   } catch (error) {
//     console.error('Error sending message:', error);
//     return res.status(500).json({ error: 'Failed to send message' });
//   }
// });

// Add new endpoint for notifications
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

// Add test device endpoint
app.post('/test-device', (req, res) => {
  const { clientId, action = "add", testId = "100" } = req.body;

  if (!clientId) {
    return res.status(400).json({ error: 'clientId is required' });
  }

  try {
    // Test sticky note data
    const testStickyNote = {
      title: "Test Device Connection",
      content: "",
      notificationSoundID: 1,
      instructions: [],
      lightCategoryId: 3
    };

    // Create message based on action
    const message = {
      action: action,
      id: testId,
      lightCategoryId: action === "add" ? 3 : 0,
      msg: action === "add" ? {
        title: testStickyNote.title,
        content: testStickyNote.content,
        notificationSoundID: testStickyNote.notificationSoundID,
        instructions: testStickyNote.instructions
      } : null
    };

    // Check if client is connected
    const clientWsList = connectedClients[clientId];
    if (!clientWsList || clientWsList.length === 0) {
      return res.status(404).json({ error: `No connected client found for clientId: ${clientId}` });
    }

    // Send test message
    sendMessageToClient(clientId, action, testStickyNote, testId);
    
    return res.json({ 
      success: true, 
      message: `Test message sent to ${clientId}`,
      clientConnected: true,
      messageDetails: message
    });

  } catch (error) {
    console.error('Error in test-device:', error);
    return res.status(500).json({ error: 'Failed to send test message' });
  }
});


// Create a superuser if none exists
async function createDefaultSuperuser() {
  try {
    const superusers = await db.users.findAll({ where: { role: 'superuser' } });
    if (superusers.length === 0) {
      const superuser = await db.users.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'adminpassword',
        role: 'superuser',
      });
      console.log('Default superuser created:', superuser.toJSON());
    }
  } catch (error) {
    console.error('Error creating default superuser:', error);
  }
}


// Call the function to create a superuser if none exists
createDefaultSuperuser();

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Example usage:
// testSendMessageToDevice("home123", "add", "100");
// testSendMessageToDevice("home123", "remove", "200");

module.exports = { server, app };