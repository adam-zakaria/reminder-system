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
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const openai = new OpenAI(process.env.OPENAI_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
const port = process.env.PORT || 7628;

app.use(cors());
app.use(bodyParser.json());

// Routes
const userRoutes = require('./routes/userRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const chatRoutes = require('./routes/chatRoutes');
const deviceRoutes = require('./routes/deviceRoutes');  // Previously utilityRoutes
const activityRoutes = require('./routes/activityRoutes');

app.use('/users', userRoutes);
app.use('/reminders', reminderRoutes);
app.use('/chat', chatRoutes);
app.use('/device', deviceRoutes);  // Device and light categories
app.use('/activities', activityRoutes);

// WebSocket server and other setup
const wss = new WebSocket.Server({ noServer: true });
const connectedClients = {};

// Event-driven updates, WebSocket handling, and scheduled reminders logic (already in your code)
