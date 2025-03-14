const cron = require('node-cron');
const { db } = require('../models');

// Create a new reminder
async function createReminder(reminderData) {
  const reminder = await db.reminders.create(reminderData);
  return reminder;
}

// Find matching reminders based on update data
async function findMatchingReminders(update) {
  const reminders = await db.reminders.findAll({ where: { type: 'dependent', sent: false } });
  return reminders.filter(reminder => {
    const utilityMatch = update.home_utilities?.some(home => {
      return home.utilities.some(utility => {
        return utility.utility_name === reminder.utility_name &&
          utility.components.some(component => component.component_name === reminder.component_name && component.status === reminder.condition);
      });
    });
    const activityMatch = update.activity && update.activity === reminder.activity;
    return utilityMatch || activityMatch;
  });
}

// Schedule reminder using cron
function scheduleReminder(reminder, cronExpression, targetClientId, sendReminderToClient) {
  cron.schedule(cronExpression, () => {
    sendReminderToClient(reminder, targetClientId);
  }, {
    scheduled: true,
    timezone: "America/New_York"
  });
}

module.exports = { createReminder, findMatchingReminders, scheduleReminder };
