const { FORCE } = require('sequelize/lib/index-hints');
const dbConfig = require('../config/db.config.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.reminders = require('./reminder.model.js')(sequelize, Sequelize);
db.userClientMap = require('./userClientMap.model.js')(sequelize, Sequelize);
db.delayTable = require('./delayTable.model.js')(sequelize, Sequelize);
db.sentReminders = require('./sentReminder.model.js')(sequelize, Sequelize);
db.users = require('./user.model.js')(sequelize, Sequelize);
db.chatMessages = require('./chatMessage.model.js')(sequelize, Sequelize);
db.chatThreads = require('./chatThread.model.js')(sequelize, Sequelize);
db.activityType = require('./activityType.model.js')(sequelize, Sequelize);
db.reminderUserMapping = require('./reminderUserMapping.model.js')(sequelize, Sequelize);
db.reminderLibrary = require('./reminderLibrary.model.js')(sequelize, Sequelize);

// Define associations
db.users.hasMany(db.userClientMap, { foreignKey: 'userId' });
db.userClientMap.belongsTo(db.users, { foreignKey: 'userId' });

db.users.hasMany(db.chatThreads, { foreignKey: 'userId' });
db.chatThreads.belongsTo(db.users, { foreignKey: 'userId' });

db.chatThreads.hasMany(db.chatMessages, { foreignKey: 'threadId' });
db.chatMessages.belongsTo(db.chatThreads, { foreignKey: 'threadId' });

db.users.hasMany(db.reminders, { as: 'createdReminders', foreignKey: 'createdBy' });
db.users.hasMany(db.reminders, { as: 'sharedReminders', foreignKey: 'userId' });
db.reminders.belongsTo(db.users, { as: 'creator', foreignKey: 'createdBy' });
db.reminders.belongsTo(db.users, { as: 'sharedWith', foreignKey: 'userId' });

db.reminders.belongsToMany(db.users, { through: db.reminderUserMapping, foreignKey: 'reminderId', otherKey: 'userId' });
db.users.belongsToMany(db.reminders, { through: db.reminderUserMapping, foreignKey: 'userId', otherKey: 'reminderId' });

// Sync all models and insert default record
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized successfully!');
    if (typeof db.activityType.initializeActivityTypes === 'function') {
      return db.activityType.initializeActivityTypes();
    }
  })
  .then(() => {
    console.log('Activity types initialized successfully!');
  })
  .catch(error => {
    console.error('Error synchronizing database:', error);
  });

module.exports = {
  db
};
