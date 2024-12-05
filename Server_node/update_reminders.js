// update_reminders.js
require('dotenv').config(); // To load environment variables from .env file
const { db } = require('./models/index.js'); // Adjust the path if necessary

async function updateReminders() {
  try {
    await db.sequelize.authenticate();
    console.log('Connection has been established successfully.');

    await db.reminders.update({ sent: false }, {
      where: {
        id: [33, 11]
      }
    });

    console.log('Reminders updated successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await db.sequelize.close();
  }
}

updateReminders();
