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


const openai = new OpenAI(process.env.OPENAI_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET

const app = express();
const port = 7628;

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

// Middleware to authenticate and attach user to request
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.users.findByPk(decoded.userId);
    console.log(user,"user")
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

function determineReminderType(utilityName, componentName, time, activity) {
  if (activity && activity.trim() !== '') {
    return 'activity-based';
  } else if (utilityName && componentName && (!time || time.trim() === '')) {
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

const checkSuperuser = (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);

  db.users.findByPk(decoded.userId)
    .then(user => {
      if (user.role !== 'superuser') {
        console.log("=============",user)
        return res.status(403).json({ error: 'Access denied' });
      }
      next();
    })
    .catch(error => {
      console.error('Error checking user role:', error);
      res.status(500).json({ error: 'Failed to check user role' });
    });
};


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
        msg: null
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

        console.log(sharedReminders,"shared reminders")

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

  console.log(`Update from Oracle for client`, update);

  // Hardcoded userId for demonstration purposes
  const userId = "137ce759-00af-42d8-9210-c3f784afbb80";

  // Fetch the latest reminder for the specified userId from the database
  const userClientMap = await db.userClientMap.findOne({ where: { userId: userId } });
  if (!userClientMap) {
    return res.status(404).send({ status: 'User not found' });
  }

  const targetClientId = userClientMap.targetClientId;

  // Send the response immediately
  res.status(200).send({ status: 'Update received' });

  // Emit events to handle the update
  if (update.activity) {
    updateEvent.emit('handleActivityReminders', update, targetClientId);
  } else if (update.update) {
    updateEvent.emit('newUpdate', update, targetClientId);
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
  const matchingReminders = await findMatchingReminders(update);
  console.log(matchingReminders, "matching reminders")
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

  const sentReminders = await db.sentReminders.findAll();

  // Check for each sent reminder if its condition is still met
  sentReminders.forEach(async (sentReminder) => {
    const reminder = await db.reminders.findOne({ where: { id: sentReminder.reminderId } });
    if (!reminder) return; // Skip if the reminder does not exist in the dataStore

    const isMatch = update.home_utilities.some(home => {
      return home.utilities.some(utility => {
        if (utility.utility_name === reminder.dataValues.utility_name) {
          return utility.components.some(component => {
            if (component.component_name === reminder.dataValues.component_name && component.status === reminder.dataValues.condition) {
              return true;
            }
            return false;
          });
        }
        return false;
      });
    })

    // If the reminder's condition is not met, remove it from the client device
    if (!isMatch && reminder.disappearOnCondition) {
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

      // Update the 'sent' status of the reminder in the database
      await db.reminders.update({ sent: false }, { where: { id: reminder.id } });
      // Remove the sent reminder from the database
      await db.sentReminders.destroy({ where: { reminderId: reminder.id } });
    }
  });
});

updateEvent.on('handleActivityReminders', async (update, targetClientId) => {
  const reminders = await db.reminders.findAll({
    where: {
      type: 'activity-based',
      sent: false
    }
  });

  console.log(reminders, "activity-based reminders");

  const matchingReminders = reminders.filter(reminder => {
    console.log(reminder.dataValues, "reminder", reminder.dataValues.activity, update.activity);
    return update.activity && update.activity === reminder.dataValues.activity;
  });

  console.log(matchingReminders, "matching reminders");

  const processReminder = (reminder, updateTimestamp) => {
    const cronTime = reminder.triggerTime
      ? new Date(new Date(updateTimestamp).getTime() + reminder.triggerTime * 1000)
      : null;

    if (cronTime) {
      scheduleReminder(cronTime, reminder, targetClientId);
    } else {
      sendReminderToClient(reminder, targetClientId);
    }
  };

  if (matchingReminders.length > 0) {
    for (const reminder of matchingReminders) {
      const { triggerType } = reminder.dataValues;
      const updateTimestamp = update.timestamp;

      if (update.activity_status === 'begin' && triggerType === 'begin') {
        processReminder(reminder.dataValues, updateTimestamp);
      } else if (update.activity_status === 'end' && triggerType === 'end') {
        processReminder(reminder.dataValues, updateTimestamp);
      }
    }
  }

  const sentReminders = await db.sentReminders.findAll();

  for (const sentReminder of sentReminders) {
    const reminder = await db.reminders.findOne({ where: { id: sentReminder.reminderId } });
    if (!reminder) continue;

    const isMatch = update.activity && update.activity === reminder.dataValues.activity;

    if (!isMatch && reminder.dataValues.disappearOnCondition) {
      const stickyNoteUpdate = {
        action: "remove",
        id: `${reminder.dataValues.id}00`,
        stickyNote: {
          title: "Reminder",
          content: reminder.dataValues.display,
          notificationSoundID: 1,
          instructions: []
        }
      };

      sendMessageToClient(sentReminder.clientId, stickyNoteUpdate.action, stickyNoteUpdate.stickyNote, stickyNoteUpdate.id);
      reminder.dataValues.sent = false;

      await db.reminders.update({ sent: false }, { where: { id: reminder.dataValues.id } });
      await db.sentReminders.destroy({ where: { reminderId: reminder.dataValues.id } });
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

app.post('/chat',authenticate, async (req, res) => {
  const { message, sessionId } = req.body;
  const userId = req.user.id; 

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const currentSessionId = sessionId || uuidv4();

  try {
    // Step 1: Find or create a chat thread for the current session
    let thread = await db.chatThreads.findOne({ where: { id: currentSessionId } });
    if (!thread) {
      const newThread = {
        id: currentSessionId,
        userId,
        messages: [],
        timestamp: new Date().toISOString(),
        sessionId: currentSessionId,
      };
      thread = await db.chatThreads.create(newThread);
    }

    // Step 2: Save the user's message to the database
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

    // Step 3: Update the thread with the new message
    thread.messages.push(savedMessage);
    await thread.save();

    // Step 4: Generate the assistant's response using OpenAI
    const prompt = _reminderPrompt;
    const messagesForAI = [...prompt, ...thread.messages];
    console.log(messagesForAI, "Message for ai");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messagesForAI,
      response_format: { type: "json_object" },
      temperature: 0.59,
      max_tokens: 2600,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    let responseMessage = completion.choices[0].message.content;
    console.log(responseMessage,"response message")

    // Step 5: Ensure the response contains 'assistant' and 'response' keys
    let jsonResponse = JSON.parse(responseMessage);
    if (!jsonResponse.hasOwnProperty('assistant')) {
      jsonResponse['assistant'] = 'There has been an issue on our side, please try again later.';;
    }
    if (!jsonResponse.hasOwnProperty('response')) {
      jsonResponse['response'] = {};
    }

    // Step 6: Save the assistant's response to the database
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

    // Step 7: Update the thread with the assistant's message
    thread.messages.push(assistantMessage);
    await thread.save();

    res.status(200).json({ sessionId: currentSessionId, response: jsonResponse });
  } catch (error) {
    console.error('Error with OpenAI API:', error);
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
  const { message, interval, time, utility_name, component_name, condition, display, delay, disappearOnCondition, activity, triggerTime, triggerType, lightCategoryId } = req.body;
  const userId = req.user.id; 
  // Determine the type of the reminder
  const type = determineReminderType(utility_name, component_name, time, activity);

  // Format the time
  let formattedTime = null;
  if (time) {
    const timeDateObject = new Date(time);
    formattedTime = timeDateObject.toISOString().slice(0, 19).replace('T', ' ');
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
      const cronExpression = `${timeDateObject.getUTCMinutes()} ${timeDateObject.getUTCHours()} * * *`;
      cron.schedule(cronExpression, () => {
        const stickyNoteUpdate = {
          action: "add",
          id: savedReminder.id.toString() + "00",
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


app.get('/api/shared-reminders', authenticate, async (req, res) => {
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

module.exports = { server, app };
